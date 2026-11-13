-- New profiles start with a random bundled mascot instead of a fixed remote image.
-- Keep this list in sync with `profileAvatars` in src/lib/profileAvatars.ts.
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
  insert into public.profiles (id, full_name, username, avatar_url)
  values (new.id, v_name, v_username, v_avatar);
  return new;
end $$;

comment on column public.profiles.avatar_url is
  'Remote avatar URL or bundled mascot identifier (sase-shark / sase-cat / saseski / sase-gator / sase-mantis / sase-sweeter).';
