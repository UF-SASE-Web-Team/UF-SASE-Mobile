alter table public.resources
  add column if not exists is_top boolean not null default false;

create index if not exists resources_is_top_idx on public.resources (is_top);
