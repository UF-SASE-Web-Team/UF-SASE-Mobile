-- Member moderation: reports go to officers for review, blocks hide a member
-- from the person who blocked them.

create type public.report_reason as enum (
  'harassment',
  'inappropriate',
  'impersonation',
  'spam',
  'other'
);

create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  -- Kept (as null) after the reporter deletes their account so officers can still act on it.
  reporter_id uuid default auth.uid() references public.profiles(id) on delete set null,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason public.report_reason not null,
  details text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint profile_reports_details_length check (char_length(details) <= 1000),
  constraint profile_reports_no_self_report check (reporter_id is distinct from reported_id)
);

create index profile_reports_reported_id_idx on public.profile_reports (reported_id);
create index profile_reports_reporter_id_idx on public.profile_reports (reporter_id);

create table public.profile_blocks (
  blocker_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint profile_blocks_no_self_block check (blocker_id <> blocked_id)
);

create index profile_blocks_blocked_id_idx on public.profile_blocks (blocked_id);

alter table public.profile_reports enable row level security;
alter table public.profile_blocks enable row level security;

-- Members can file reports but cannot read them back; officers review reports
-- from the Supabase dashboard, which bypasses RLS.
create policy "members can report other members"
    on public.profile_reports for insert
    to authenticated
    with check (reporter_id = (select auth.uid()));

create policy "members can read their own blocks"
    on public.profile_blocks for select
    to authenticated
    using (blocker_id = (select auth.uid()));

create policy "members can block other members"
    on public.profile_blocks for insert
    to authenticated
    with check (blocker_id = (select auth.uid()));

create policy "members can remove their own blocks"
    on public.profile_blocks for delete
    to authenticated
    using (blocker_id = (select auth.uid()));
