create type public.event_type as enum ('gbm', 'career', 'social', 'team', 'other');

alter table public.events
  add column type public.event_type not null default 'other',
  add column program_id uuid references public.programs(id) on delete set null,
  add constraint events_checkin_window check (
    checkin_opens_at is null or checkin_closes_at is null
    or (checkin_closes_at > checkin_opens_at and checkin_closes_at <= ends_at)
  );

create index events_starts_at_idx on public.events (starts_at);
create index events_program_id_idx on public.events (program_id);

create table public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.event_rsvps enable row level security;

create policy "read own rsvps" on public.event_rsvps
  for select to authenticated using (user_id = (select auth.uid()));

create policy "rsvp before check-in opens" on public.event_rsvps
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.events e
      where e.id = event_rsvps.event_id
        and now() < coalesce(e.checkin_opens_at, e.starts_at))
  );

create policy "un-rsvp before check-in opens" on public.event_rsvps
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.events e
      where e.id = event_rsvps.event_id
        and now() < coalesce(e.checkin_opens_at, e.starts_at))
  );

update public.events
set checkin_code = lpad(floor(random() * 1000000)::int::text, 6, '0')
where checkin_code is null;

alter table public.events
  alter column checkin_code set default lpad(floor(random() * 1000000)::int::text, 6, '0'),
  alter column checkin_code set not null,
  add constraint events_checkin_code_format check (checkin_code ~ '^[0-9]{6}$');

create table public.app_settings (
  key text primary key,
  value text not null
);
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values ('checkin_qr_url', 'https://docs.google.com/forms/d/e/1FAIpQLScBj2IuMWxYg285fwgrhvNp2uVtwpLu9i3jrAn4FbnibZCVTA/viewform');
