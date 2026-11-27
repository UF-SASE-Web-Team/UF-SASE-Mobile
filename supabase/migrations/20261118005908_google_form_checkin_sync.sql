-- Mirror app check-ins into the SASE Google check-in form.
--
-- Members without the app check in through a Google Form. So officers see one
-- list, every app check-in also submits that form for the member. An insert on
-- check_ins calls the google-form-checkin Edge Function through pg_net; the
-- function reads the form's live options and posts the response. A slow or
-- failing Google call never blocks the check-in itself.

-- 1. The member's UF email. Login emails are often personal, and the form asks
--    for the UF address, so it is stored privately next to the UFID.
alter table public.profile_private
  add column uf_email text,
  add constraint profile_private_uf_email_format
    check (uf_email is null or uf_email ~* '^[^@[:space:]]+@ufl\.edu$');

comment on table public.profile_private is
  'Owner-only member details (UFID, UF email). Never exposed to other members.';

-- 2. Per check-in form state. attended_this_year is the member's own answer to
--    the form's "attended a SASE event this school year?" question; it stays
--    null when the app did not need to ask.
alter table public.check_ins
  add column attended_this_year boolean,
  add column form_submitted_at timestamptz,
  add column form_submit_error text;

-- 3. School years run from August 1 (UF local time).
create or replace function public.school_year_start(p_at timestamptz default now())
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select (
    date_trunc('year', (p_at at time zone 'America/New_York') - interval '7 months')
    + interval '7 months'
  ) at time zone 'America/New_York';
$$;

-- 4. Whether the signed-in member already checked in to something this school
--    year. If so, the app skips asking them.
create or replace function public.has_checked_in_this_school_year()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.check_ins
    where user_id = (select auth.uid())
      and checked_in_at >= public.school_year_start(now())
  );
$$;

grant execute on function public.has_checked_in_this_school_year() to authenticated;
revoke execute on function public.has_checked_in_this_school_year() from public, anon;

-- 5. check_in now takes the member's answer. It is only kept when the database
--    has no earlier check-in this school year; otherwise the answer is "yes".
drop function public.check_in(uuid, public.checkin_method, text);

create function public.check_in(
  p_event_id uuid,
  p_method public.checkin_method,
  p_payload text,
  p_attended_this_year boolean default null
)
returns public.check_ins
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_payload text := trim(p_payload);
  v_event public.events;
  v_expected text;
  v_attended boolean;
  v_check_in public.check_ins;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Profile not found';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  if now() < coalesce(v_event.checkin_opens_at, v_event.starts_at - interval '30 minutes')
    or now() > coalesce(v_event.checkin_closes_at, v_event.ends_at + interval '30 minutes') then
    raise exception 'Check-in is not open';
  end if;

  if p_method = 'code' then
    v_expected := v_event.checkin_code;
  elsif p_method = 'qr' then
    select value into v_expected from public.app_settings where key = 'checkin_qr_url';
  else
    raise exception 'Unsupported check-in method';
  end if;

  if v_expected is null or v_payload is distinct from v_expected then
    raise exception 'Invalid check-in payload';
  end if;

  if exists (
    select 1 from public.check_ins
    where user_id = v_uid and checked_in_at >= public.school_year_start(now())
  ) then
    v_attended := true;
  else
    v_attended := p_attended_this_year;
  end if;

  insert into public.check_ins (event_id, user_id, method, attended_this_year)
  values (p_event_id, v_uid, p_method, v_attended)
  on conflict (event_id, user_id) do nothing
  returning * into v_check_in;

  if v_check_in.id is null then
    raise exception 'Already checked in';
  end if;

  return v_check_in;
end;
$$;

grant execute on function public.check_in(uuid, public.checkin_method, text, boolean) to authenticated;
revoke execute on function public.check_in(uuid, public.checkin_method, text, boolean) from public, anon;

-- 6. Settings. app_settings has no client policies, so only definer functions
--    and the service role can read these. Off until an officer enables it.
insert into public.app_settings (key, value)
values
  ('google_form_checkin_enabled', 'false'),
  ('google_form_checkin_form_id', '1FAIpQLScBj2IuMWxYg285fwgrhvNp2uVtwpLu9i3jrAn4FbnibZCVTA')
on conflict (key) do nothing;

-- 7. Hand each new member check-in to the Edge Function. The function URL and
--    shared secret live in Vault (google_form_sync_url, google_form_sync_secret)
--    so the secret is never in a readable table.
create or replace function public.handle_check_in_form_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled text;
  v_url text;
  v_secret text;
begin
  if new.user_id is null then
    return new;
  end if;

  select value into v_enabled
  from public.app_settings
  where key = 'google_form_checkin_enabled';

  if coalesce(lower(trim(v_enabled)), 'false') <> 'true' then
    return new;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets
  where name = 'google_form_sync_url';

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'google_form_sync_secret';

  if coalesce(trim(v_url), '') = '' or coalesce(trim(v_secret), '') = '' then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('check_in_id', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-form-sync-secret', v_secret
    )
  );

  return new;
exception
  when others then
    -- Never fail a check-in because the form sync could not be queued.
    return new;
end;
$$;

revoke execute on function public.handle_check_in_form_sync() from public, anon, authenticated;

create trigger trg_check_in_form_sync
after insert on public.check_ins
for each row
execute function public.handle_check_in_form_sync();
