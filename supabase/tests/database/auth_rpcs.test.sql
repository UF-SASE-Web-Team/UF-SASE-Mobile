begin;
select * from no_plan();

-- 1. Verify Functions and Trigger Existence
select has_function(
  'public',
  'check_username_available',
  array['text'],
  'Function public.check_username_available(text) should exist'
);

select has_function(
  'public',
  'get_email_from_username',
  array['text'],
  'Function public.get_email_from_username(text) should exist'
);

select has_function(
  'public',
  'handle_new_user',
  'Function public.handle_new_user() should exist'
);

select has_trigger(
  'auth',
  'users',
  'on_user_created',
  'Trigger on_user_created should exist on auth.users'
);

-- 2. Test check_username_available
select is(
  public.check_username_available('unregistered_username'),
  true,
  'Unregistered username should be available'
);

select is(
  public.check_username_available('alice'),
  false,
  'Existing username alice should not be available'
);

select is(
  public.check_username_available('ALICE'),
  false,
  'Existing username should be checked case-insensitively'
);

select is(
  public.check_username_available('  alice  '),
  false,
  'Existing username should be checked with trimmed whitespace'
);

select is(
  public.check_username_available('bob'),
  false,
  'Existing username bob should not be available'
);

-- 3. Test get_email_from_username
select is(
  public.get_email_from_username('alice'),
  'alice@gmail.com',
  'get_email_from_username should return email for user alice'
);

select is(
  public.get_email_from_username('ALICE'),
  'alice@gmail.com',
  'get_email_from_username should match case-insensitively'
);

select is(
  public.get_email_from_username('  alice  '),
  'alice@gmail.com',
  'get_email_from_username should match with trimmed whitespace'
);

select is(
  public.get_email_from_username('bob'),
  'bob@gmail.com',
  'get_email_from_username should return email for user bob'
);

select is(
  public.get_email_from_username('nonexistent_user'),
  null,
  'get_email_from_username should return null for nonexistent user'
);

-- 4. Test Trigger handle_new_user on auth.users
do $$
declare
  v_test_user_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) values (
    v_test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'charlie@gmail.com',
    '{"provider":"email","providers":["email"]}',
    json_build_object('username', 'charlie', 'full_name', 'Charlie Gator'),
    now(),
    now()
  );
end $$;

-- Verify profile was automatically created by handle_new_user
select is(
  (select username from public.profiles where username = 'charlie'),
  'charlie',
  'Profile username should be populated from user metadata'
);

select is(
  (select full_name from public.profiles where username = 'charlie'),
  'Charlie Gator',
  'Profile full_name should be populated from user metadata'
);

select is(
  (select role from public.profiles where username = 'charlie'),
  'member'::public.user_role,
  'Profile role should default to member'
);

-- Verify get_email_from_username works for newly created user
select is(
  public.get_email_from_username('charlie'),
  'charlie@gmail.com',
  'get_email_from_username should work for newly created user'
);

-- 5. Test Trigger Validation Error Handling
select throws_ok(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'nousername@gmail.com', '{"provider":"email"}', json_build_object('full_name', 'No Username User'), now(), now()
    );
  $$,
  null::char(5),
  null::text,
  'Inserting user without username should raise exception'
);

select throws_ok(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'emptyusername@gmail.com', '{"provider":"email"}', json_build_object('username', '', 'full_name', 'Empty Username User'), now(), now()
    );
  $$,
  null::char(5),
  null::text,
  'Inserting user with empty username should raise exception'
);

select throws_ok(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'nofullname@gmail.com', '{"provider":"email"}', json_build_object('username', 'validuser1'), now(), now()
    );
  $$,
  null::char(5),
  null::text,
  'Inserting user without full_name should raise exception'
);

select throws_ok(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'emptyfullname@gmail.com', '{"provider":"email"}', json_build_object('username', 'validuser2', 'full_name', '   '), now(), now()
    );
  $$,
  null::char(5),
  null::text,
  'Inserting user with whitespace-only full_name should raise exception'
);

-- 6. Test delete_user_account RPC
select has_function(
  'public',
  'delete_user_account',
  'Function public.delete_user_account() should exist'
);

-- Test unauthenticated access fails
set local role anon;
select throws_ok(
  $$ select public.delete_user_account(); $$,
  null::char(5),
  null::text,
  'Anon role cannot execute delete_user_account'
);
reset role;

-- Create user with a check-in to test cascade and anonymization
do $$
declare
  v_delete_id uuid := gen_random_uuid();
  v_event_id uuid;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_delete_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'deleteme@gmail.com', '{"provider":"email"}', json_build_object('username', 'deleteme', 'full_name', 'Delete Me User'), now(), now()
  );

  select id into v_event_id from public.events limit 1;
  insert into public.check_ins (event_id, user_id, method)
  values (v_event_id, v_delete_id, 'code');
end $$;

-- Verify profile and check-in exist before deletion
select is(
  (select count(*) from public.profiles where username = 'deleteme'),
  1::bigint,
  'Profile exists before deletion'
);

-- Execute account deletion as the user
do $$
declare
  v_delete_id uuid;
begin
  select id into v_delete_id from auth.users where email = 'deleteme@gmail.com';
  execute format('set local role authenticated');
  execute format('set local "request.jwt.claim.sub" to %L', v_delete_id::text);
  execute format('set local "request.jwt.claims" to %L', json_build_object('sub', v_delete_id::text, 'role', 'authenticated')::text);
  perform public.delete_user_account();
end $$;

reset role;

-- Verify user is deleted from auth.users
select is(
  (select count(*) from auth.users where email = 'deleteme@gmail.com'),
  0::bigint,
  'User should be deleted from auth.users'
);

-- Verify profile is cascade deleted from public.profiles
select is(
  (select count(*) from public.profiles where username = 'deleteme'),
  0::bigint,
  'Profile should be deleted from public.profiles via cascade'
);

-- Verify check-in is retained but anonymized (user_id set to null)
select is(
  (select count(*) from public.check_ins where user_id is null),
  1::bigint,
  'Check-in user_id should be set to null when user is deleted'
);

select * from finish();
rollback;
