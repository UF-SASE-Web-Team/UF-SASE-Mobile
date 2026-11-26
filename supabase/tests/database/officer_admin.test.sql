begin;
select plan(17);

create temp table ids as
select
  (select id from auth.users where email = 'olivia@gmail.com') as officer,
  (select id from auth.users where email = 'bob@gmail.com') as member,
  gen_random_uuid() as event_id;
grant select on ids to authenticated;

-- Members ----------------------------------------------------------------
select set_config('request.jwt.claim.sub', (select member::text from ids), true);
set local role authenticated;

select throws_ok(
  $$update public.profiles set role = 'officer' where id = auth.uid()$$,
  '42501',
  'Roles can only be changed by an admin',
  'Members cannot promote themselves to officer'
);

select lives_ok(
  $$update public.profiles set bio = 'Still editable' where id = auth.uid()$$,
  'Members can still edit the rest of their profile'
);

select is(public.is_officer(), false, 'A member is not an officer');

select throws_ok(
  $$insert into public.events (title, starts_at, ends_at, location_name)
    values ('Sneaky', now(), now() + interval '1 hour', 'Nowhere')$$,
  '42501',
  null,
  'Members cannot create events'
);

select throws_ok(
  $$select * from public.get_event_attendance(gen_random_uuid())$$,
  '42501',
  'Officers only',
  'Members cannot see attendance'
);

select throws_ok(
  $$select public.officer_check_in(gen_random_uuid(), auth.uid())$$,
  '42501',
  'Officers only',
  'Members cannot check people in by hand'
);

reset role;

-- Officers ---------------------------------------------------------------
select set_config('request.jwt.claim.sub', (select officer::text from ids), true);
set local role authenticated;

select is(public.is_officer(), true, 'An officer is an officer');

select lives_ok(
  $$insert into public.events (id, title, starts_at, ends_at, location_name, points_value)
    select event_id, 'Officer GBM', now() + interval '1 day', now() + interval '1 day 2 hours',
      'Reitz Union', 2 from ids$$,
  'Officers can create events'
);

select is(
  (select checkin_opens_at from public.events where id = (select event_id from ids)),
  (select starts_at - interval '30 minutes' from public.events where id = (select event_id from ids)),
  'New events still get the automatic check-in window'
);

update public.events set title = 'Officer GBM (moved)' where id = (select event_id from ids);
select is(
  (select title from public.events where id = (select event_id from ids)),
  'Officer GBM (moved)',
  'Officers can edit events'
);

select lives_ok(
  $$insert into public.event_links (event_id, title, url)
    select event_id, 'Slides', 'https://example.com/slides' from ids$$,
  'Officers can add event links'
);

select is(
  (public.officer_check_in((select event_id from ids), (select member from ids))).method,
  'manual'::public.checkin_method,
  'Officers can check a member in by hand, even before check-in opens'
);

select throws_ok(
  $$select public.officer_check_in((select event_id from ids), (select member from ids))$$,
  'P0001',
  'Already checked in',
  'A member cannot be checked in twice'
);

select is(
  (select form_status from public.get_event_attendance((select event_id from ids))),
  'off',
  'Attendance shows the form sync is off for the check-in'
);

select is(
  public.resend_check_in_form(
    (select check_in_id from public.get_event_attendance((select event_id from ids)))
  ),
  false,
  'Resend reports that the form sync is turned off'
);

select throws_ok(
  $$delete from public.events where id = (select event_id from ids)$$,
  '23503',
  null,
  'Events with check-ins cannot be deleted'
);

reset role;
delete from public.check_ins where event_id = (select event_id from ids);
select set_config('request.jwt.claim.sub', (select officer::text from ids), true);
set local role authenticated;

delete from public.events where id = (select event_id from ids);
select is(
  (select count(*)::int from public.events where id = (select event_id from ids)),
  0,
  'Officers can delete events without check-ins'
);

reset role;

select * from finish();
rollback;
