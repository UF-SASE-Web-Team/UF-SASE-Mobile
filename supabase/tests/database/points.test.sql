begin;
select plan(11);

select has_function('public', 'get_points_summary', array[]::text[], 'get_points_summary() exists');
select has_function('public', 'get_points_leaderboard', array['integer'], 'get_points_leaderboard(integer) exists');

-- Anon cannot call the RPCs, and nobody can call the internal ranking helper.
set local role anon;
select throws_ok(
  'select * from public.get_points_leaderboard(10)',
  'permission denied for function get_points_leaderboard',
  'Anon cannot read the leaderboard'
);
reset role;

set local role authenticated;
select throws_ok(
  'select * from public.semester_points_ranked()',
  'permission denied for function semester_points_ranked',
  'Authenticated members cannot call the internal ranking helper'
);
reset role;

-- Fixture: a fresh current term so seeded check-ins do not affect the numbers.
update public.academic_terms set is_current = false where is_current;
insert into public.academic_terms (id, name, start_date, is_current)
values
  ('test-term', 'Test Term', current_date - 30, true),
  ('test-next', 'Next Term', current_date + 60, false);

create temp table ids as
select
  (select id from auth.users where email = 'alice@gmail.com') as alice,
  (select id from auth.users where email = 'bob@gmail.com') as bob,
  gen_random_uuid() as this_term_a,
  gen_random_uuid() as this_term_b,
  gen_random_uuid() as last_term;
grant select on ids to authenticated;

insert into public.events (id, title, starts_at, ends_at, location_name, points_value)
select this_term_a, 'This Term A', now() - interval '3 days', now() - interval '3 days' + interval '1 hour', 'Reitz', 2 from ids
union all
select this_term_b, 'This Term B', now() - interval '2 days', now() - interval '2 days' + interval '1 hour', 'Reitz', 1 from ids
union all
select last_term, 'Last Term', now() - interval '90 days', now() - interval '90 days' + interval '1 hour', 'Reitz', 5 from ids;

-- Drop seeded check-ins so totals only reflect this fixture (rolled back at the end).
delete from public.check_ins where user_id in (select alice from ids union select bob from ids);

insert into public.check_ins (event_id, user_id)
select this_term_a, alice from ids
union all select this_term_b, alice from ids
union all select last_term, alice from ids
union all select this_term_b, bob from ids;

-- Alice: 3 points this term (2 + 1), 8 all-time (+5 last term).
select set_config('request.jwt.claims', json_build_object('sub', alice, 'role', 'authenticated')::text, true) from ids;
set local role authenticated;

select results_eq(
  'select total_points, semester_points, semester_rank, ranked_members, term_name from public.get_points_summary()',
  $$ values (8, 3, 1, 2, 'Test Term'::text) $$,
  'Summary returns all-time total, term points, rank, member count and term name'
);

select results_eq(
  'select member_rank, user_id, points, is_me from public.get_points_leaderboard(10)',
  $$ select 1, alice, 3, true from ids union all select 2, bob, 1, false from ids $$,
  'Leaderboard ranks members by points earned this term only'
);

select is(
  (select count(*)::integer from public.get_points_leaderboard(0)),
  1,
  'A limit below 1 is clamped to 1'
);
reset role;

-- Bob: outside a top-1 leaderboard, so his own row is appended.
select set_config('request.jwt.claims', json_build_object('sub', bob, 'role', 'authenticated')::text, true) from ids;
set local role authenticated;

select results_eq(
  'select member_rank, is_me from public.get_points_leaderboard(1)',
  $$ values (1, false), (2, true) $$,
  'Caller outside the top is appended with their real rank'
);

select results_eq(
  'select semester_points, semester_rank from public.get_points_summary()',
  $$ values (1, 2) $$,
  'Summary reports the caller''s own rank'
);
reset role;

-- Bob blocks Alice: she disappears from his leaderboard, ranks are not renumbered.
insert into public.profile_blocks (blocker_id, blocked_id) select bob, alice from ids;
set local role authenticated;

select results_eq(
  'select member_rank, is_me from public.get_points_leaderboard(10)',
  $$ values (2, true) $$,
  'Blocked members are hidden from the caller''s leaderboard'
);
reset role;

-- A member with no check-ins this term has no rank.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text,
  true
);
set local role authenticated;
select results_eq(
  'select total_points, semester_points, semester_rank from public.get_points_summary()',
  $$ values (0, 0, null::integer) $$,
  'Members without check-ins get zeros and no rank'
);
reset role;

select * from finish();
rollback;
