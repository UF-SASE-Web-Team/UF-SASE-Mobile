create type public.resource_category as enum (
  'general',
  'sase',
  'academic',
  'professional'
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.resource_category,
  url text not null,
  display_order int not null default 0,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resources_category_idx on public.resources (category);

create trigger set_resources_updated_at
  before update on public.resources
  for each row execute function public.handle_updated_at();

alter table public.resources enable row level security;

create policy "resources are readable by all users"
  on public.resources for select
  to anon, authenticated
  using (true);
