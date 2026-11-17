begin;
select plan(10);

-- Old check-in based functions are gone; the ledger RPCs exist.
select hasnt_function('public', 'get_points_summary', 'Superseded get_points_summary is dropped');
select hasnt_function('public', 'get_points_leaderboard', 'Superseded get_points_leaderboard is dropped');
select has_function('public', 'get_leaderboard', array['text', 'integer'], 'get_leaderboard(text, int) exists');

-- Signed-out callers cannot read the leaderboard or anyone's totals.
set local role anon;
select throws_ok(
  'select * from public.get_leaderboard(null, 10)',
  'permission denied for function get_leaderboard',
  'Anon cannot read the leaderboard'
);
select throws_ok(
  format('select public.get_user_points_total(%L::uuid, null)', gen_random_uuid()),
  'permission denied for function get_user_points_total',
  'Anon cannot read point totals'
);
reset role;

-- Trigger functions are not part of the API.
select ok(
  not has_function_privilege('authenticated', 'public.handle_check_in_points()', 'execute'),
  'Members cannot call the check-in points trigger function directly'
);

-- Fixture: fresh ledger for two members in a test term.
insert into public.academic_terms (id, name, start_date, is_current)
values ('test-term', 'Test Term', current_date - 30, false);

create temp table ids as
select
  (select id from auth.users where email = 'alice@gmail.com') as alice,
  (select id from auth.users where email = 'bob@gmail.com') as bob,
  gen_random_uuid() as event_id;
grant select on ids to authenticated;

insert into public.events (id, title, starts_at, ends_at, location_name, points_value)
select event_id, 'Test Social', now() - interval '2 days', now() - interval '2 days' + interval '1 hour', 'Reitz', 3
from ids;

-- A check-in creates exactly one ledger entry worth the event's points.
insert into public.check_ins (event_id, user_id) select event_id, alice from ids;
select is(
  (select sum(amount)::int from public.point_transactions pt, ids
   where pt.user_id = ids.alice and pt.event_id = ids.event_id),
  3,
  'Checking in awards the event points once'
);

-- Give both members points in the test term so they rank 1 and 2.
insert into public.point_transactions (user_id, amount, category, title, academic_term, reference_type, reference_id)
select alice, 5, 'commitment'::public.point_category, 'Test bonus', 'test-term', 'test', 'alice' from ids
union all
select bob, 2, 'commitment'::public.point_category, 'Test bonus', 'test-term', 'test', 'bob' from ids;

-- Bob blocks Alice: she is hidden from his leaderboard and he keeps rank 2.
insert into public.profile_blocks (blocker_id, blocked_id) select bob, alice from ids;
select set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true) from ids;
set local role authenticated;

select results_eq(
  $$ select rank::int, points::int from public.get_leaderboard('test-term', 10) $$,
  $$ values (2, 2) $$,
  'Blocked members are hidden and ranks are not renumbered'
);
reset role;

-- Alice still sees the full ranking. Her 3-point check-in also landed in the
-- test term (the latest term starting before the event), so she has 5 + 3.
select set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true) from ids;
set local role authenticated;
select results_eq(
  $$ select rank::int, points::int from public.get_leaderboard('test-term', 10) $$,
  $$ values (1, 8), (2, 2) $$,
  'Members see everyone they have not blocked'
);
select is(
  (select count(*)::int from public.get_leaderboard('test-term', 1)),
  1,
  'The limit is respected'
);
reset role;

select * from finish();
rollback;
