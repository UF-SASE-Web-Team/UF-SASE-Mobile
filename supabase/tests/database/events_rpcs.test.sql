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

reset role;

-- 4. Test automatic default check-in window and check-in behavior
do $$
declare
  v_alice_id uuid;
  v_default_event_id uuid := gen_random_uuid();
  v_custom_event_id uuid := gen_random_uuid();
  v_early_event_id uuid := gen_random_uuid();
  v_late_event_id uuid := gen_random_uuid();
  v_too_early_event_id uuid := gen_random_uuid();
  v_too_late_event_id uuid := gen_random_uuid();
  v_event public.events;
  v_custom_open timestamptz := now() - interval '2 hours';
  v_custom_close timestamptz := now() + interval '5 hours';
  v_ci public.check_ins;
begin
  select id into v_alice_id from auth.users where email = 'alice@gmail.com';

  -- A. Insert event with no checkin window specified
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_default_event_id,
    'Default Window Event',
    now() + interval '1 day',
    now() + interval '1 day 2 hours',
    'Reitz Union',
    '111111'
  );

  select * into v_event from public.events where id = v_default_event_id;
  if v_event.checkin_opens_at <> v_event.starts_at - interval '30 minutes' then
    raise exception 'Expected checkin_opens_at to default to 30 min before starts_at, got %', v_event.checkin_opens_at;
  end if;
  if v_event.checkin_closes_at <> v_event.ends_at + interval '30 minutes' then
    raise exception 'Expected checkin_closes_at to default to 30 min after ends_at, got %', v_event.checkin_closes_at;
  end if;

  -- B. Insert event with explicit custom checkin window
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code, checkin_opens_at, checkin_closes_at
  ) values (
    v_custom_event_id,
    'Custom Window Event',
    now() + interval '1 hour',
    now() + interval '2 hours',
    'Reitz Union',
    '222222',
    v_custom_open,
    v_custom_close
  );

  select * into v_event from public.events where id = v_custom_event_id;
  if v_event.checkin_opens_at <> v_custom_open then
    raise exception 'Expected custom checkin_opens_at to be preserved, got %', v_event.checkin_opens_at;
  end if;
  if v_event.checkin_closes_at <> v_custom_close then
    raise exception 'Expected custom checkin_closes_at to be preserved, got %', v_event.checkin_closes_at;
  end if;

  -- C. Prepare test events for check-in before switching to authenticated user
  -- C1. Early window (event starts in 15 min; doors open 30 min before)
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_early_event_id,
    'Early Check-in Event',
    now() + interval '15 minutes',
    now() + interval '1 hour 15 minutes',
    'Reitz Union',
    '333333'
  );

  -- C2. Extended after-event window (event ended 15 min ago; closes 30 min after)
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_late_event_id,
    'Late Check-in Event',
    now() - interval '1 hour 15 minutes',
    now() - interval '15 minutes',
    'Reitz Union',
    '444444'
  );

  -- C3. Too early (starts in 45 min; opens in 15 min)
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_too_early_event_id,
    'Too Early Event',
    now() + interval '45 minutes',
    now() + interval '1 hour 45 minutes',
    'Reitz Union',
    '555555'
  );

  -- C4. Too late (ended 45 min ago; closed 15 min ago)
  insert into public.events (
    id, title, starts_at, ends_at, location_name, checkin_code
  ) values (
    v_too_late_event_id,
    'Too Late Event',
    now() - interval '2 hours',
    now() - interval '45 minutes',
    'Reitz Union',
    '666666'
  );

  -- Authenticate as Alice to test check_in RPC
  execute format('set local role authenticated');
  execute format('set local "request.jwt.claim.sub" to %L', v_alice_id::text);
  execute format('set local "request.jwt.claims" to %L', json_build_object('sub', v_alice_id::text, 'role', 'authenticated')::text);

  -- C1. Check-in during early window
  v_ci := public.check_in(v_early_event_id, 'code', '333333');
  if v_ci.id is null then
    raise exception 'Expected check-in to succeed during 30 min window before event start';
  end if;

  -- C2. Check-in during extended after-event window
  v_ci := public.check_in(v_late_event_id, 'code', '444444');
  if v_ci.id is null then
    raise exception 'Expected check-in to succeed during 30 min window after event end';
  end if;

  -- C3. Check-in fails when too early
  begin
    perform public.check_in(v_too_early_event_id, 'code', '555555');
    raise exception 'Expected exception when checking in more than 30 min before event';
  exception when others then
    if sqlerrm not like '%Check-in is not open%' then
      raise exception 'Unexpected error when checking in too early: %', sqlerrm;
    end if;
  end;

  -- C4. Check-in fails when too late
  begin
    perform public.check_in(v_too_late_event_id, 'code', '666666');
    raise exception 'Expected exception when checking in more than 30 min after event';
  exception when others then
    if sqlerrm not like '%Check-in is not open%' then
      raise exception 'Unexpected error when checking in too late: %', sqlerrm;
    end if;
  end;
end;
$$;

select pass('Automatic 30 min before and after check-in window is enforced in events and check_in RPC');

reset role;

select * from finish();
rollback;
