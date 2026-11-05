-- Function for authenticated users to check in to an event.
-- 'code' payloads are matched against the event's 6-digit checkin_code,
-- 'qr' payloads against the shared checkin_qr_url in app_settings.
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

  if now() < coalesce(v_event.checkin_opens_at, v_event.starts_at)
    or now() > coalesce(v_event.checkin_closes_at, v_event.ends_at) then
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
