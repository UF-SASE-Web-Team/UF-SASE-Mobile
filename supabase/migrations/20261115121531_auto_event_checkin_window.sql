-- Migration: Automatic check-in window defaulting to 30 min before and 30 min after event
-- 1. Relax checkin window constraint to permit check-in closing after ends_at
alter table public.events
  drop constraint if exists events_checkin_window;

alter table public.events
  add constraint events_checkin_window check (
    checkin_opens_at is null or checkin_closes_at is null
    or (checkin_closes_at > checkin_opens_at)
  );

-- 2. Trigger function to automatically default check-in window
create or replace function public.set_default_event_checkin_window()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    if new.checkin_opens_at is null then
      new.checkin_opens_at := new.starts_at - interval '30 minutes';
    end if;
    if new.checkin_closes_at is null then
      new.checkin_closes_at := new.ends_at + interval '30 minutes';
    end if;
  elsif TG_OP = 'UPDATE' then
    if new.checkin_opens_at is null then
      new.checkin_opens_at := new.starts_at - interval '30 minutes';
    elsif new.starts_at is distinct from old.starts_at and new.checkin_opens_at = old.checkin_opens_at then
      if old.checkin_opens_at = old.starts_at - interval '30 minutes' then
        new.checkin_opens_at := new.starts_at - interval '30 minutes';
      end if;
    end if;

    if new.checkin_closes_at is null then
      new.checkin_closes_at := new.ends_at + interval '30 minutes';
    elsif new.ends_at is distinct from old.ends_at and new.checkin_closes_at = old.checkin_closes_at then
      if old.checkin_closes_at = old.ends_at + interval '30 minutes' then
        new.checkin_closes_at := new.ends_at + interval '30 minutes';
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.set_default_event_checkin_window() from public, anon, authenticated;

drop trigger if exists trigger_set_default_event_checkin_window on public.events;
create trigger trigger_set_default_event_checkin_window
  before insert or update of starts_at, ends_at, checkin_opens_at, checkin_closes_at
  on public.events
  for each row
  execute function public.set_default_event_checkin_window();

-- 3. Backfill existing events where check-in window is null
update public.events
set
  checkin_opens_at = coalesce(checkin_opens_at, starts_at - interval '30 minutes'),
  checkin_closes_at = coalesce(checkin_closes_at, ends_at + interval '30 minutes')
where checkin_opens_at is null or checkin_closes_at is null;

-- 4. Update check_in function with fallback to 30 min before and after event
create or replace function public.check_in(
  p_event_id uuid,
  p_method public.checkin_method,
  p_payload text
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

  insert into public.check_ins (event_id, user_id, method)
  values (p_event_id, v_uid, p_method)
  on conflict (event_id, user_id) do nothing
  returning * into v_check_in;

  if v_check_in.id is null then
    raise exception 'Already checked in';
  end if;

  return v_check_in;
end;
$$;

grant execute on function public.check_in(uuid, public.checkin_method, text) to authenticated;
revoke execute on function public.check_in(uuid, public.checkin_method, text) from public, anon;

-- 5. Update toggle_event_rsvp function with fallback to 30 min before event
create or replace function public.toggle_event_rsvp(p_event_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.events;
  v_is_rsvped boolean;
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

  if now() >= coalesce(v_event.checkin_opens_at, v_event.starts_at - interval '30 minutes') then
    raise exception 'RSVP window is closed';
  end if;

  select exists (
    select 1 from public.event_rsvps
    where event_id = p_event_id and user_id = v_uid
  ) into v_is_rsvped;

  if v_is_rsvped then
    delete from public.event_rsvps
    where event_id = p_event_id and user_id = v_uid;
    return false;
  else
    insert into public.event_rsvps (event_id, user_id)
    values (p_event_id, v_uid);
    return true;
  end if;
end;
$$;

grant execute on function public.toggle_event_rsvp(uuid) to authenticated;
revoke execute on function public.toggle_event_rsvp(uuid) from public, anon;

-- 6. Update event_rsvps RLS policies with fallback
drop policy if exists "rsvp before check-in opens" on public.event_rsvps;
create policy "rsvp before check-in opens" on public.event_rsvps
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.events e
      where e.id = event_rsvps.event_id
        and now() < coalesce(e.checkin_opens_at, e.starts_at - interval '30 minutes'))
  );

drop policy if exists "un-rsvp before check-in opens" on public.event_rsvps;
create policy "un-rsvp before check-in opens" on public.event_rsvps
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.events e
      where e.id = event_rsvps.event_id
        and now() < coalesce(e.checkin_opens_at, e.starts_at - interval '30 minutes'))
  );
