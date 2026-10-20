create type public.program_category as enum (
  'events_and_committees',
  'technical_and_research',
  'community'
);

create table public.academic_terms (
  id text primary key, -- 'fall-2026'
  name text not null,  -- 'Fall 2026'
  is_current boolean not null default false,
  start_date date not null,
  created_at timestamptz not null default now()
);

create unique index academic_terms_one_current_idx
  on public.academic_terms (is_current)
  where is_current = true;

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.programs(id) on delete set null,
  name text not null,
  slug text not null unique,
  category public.program_category,
  display_order int not null default 0,
  short_description text,
  description text,
  image_url text,
  is_active boolean not null default true,
  -- application fields (updated in-place each cycle)
  application_url text,
  opens_at timestamptz,
  closes_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_valid_application_window check (
    opens_at is null or closes_at is null or closes_at > opens_at
  )
);

create index programs_parent_id_idx on public.programs (parent_id);
create index programs_category_idx on public.programs (category) where is_active = true;

create table public.program_members (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  display_name text not null, -- Guarantees program member is accounted for even without user_id
  academic_term text not null references public.academic_terms(id) on update cascade,
  is_poc boolean not null default false,
  created_at timestamptz not null default now(),
  constraint program_members_unique_user_per_term unique (program_id, user_id, academic_term)
);

create index program_members_program_term_idx on public.program_members (program_id, academic_term);
create index program_members_program_user_id_idx on public.program_members (user_id);
create index program_members_poc_idx on public.program_members (program_id, academic_term) where is_poc = true;

-- Add RLS
alter table public.academic_terms enable row level security;
alter table public.programs enable row level security;
alter table public.program_members enable row level security;

create policy "academic_terms are readable by all users"
  on public.academic_terms for select
  to anon, authenticated
  using (true);

create policy "programs are readable by all users"
  on public.programs for select
  to anon, authenticated
  using (true);

create policy "program_members are readable by authenticated users"
  on public.program_members for select
  to authenticated
  using (true);

-- Auto-fill `diplay-name` from `profiles.full_name` when `user_id` is provided
create or replace function public.sync_program_member_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- If a user_id is linked and display_name wasn't explicitly provided (or is blank),
  -- automatically grab their full_name
  if new.user_id is not null and (new.display_name is null or trim(new.display_name) = '')
  then
    select full_name
      into new.display_name
      from public.profiles
    where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger set_program_member_display_name
  before insert or update on public.program_members
  for each row execute function public.sync_program_member_name();

-- Add transferable `updated_at` trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$ begin new.updated_at = now() ; return new; end; $$;

create trigger set_programs_updated_at
  before update on public.programs
  for each row execute function public.handle_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Seed semesters
insert into public.academic_terms (id, name, start_date, is_current)
values
  ('fall-2026',   'Fall 2026',   '2026-08-18', true),
  ('spring-2027', 'Spring 2027', '2027-01-07', false),
  ('summer-2027', 'Summer 2027', '2027-05-06', false)
on conflict (id) do nothing;
