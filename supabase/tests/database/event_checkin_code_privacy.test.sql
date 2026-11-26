begin;
select plan(7);

create temp table ids as
select
  (select id from auth.users where email = 'olivia@gmail.com') as officer,
  (select id from auth.users where email = 'bob@gmail.com') as member,
  gen_random_uuid() as event_id;
grant select on ids to authenticated;

insert into public.events (id, title, starts_at, ends_at, location_name, checkin_code)
select event_id, 'Code privacy', now() - interval '10 minutes', now() + interval '1 hour', 'Marston', '135790'
from ids;

-- Members ----------------------------------------------------------------
select set_config('request.jwt.claim.sub', (select member::text from ids), true);
set local role authenticated;

select throws_ok(
  $$select checkin_code from public.events$$,
  '42501',
  null,
  'Members cannot read check-in codes'
);

select throws_ok(
  $$select * from public.events$$,
  '42501',
  null,
  'Members cannot select every column, which would include the code'
);

select is(
  (select title from public.events where id = (select event_id from ids)),
  'Code privacy',
  'Members can still read the rest of an event'
);

select throws_ok(
  $$select public.get_event_checkin_code((select event_id from ids))$$,
  '42501',
  'Officers only',
  'Members cannot fetch the code through the RPC'
);

select lives_ok(
  $$select public.check_in((select event_id from ids), 'code', '135790', true)$$,
  'Members can still check in with the code'
);

reset role;

-- Officers ---------------------------------------------------------------
select set_config('request.jwt.claim.sub', (select officer::text from ids), true);
set local role authenticated;

select is(
  public.get_event_checkin_code((select event_id from ids)),
  '135790',
  'Officers can read an event''s check-in code'
);

select is(
  public.get_event_checkin_code(gen_random_uuid()),
  null,
  'Unknown events have no code'
);

reset role;

select * from finish();
rollback;
