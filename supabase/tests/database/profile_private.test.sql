begin;
select * from no_plan();

-- Bob gets a UFID as the table owner so there is another member's row to probe.
insert into public.profile_private (user_id, ufid)
select id, '87654321' from public.profiles where username = 'bob';

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.profiles where username = 'alice';
  execute 'set local role authenticated';
  execute format('set local "request.jwt.claim.sub" to %L', v_user_id::text);
end $$;

select is(
  (select ufid from public.profile_private),
  '12345678',
  'Members can read only their own UFID'
);
select is(
  (select count(*)::int from public.profile_private
    where user_id = (select id from public.profiles where username = 'bob')),
  0,
  'Members cannot read another member UFID'
);

update public.profile_private set ufid = '11112222';
select is(
  (select ufid from public.profile_private),
  '11112222',
  'Members can change their own UFID'
);

update public.profile_private set ufid = '99999999'
where user_id = (select id from public.profiles where username = 'bob');
reset role;
select is(
  (select ufid from public.profile_private
    where user_id = (select id from public.profiles where username = 'bob')),
  '87654321',
  'Members cannot change another member UFID'
);
set local role authenticated;

select throws_ok(
  $$update public.profile_private set ufid = '1234'$$,
  '23514',
  null,
  'UFIDs must be exactly 8 digits'
);
select throws_ok(
  $$update public.profile_private set ufid = '87654321'$$,
  '23505',
  null,
  'A UFID can belong to only one account'
);
select throws_ok(
  $$insert into public.profile_private (user_id, ufid)
    select id, '55556666' from public.profiles where username = 'bob'$$,
  '42501',
  null,
  'Members cannot add private details for another member'
);

set local role anon;
select throws_ok(
  $$select ufid from public.profile_private$$,
  '42501',
  null,
  'Signed-out callers cannot read UFIDs'
);

select * from finish();
rollback;
