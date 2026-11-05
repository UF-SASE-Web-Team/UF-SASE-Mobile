-- Function for authenticated users to toggle their RSVP status for an event.
-- If an RSVP exists, it is deleted and the function returns false.
-- If no RSVP exists, it is inserted and the function returns true.
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

  if now() >= coalesce(v_event.checkin_opens_at, v_event.starts_at) then
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
