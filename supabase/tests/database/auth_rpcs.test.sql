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
select throws_like(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'nousername@gmail.com', '{"provider":"email"}', json_build_object('full_name', 'No Username User'), now(), now()
    );
  $$,
  '%username is required in user_metadata%',
  'Inserting user without username should raise exception'
);

select throws_like(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'emptyusername@gmail.com', '{"provider":"email"}', json_build_object('username', '', 'full_name', 'Empty Username User'), now(), now()
    );
  $$,
  '%username is required in user_metadata%',
  'Inserting user with empty username should raise exception'
);

select throws_like(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'nofullname@gmail.com', '{"provider":"email"}', json_build_object('username', 'validuser1'), now(), now()
    );
  $$,
  '%full_name is required in user_metadata%',
  'Inserting user without full_name should raise exception'
);

select throws_like(
  $$
    insert into auth.users (
      id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) values (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'emptyfullname@gmail.com', '{"provider":"email"}', json_build_object('username', 'validuser2', 'full_name', '   '), now(), now()
    );
  $$,
  '%full_name is required in user_metadata%',
  'Inserting user with whitespace-only full_name should raise exception'
);

select * from finish();
rollback;
