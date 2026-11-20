begin;
select plan(11);

select has_function(
  'public', 'check_in', array['uuid', 'checkin_method', 'text', 'boolean'],
  'check_in takes the attended-this-year answer'
);

-- UF email must be a UF address.
select throws_ok(
  $$update public.profile_private set uf_email = 'alice@gmail.com'
    where user_id = (select id from auth.users where email = 'alice@gmail.com')$$,
  '23514',
  null,
  'UF email must end in @ufl.edu'
);

-- Fixture: Bob starts the school year with no check-ins, and two open events.
create temp table ids as
select
  (select id from auth.users where email = 'bob@gmail.com') as bob,
  gen_random_uuid() as first_event,
  gen_random_uuid() as second_event;
grant select on ids to authenticated;

delete from public.check_ins where user_id = (select bob from ids);

insert into public.events (id, title, starts_at, ends_at, location_name, checkin_code)
select first_event, 'Form Sync GBM', now() - interval '10 minutes', now() + interval '1 hour',
  'Reitz Union', '121212'
from ids
union all
select second_event, 'Form Sync Social', now() - interval '10 minutes', now() + interval '1 hour',
  'Reitz Union', '343434'
from ids;

select set_config('request.jwt.claim.sub', (select bob::text from ids), true);
set local role authenticated;

select is(
  public.has_checked_in_this_school_year(),
  false,
  'A member with no check-ins this school year has not checked in'
);

select is(
  (public.check_in((select first_event from ids), 'code', '121212', false)).attended_this_year,
  false,
  'The first check-in of the year keeps the member''s answer'
);

select is(
  public.has_checked_in_this_school_year(),
  true,
  'After checking in, the member has checked in this school year'
);

select is(
  (public.check_in((select second_event from ids), 'code', '343434', false)).attended_this_year,
  true,
  'Later check-ins are always "attended", whatever the client sends'
);

reset role;

set local role anon;
select throws_ok(
  'select public.has_checked_in_this_school_year()',
  '42501',
  null,
  'Anon cannot call has_checked_in_this_school_year'
);
reset role;

-- The sync trigger queues nothing while disabled, and one request once enabled.
create temp table queued as select count(*)::int as n from net.http_request_queue;

delete from public.check_ins where user_id = (select bob from ids);
insert into public.check_ins (event_id, user_id, method)
select first_event, bob, 'manual' from ids;

select is(
  (select count(*)::int from net.http_request_queue),
  (select n from queued),
  'No form sync request is queued while the sync is disabled'
);

update public.app_settings set value = 'true' where key = 'google_form_checkin_enabled';

delete from public.check_ins where user_id = (select bob from ids);
insert into public.check_ins (event_id, user_id, method)
select first_event, bob, 'manual' from ids;

select is(
  (select count(*)::int from net.http_request_queue),
  (select n from queued),
  'No form sync request is queued without the Vault secrets'
);

select vault.create_secret('http://example.test/functions/v1/google-form-checkin', 'google_form_sync_url');
select vault.create_secret('test-secret', 'google_form_sync_secret');

delete from public.check_ins where user_id = (select bob from ids);
insert into public.check_ins (event_id, user_id, method)
select first_event, bob, 'manual' from ids;

select is(
  (select count(*)::int from net.http_request_queue),
  (select n from queued) + 1,
  'A form sync request is queued for a member check-in once enabled'
);

select is(
  (select headers->>'x-form-sync-secret' from net.http_request_queue order by id desc limit 1),
  'test-secret',
  'The request carries the shared secret'
);

select * from finish();
rollback;
