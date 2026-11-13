-- An account whose email was never verified proves nothing about who owns the
-- address, yet it used to hold both the email and the username indefinitely.
-- Signing up again with that email silently kept the first attempt's password
-- and username, and the abandoned username showed as taken. Unverified accounts
-- are now placeholders that a later sign-up replaces.

-- Usernames held only by unverified accounts are free to claim.
create or replace function public.check_username_available(input_username text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return not exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(p.username) = lower(trim(input_username))
      and u.email_confirmed_at is not null
  );
end;
$$;


-- Called before sign-up so the new attempt's password, name, and username apply.
-- Verified accounts are never touched, and nothing is returned, so the caller
-- learns nothing about whether the email is registered.
create or replace function public.discard_unverified_signup(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users
  where lower(email) = lower(trim(p_email))
    and email_confirmed_at is null;
end;
$$;

revoke execute on function public.discard_unverified_signup(text) from public;
grant execute on function public.discard_unverified_signup(text) to anon, authenticated;


-- Same body as before, plus releasing a username held by an unverified account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data->>'username'));
  v_name text := trim(new.raw_user_meta_data->>'full_name');
  v_avatars constant text[] := array[
    'sase-shark',
    'sase-cat',
    'saseski',
    'sase-gator',
    'sase-mantis',
    'sase-sweeter'
  ];
  v_avatar text := v_avatars[1 + floor(random() * cardinality(v_avatars))::int];
begin
  if v_username is null or v_username = '' then
    raise exception 'username is required in user_metadata';
  end if;
  if v_name is null or v_name = '' then
    raise exception 'full_name is required in user_metadata';
  end if;

  delete from auth.users u
  using public.profiles p
  where p.id = u.id
    and u.id <> new.id
    and lower(p.username) = v_username
    and u.email_confirmed_at is null;

  insert into public.profiles (id, full_name, username, avatar_url)
  values (new.id, v_name, v_username, v_avatar);
  return new;
end $$;
