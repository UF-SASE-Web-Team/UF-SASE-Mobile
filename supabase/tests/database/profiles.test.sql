begin;
select * from no_plan();

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.profiles where username = 'alice';
  execute 'set local role authenticated';
  execute format('set local "request.jwt.claim.sub" to %L', v_user_id::text);
end $$;

update public.profiles
set instagram_handle = 'alice.updated',
    linkedin_url = 'https://www.linkedin.com/in/alice-updated',
    bio = 'Updated introduction.',
    avatar_url = 'sase-cat'
where username = 'alice';

select is((select instagram_handle from public.profiles where username = 'alice'), 'alice.updated', 'Members can save their Instagram handle');
select is((select linkedin_url from public.profiles where username = 'alice'), 'https://www.linkedin.com/in/alice-updated', 'Members can save their LinkedIn URL');
select is((select bio from public.profiles where username = 'alice'), 'Updated introduction.', 'Members can save their bio');
select is((select avatar_url from public.profiles where username = 'alice'), 'sase-cat', 'Members can save a bundled mascot');

update public.profiles set bio = 'Unauthorized edit' where username = 'bob';
select is((select bio from public.profiles where username = 'bob'), null, 'Members cannot change another member profile');

select throws_ok(
  $$update public.profiles set bio = repeat('a', 501) where username = 'alice'$$,
  '23514',
  'new row for relation "profiles" violates check constraint "profiles_bio_length"',
  'Bios cannot exceed 500 characters'
);

select * from finish();
rollback;
