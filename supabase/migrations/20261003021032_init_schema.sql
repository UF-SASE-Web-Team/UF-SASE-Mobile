create type public.user_role as enum ('member', 'officer', 'alumni');
create type public.checkin_method as enum ('code', 'qr', 'manual');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  discord_handle text,
  major text,
  grad_time text,
  avatar_url text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_name text not null,
  address text,
  lat double precision,
  lng double precision,
  points_value int not null default 1,
  checkin_code text,
  checkin_opens_at timestamptz,
  checkin_closes_at timestamptz,
  created_at timestamptz not null default now(),
  constraint events_time_order check (ends_at > starts_at)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id),
  user_id uuid references public.profiles(id) on delete set null,
  method public.checkin_method not null default 'code',
  checked_in_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index on public.check_ins (user_id);