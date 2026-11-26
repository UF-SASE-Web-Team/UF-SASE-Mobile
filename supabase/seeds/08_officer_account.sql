-- 08_officer_account.sql
-- Local-only officer account for the officer admin tools (olivia@gmail.com /
-- password123). Kept apart from the App Store reviewer accounts, which stay
-- regular members.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003'::uuid,
  'authenticated',
  'authenticated',
  'olivia@gmail.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp, current_timestamp, current_timestamp,
  '{"provider":"email","providers":["email"]}',
  json_build_object(
    'username', 'olivia',
    'full_name', 'Olivia Officer',
    'majors', json_build_array('Industrial and Systems Engineering'),
    'grad_time', '2027',
    'avatar_url', 'sase-cat'
  ),
  current_timestamp, current_timestamp, '', '', '', ''
where not exists (select 1 from auth.users where email = 'olivia@gmail.com');

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
)
select
  uuid_generate_v4(), id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email', id::text, current_timestamp, current_timestamp, current_timestamp
from auth.users
where email = 'olivia@gmail.com'
on conflict (provider_id, provider) do nothing;

-- Seeds run as postgres, so the role guard on profiles doesn't apply here.
update public.profiles set role = 'officer' where username = 'olivia';

insert into public.profile_private (user_id, ufid, uf_email)
select id, '11223344', 'olivia.officer@ufl.edu' from public.profiles where username = 'olivia'
on conflict (user_id) do nothing;
