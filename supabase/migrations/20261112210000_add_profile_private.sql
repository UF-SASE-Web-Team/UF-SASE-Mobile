-- Member details that other members must never see.
--
-- `public.profiles` is readable by every signed-in member, so anything private
-- lives here instead, where row level security limits each row to its owner.
create table public.profile_private (
  user_id uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  ufid text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_private_ufid_format check (ufid ~ '^[0-9]{8}$'),
  constraint profile_private_ufid_key unique (ufid)
);

comment on table public.profile_private is
  'Owner-only member details (UFID). Never exposed to other members.';

alter table public.profile_private enable row level security;

revoke all on table public.profile_private from anon, authenticated;
grant select, insert, update on table public.profile_private to authenticated;

create policy "members can read their own private details"
  on public.profile_private for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "members can add their own private details"
  on public.profile_private for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "members can update their own private details"
  on public.profile_private for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger set_profile_private_updated_at
  before update on public.profile_private
  for each row execute function public.handle_updated_at();
