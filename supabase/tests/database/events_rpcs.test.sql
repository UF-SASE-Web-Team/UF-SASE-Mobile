begin;
select * from no_plan();

-- 1. Verify toggle_event_rsvp function exists
select has_function(
  'public',
  'toggle_event_rsvp',
  array['uuid'],
  'Function public.toggle_event_rsvp(uuid) should exist'
);

-- 2. Test unauthenticated call fails
set local role anon;
select throws_ok(
  format('select public.toggle_event_rsvp(%L::uuid)', gen_random_uuid()),
  'permission denied for function toggle_event_rsvp',
  'Anon role cannot execute toggle_event_rsvp'
);

reset role;

-- 3. Authenticated tests
do $$
declare
  v_alice_id uuid;
  v_future_id uuid := gen_random_uuid();
  v_past_id uuid := gen_random_uuid();
  v_toggled boolean;
  v_count integer;
begin
  select id into v_alice_id from auth.users where email = 'alice@gmail.com';

  -- Future event (RSVP open)
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_future_id,
    'Future Event',
    now() + interval '2 days',
    now() + interval '2 days 2 hours',
    'Reitz Union',
    '123456'
  );

  -- Past/started event (RSVP closed)
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_past_id,
    'Started Event',
    now() - interval '1 hour',
    now() + interval '1 hour',
    'Turlington',
    '654321'
  );

  -- Authenticate as Alice
  execute format('set local role authenticated');
  execute format('set local "request.jwt.claim.sub" to %L', v_alice_id::text);
  execute format('set local "request.jwt.claims" to %L', json_build_object('sub', v_alice_id::text, 'role', 'authenticated')::text);

  -- Toggle ON
  v_toggled := public.toggle_event_rsvp(v_future_id);
  if not v_toggled then
    raise exception 'Expected toggle_event_rsvp to return true when inserting RSVP';
  end if;

  select count(*) into v_count from public.event_rsvps where event_id = v_future_id;
  if v_count <> 1 then
    raise exception 'Expected 1 RSVP record, found %', v_count;
  end if;

  -- Toggle OFF
  v_toggled := public.toggle_event_rsvp(v_future_id);
  if v_toggled then
    raise exception 'Expected toggle_event_rsvp to return false when deleting RSVP';
  end if;

  select count(*) into v_count from public.event_rsvps where event_id = v_future_id;
  if v_count <> 0 then
    raise exception 'Expected 0 RSVP records after toggle off, found %', v_count;
  end if;

  -- Attempt toggle on event where RSVP window is closed
  begin
    perform public.toggle_event_rsvp(v_past_id);
    raise exception 'Expected exception on closed RSVP window';
  exception when others then
    if sqlerrm not like '%RSVP window is closed%' then
      raise exception 'Unexpected error: %', sqlerrm;
    end if;
  end;
end;
$$;

select pass('Authenticated user can toggle RSVP on and off, and closed window is enforced');

select * from finish();
rollback;
