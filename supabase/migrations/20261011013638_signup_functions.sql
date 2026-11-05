alter table public.profiles
  alter column username set not null,
  add constraint username_format check(
    length(username) between 3 and 20
    and username ~ '^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$'
  );
create unique index profiles_username_lower_key on public.profiles (lower(trim(username)));


-- Availability of username
create or replace function public.check_username_available(input_username text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return not exists (
    select 1
    from public.profiles
    where lower(username) = lower(trim(input_username))
  );
end;
$$;

grant execute on function public.check_username_available(text) to anon, authenticated;


-- Sign up trigger to create profile after verification
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data->>'username'));
  v_name text := trim(new.raw_user_meta_data->>'full_name');
  v_avatar text := 'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/sase-cat.png';
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

create trigger on_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Resolve username to email for signin
create or replace function public.get_email_from_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
begin
  select u.email into v_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(p_username));
  return v_email;
end;
$$;

grant execute on function public.get_email_from_username(text) to anon, authenticated;