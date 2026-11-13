begin;
select * from no_plan();

-- Anonymous visitors have no access to moderation data
set local role anon;
select throws_ok(
  $$insert into public.profile_blocks (blocker_id, blocked_id)
    values (gen_random_uuid(), gen_random_uuid())$$,
  '42501',
  null,
  'Anon role cannot block members'
);
select throws_ok(
  $$insert into public.profile_reports (reporter_id, reported_id, reason)
    values (gen_random_uuid(), gen_random_uuid(), 'spam')$$,
  '42501',
  null,
  'Anon role cannot report members'
);
select is(
  (select count(*) from public.profile_reports),
  0::bigint,
  'Anon role cannot read reports'
);
reset role;

-- Act as Alice
do $$
declare
  v_alice_id uuid;
begin
  select id into v_alice_id from auth.users where email = 'alice@gmail.com';
  execute 'set local role authenticated';
  execute format('set local "request.jwt.claim.sub" to %L', v_alice_id::text);
  execute format('set local "request.jwt.claims" to %L', json_build_object('sub', v_alice_id::text, 'role', 'authenticated')::text);
end $$;

-- Reports
select lives_ok(
  $$insert into public.profile_reports (reported_id, reason)
    select id, 'harassment' from public.profiles where username = 'bob'$$,
  'Members can report another member'
);

select is(
  (select count(*) from public.profile_reports),
  0::bigint,
  'Members cannot read reports, including their own'
);

select throws_ok(
  $$insert into public.profile_reports (reported_id, reason)
    select id, 'spam' from public.profiles where username = 'alice'$$,
  '23514',
  null,
  'Members cannot report themselves'
);

select throws_ok(
  $$insert into public.profile_reports (reporter_id, reported_id, reason)
    select b.id, a.id, 'spam' from public.profiles a, public.profiles b
    where a.username = 'alice' and b.username = 'bob'$$,
  '42501',
  null,
  'Members cannot file a report in another member''s name'
);

-- Blocks
select lives_ok(
  $$insert into public.profile_blocks (blocked_id)
    select id from public.profiles where username = 'bob'$$,
  'Members can block another member'
);

select is(
  (select count(*) from public.profile_blocks),
  1::bigint,
  'Members can read their own blocks'
);

select throws_ok(
  $$insert into public.profile_blocks (blocked_id)
    select id from public.profiles where username = 'alice'$$,
  '23514',
  null,
  'Members cannot block themselves'
);

-- Act as Bob
do $$
declare
  v_bob_id uuid;
begin
  select id into v_bob_id from public.profiles where username = 'bob';
  execute format('set local "request.jwt.claim.sub" to %L', v_bob_id::text);
  execute format('set local "request.jwt.claims" to %L', json_build_object('sub', v_bob_id::text, 'role', 'authenticated')::text);
end $$;

select is(
  (select count(*) from public.profile_blocks),
  0::bigint,
  'Members cannot see who has blocked them'
);

delete from public.profile_blocks;

-- Back to Alice: her block survived Bob's delete, and she can lift it herself
do $$
declare
  v_alice_id uuid;
begin
  select id into v_alice_id from public.profiles where username = 'alice';
  execute format('set local "request.jwt.claim.sub" to %L', v_alice_id::text);
  execute format('set local "request.jwt.claims" to %L', json_build_object('sub', v_alice_id::text, 'role', 'authenticated')::text);
end $$;

select is(
  (select count(*) from public.profile_blocks),
  1::bigint,
  'Members cannot remove another member''s block'
);

delete from public.profile_blocks;

select is(
  (select count(*) from public.profile_blocks),
  0::bigint,
  'Members can unblock'
);

reset role;

select * from finish();
rollback;
