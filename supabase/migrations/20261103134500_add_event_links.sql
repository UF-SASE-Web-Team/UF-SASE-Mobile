-- Migration to add event_links table
create table public.event_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index event_links_event_id_order_idx on public.event_links (event_id, display_order);

alter table public.event_links enable row level security;

create policy "event links are readable by authenticated users"
  on public.event_links for select
  to authenticated
  using (true);
