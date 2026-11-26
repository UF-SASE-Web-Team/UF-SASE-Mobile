-- Keep event check-in codes away from members.
--
-- The events select policy lets every signed-in member read every event row,
-- and the app selected `*`, so each phone received every event's 6-digit
-- checkin_code. Anyone could read it and check in without attending.
--
-- Members (and anon, which RLS still shows no rows) now get every events
-- column except checkin_code. The
-- check_in RPC is security definer, so it still compares against the code, and
-- officers read it through get_event_checkin_code().
--
-- Column grants are explicit: a column added to events later is hidden from
-- the app until it is added to the grant below.
revoke select on table public.events from anon, authenticated;

grant select (
  id,
  title,
  type,
  description,
  starts_at,
  ends_at,
  location_name,
  address,
  lat,
  lng,
  flyer_url,
  rsvp,
  program_id,
  points_value,
  checkin_opens_at,
  checkin_closes_at,
  created_at
) on table public.events to anon, authenticated;

-- The event's check-in code, for officers. Members get "Officers only".
create or replace function public.get_event_checkin_code(p_event_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_officer() then
    raise exception 'Officers only' using errcode = '42501';
  end if;

  return (select e.checkin_code from public.events e where e.id = p_event_id);
end;
$$;

revoke execute on function public.get_event_checkin_code(uuid) from public, anon;
grant execute on function public.get_event_checkin_code(uuid) to authenticated;
