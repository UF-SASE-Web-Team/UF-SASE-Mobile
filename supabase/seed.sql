create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  uuid_generate_v4(),
  'authenticated',
  'authenticated',
  u.name || '@gmail.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  json_build_object(
    'username', u.name,
    'full_name', initcap(u.name) || ' Gator'
  ),
  current_timestamp,
  current_timestamp,
  '', '', '', ''
from (
  values ('alice'), ('bob')
) as u(name)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  id::text,
  current_timestamp,
  current_timestamp,
  current_timestamp
from auth.users
on conflict (id) do nothing;

insert into public.events (title, starts_at, ends_at, location_name, checkin_code, points_value) values 
    ('General Body Meeting', now() + interval '1 day', now() + interval '1 day 2 hours', 'Little Hall', 'QR Code', 1),
    ('Other SASE Event', now() + interval '3 day', now() + interval '3 days 2 hours', 'Reitz Union', 'QR Code', 1);

