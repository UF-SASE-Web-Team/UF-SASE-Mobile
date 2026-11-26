-- Officer admin tools: manage events, links and flyers, see attendance and
-- Google Form status, resend form submissions, and check members in by hand.
--
-- "Officer" is profiles.role = 'officer'. Roles are changed in the Supabase
-- dashboard (or with the service role), never by members themselves.

-- 1. Members can no longer change their own role. Before this, the profile
--    update policy let any member set role = 'officer' on themselves.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user in ('authenticated', 'anon') then
    raise exception 'Roles can only be changed by an admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger prevent_self_role_change
  before update of role on public.profiles
  for each row execute function public.prevent_self_role_change();

-- 2. Whether the signed-in member is an officer.
create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'officer'
  );
$$;

grant execute on function public.is_officer() to authenticated;
revoke execute on function public.is_officer() from public, anon;

-- 3. Officers manage events and their links. Events that already have
--    check-ins can't be deleted (check_ins keeps its foreign key), so points
--    are never lost by accident.
create policy "officers can create events"
  on public.events for insert
  to authenticated
  with check ((select public.is_officer()));

create policy "officers can update events"
  on public.events for update
  to authenticated
  using ((select public.is_officer()))
  with check ((select public.is_officer()));

create policy "officers can delete events"
  on public.events for delete
  to authenticated
  using ((select public.is_officer()));

create policy "officers can create event links"
  on public.event_links for insert
  to authenticated
  with check ((select public.is_officer()));

create policy "officers can update event links"
  on public.event_links for update
  to authenticated
  using ((select public.is_officer()))
  with check ((select public.is_officer()));

create policy "officers can delete event links"
  on public.event_links for delete
  to authenticated
  using ((select public.is_officer()));

-- 4. Officers upload flyers to public-assets/event-flyers/. The bucket itself
--    still enforces WebP and 500 KB.
create policy "officers can upload event flyers"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'event-flyers'
    and (select public.is_officer())
  );

create policy "officers can replace event flyers"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'event-flyers'
    and (select public.is_officer())
  );

create policy "officers can delete event flyers"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'public-assets'
    and (storage.foldername(name))[1] = 'event-flyers'
    and (select public.is_officer())
  );

-- 5. Queue a check-in's Google Form submission. Shared by the insert trigger
--    and the officer "Resend" action.
create or replace function public.queue_check_in_form_sync(p_check_in_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled text;
  v_url text;
  v_secret text;
begin
  select value into v_enabled
  from public.app_settings
  where key = 'google_form_checkin_enabled';

  if coalesce(lower(trim(v_enabled)), 'false') <> 'true' then
    return false;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'google_form_sync_url';

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'google_form_sync_secret';

  if coalesce(trim(v_url), '') = '' or coalesce(trim(v_secret), '') = '' then
    return false;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('check_in_id', p_check_in_id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-form-sync-secret', v_secret
    )
  );
  return true;
end;
$$;

revoke execute on function public.queue_check_in_form_sync(uuid) from public, anon, authenticated;

create or replace function public.handle_check_in_form_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is not null then
    perform public.queue_check_in_form_sync(new.id);
  end if;
  return new;
exception
  when others then
    -- Never fail a check-in because the form sync could not be queued.
    return new;
end;
$$;

-- 6. Attendance for one event, with each check-in's Google Form status.
--    form_status: 'submitted', 'failed' (see form_submit_error), 'pending'
--    (queued), or 'off' when the form sync is turned off.
create or replace function public.get_event_attendance(p_event_id uuid)
returns table (
  check_in_id uuid,
  user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  method public.checkin_method,
  checked_in_at timestamptz,
  form_status text,
  form_submit_error text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sync_on boolean := coalesce(
    (select lower(trim(value)) = 'true' from public.app_settings
     where key = 'google_form_checkin_enabled'),
    false
  );
begin
  if not public.is_officer() then
    raise exception 'Officers only' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.user_id,
    coalesce(p.full_name, 'Deleted member'),
    p.username,
    p.avatar_url,
    c.method,
    c.checked_in_at,
    case
      when c.form_submitted_at is not null then 'submitted'
      when c.form_submit_error is not null then 'failed'
      when not v_sync_on then 'off'
      else 'pending'
    end,
    c.form_submit_error
  from public.check_ins c
  left join public.profiles p on p.id = c.user_id
  where c.event_id = p_event_id
  order by c.checked_in_at desc;
end;
$$;

grant execute on function public.get_event_attendance(uuid) to authenticated;
revoke execute on function public.get_event_attendance(uuid) from public, anon;

-- 7. Resend a check-in's Google Form submission (e.g. after the member adds
--    their UF email). Returns false when the sync is turned off.
create or replace function public.resend_check_in_form(p_check_in_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_check_in public.check_ins;
begin
  if not public.is_officer() then
    raise exception 'Officers only' using errcode = '42501';
  end if;

  select * into v_check_in from public.check_ins where id = p_check_in_id;
  if not found or v_check_in.user_id is null then
    raise exception 'Check-in not found';
  end if;
  if v_check_in.form_submitted_at is not null then
    raise exception 'Already submitted to the form';
  end if;

  update public.check_ins set form_submit_error = null where id = p_check_in_id;
  return public.queue_check_in_form_sync(p_check_in_id);
end;
$$;

grant execute on function public.resend_check_in_form(uuid) to authenticated;
revoke execute on function public.resend_check_in_form(uuid) from public, anon;

-- 8. Officers check a member in by hand ('manual'), for anyone who couldn't
--    scan. Works outside the check-in window; the form sync runs as usual.
create or replace function public.officer_check_in(p_event_id uuid, p_user_id uuid)
returns public.check_ins
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_check_in public.check_ins;
begin
  if not public.is_officer() then
    raise exception 'Officers only' using errcode = '42501';
  end if;
  if not exists (select 1 from public.events where id = p_event_id) then
    raise exception 'Event not found';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Member not found';
  end if;

  insert into public.check_ins (event_id, user_id, method)
  values (p_event_id, p_user_id, 'manual')
  on conflict (event_id, user_id) do nothing
  returning * into v_check_in;

  if v_check_in.id is null then
    raise exception 'Already checked in';
  end if;
  return v_check_in;
end;
$$;

grant execute on function public.officer_check_in(uuid, uuid) to authenticated;
revoke execute on function public.officer_check_in(uuid, uuid) from public, anon;
