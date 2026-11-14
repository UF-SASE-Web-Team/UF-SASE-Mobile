-- 05_reviewer_accounts.sql
-- Reviewer test accounts and local profile baseline (alice@gmail.com, bob@gmail.com)

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
  u.meta,
  current_timestamp,
  current_timestamp,
  '', '', '', ''
from (
  values
    (
      'alice',
      json_build_object(
        'username', 'alice',
        'full_name', 'Alice Gator',
        'majors', json_build_array('Computer Science', 'Mathematics'),
        'minors', json_build_array('Digital Arts and Sciences'),
        'grad_time', '2029',
        'discord_handle', 'alice.gator',
        'instagram_handle', 'alice.gator',
        'linkedin_url', 'https://www.linkedin.com/in/alice-gator',
        'bio', 'Hi! I am a Computer Science major at UF. I love building things and meeting new people through SASE.',
        'avatar_url', 'sase-shark'
      )
    ),
    (
      'bob',
      json_build_object(
        'username', 'bob',
        'full_name', 'Bob Gator',
        'majors', json_build_array('Mechanical Engineering'),
        'grad_time', '2028',
        'avatar_url', 'sase-cat'
      )
    )
) as u(name, meta)
where not exists (
  select 1 from auth.users where email = u.name || '@gmail.com'
);

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
  uuid_generate_v4(),
  id,
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
  'email',
  id::text,
  current_timestamp,
  current_timestamp,
  current_timestamp
from auth.users
where email in ('alice@gmail.com', 'bob@gmail.com')
on conflict (provider_id, provider) do nothing;

update public.profiles
set full_name = 'Alice Gator',
    majors = array['Computer Science', 'Mathematics'],
    minors = array['Digital Arts and Sciences'],
    grad_time = '2029',
    discord_handle = 'alice.gator',
    instagram_handle = 'alice.gator',
    linkedin_url = 'https://www.linkedin.com/in/alice-gator',
    bio = 'Hi! I am a Computer Science major at UF. I love building things and meeting new people through SASE.',
    avatar_url = 'sase-shark'
where username = 'alice';

update public.profiles
set majors = array['Mechanical Engineering'],
    grad_time = '2028',
    instagram_handle = null,
    linkedin_url = null,
    bio = null,
    avatar_url = 'sase-cat'
where username = 'bob';

-- Alice has finished onboarding. Bob has no UFID yet, so signing in as Bob shows onboarding.
insert into public.profile_private (user_id, ufid)
select id, '12345678' from public.profiles where username = 'alice'
on conflict (user_id) do nothing;

-- Sample moderation report so review queue isn't empty locally
insert into public.profile_reports (reporter_id, reported_id, reason, details)
select reporter.id, reported.id, 'spam', 'Bio is only promotional links.'
from public.profiles reporter, public.profiles reported
where reporter.username = 'bob' and reported.username = 'alice'
  and not exists (
    select 1 from public.profile_reports where reporter_id = reporter.id and reported_id = reported.id
  );


