-- Migration: 20261116192040_add_points_system.sql
-- Description: Core points tables (point_rules, point_transactions), triggers for account creation and GBM attendance

-- 1. Point Categories Enum
create type public.point_category as enum (
  'digital_engagement',
  'attendance',
  'commitment',
  'marketplace'
);

-- 2. Point Rules Configuration Table
create table public.point_rules (
  id text primary key,
  category public.point_category not null,
  name text not null,
  description text,
  points int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.point_rules enable row level security;

create policy "Allow read access to point_rules for all authenticated users"
  on public.point_rules for select
  to authenticated
  using (true);

-- 3. Point Transactions (Immutable Ledger)
create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  category public.point_category not null,
  rule_id text references public.point_rules(id) on delete set null,
  title text not null,
  description text,
  academic_term text not null references public.academic_terms(id) on delete restrict,
  event_id uuid references public.events(id) on delete set null,
  reference_type text, -- 'profile', 'check_in', 'manual'
  reference_id text,
  created_at timestamptz not null default now(),

  constraint point_transaction_amount_nonzero check (amount != 0),
  constraint point_transaction_idempotent unique (user_id, reference_type, reference_id)
);

create index idx_point_transactions_user_created on public.point_transactions (user_id, created_at desc);
create index idx_point_transactions_user_term on public.point_transactions (user_id, academic_term);
create index idx_point_transactions_event on public.point_transactions (event_id) where event_id is not null;

alter table public.point_transactions enable row level security;

create policy "Users can view their own point transactions"
  on public.point_transactions for select
  to authenticated
  using (auth.uid() = user_id);

-- 4. Initial Seed for Launch Rules
insert into public.point_rules (id, category, name, description, points, is_active)
values
  ('account_created', 'digital_engagement', 'Create SASE Account', 'Awarded for creating a UF SASE account', 1, true),
  ('event_attendance', 'attendance', 'Event Attendance', 'Awarded for attending a SASE event', 1, true),
  ('gbm_attendance', 'attendance', 'GBM Attendance', 'Awarded for attending a General Body Meeting', 1, true)
on conflict (id) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  points = excluded.points,
  is_active = excluded.is_active;

-- 5. Trigger: Account Creation Bonus Point (+1)
create or replace function public.handle_profile_created_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule record;
  v_term text;
begin
  select * into v_rule from public.point_rules where id = 'account_created' and is_active = true;
  if not found then
    return new;
  end if;

  -- Match current academic term, fallback to latest term
  select id into v_term from public.academic_terms where is_current = true limit 1;
  if v_term is null then
    select id into v_term from public.academic_terms order by start_date desc limit 1;
  end if;

  insert into public.point_transactions (
    user_id,
    amount,
    category,
    rule_id,
    title,
    description,
    academic_term,
    reference_type,
    reference_id,
    created_at
  ) values (
    new.id,
    v_rule.points,
    v_rule.category,
    v_rule.id,
    v_rule.name,
    v_rule.description,
    v_term,
    'profile',
    new.id::text,
    coalesce(new.created_at, now())
  )
  on conflict (user_id, reference_type, reference_id) do nothing;

  return new;
end;
$$;

create trigger trg_profile_created_points
after insert on public.profiles
for each row
execute function public.handle_profile_created_points();

-- 6. Trigger: Event Check-in Point (Any event with points_value > 0 awards points)
create or replace function public.handle_check_in_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_term text;
  v_rule_id text;
begin
  if new.user_id is null then
    return new;
  end if;

  select id, title, type, coalesce(points_value, 0) as points_value, starts_at
  from public.events
  where id = new.event_id
  into v_event;

  if not found or v_event.points_value <= 0 then
    return new;
  end if;

  -- Match academic term based on event start date, fallback to current or latest term
  select id into v_term
  from public.academic_terms
  where start_date <= v_event.starts_at::date
  order by start_date desc
  limit 1;

  if v_term is null then
    select id into v_term from public.academic_terms where is_current = true limit 1;
  end if;

  if v_term is null then
    select id into v_term from public.academic_terms order by start_date desc limit 1;
  end if;

  if v_event.type = 'gbm' then
    v_rule_id := 'gbm_attendance';
  else
    v_rule_id := 'event_attendance';
  end if;

  insert into public.point_transactions (
    user_id,
    amount,
    category,
    rule_id,
    title,
    description,
    academic_term,
    event_id,
    reference_type,
    reference_id,
    created_at
  ) values (
    new.user_id,
    v_event.points_value,
    'attendance'::public.point_category,
    v_rule_id,
    v_event.title,
    'Attended ' || v_event.title,
    v_term,
    v_event.id,
    'check_in',
    new.id::text,
    coalesce(new.checked_in_at, now())
  )
  on conflict (user_id, reference_type, reference_id) do nothing;

  return new;
end;
$$;

create trigger trg_check_in_points
after insert on public.check_ins
for each row
execute function public.handle_check_in_points();

-- 7. Backfill Existing Profiles and Event Check-ins
insert into public.point_transactions (
  user_id,
  amount,
  category,
  rule_id,
  title,
  description,
  academic_term,
  reference_type,
  reference_id,
  created_at
)
select
  p.id,
  1,
  'digital_engagement'::public.point_category,
  'account_created',
  'Create SASE Account',
  'Awarded for creating a UF SASE account',
  coalesce(
    (select id from public.academic_terms where is_current = true limit 1),
    (select id from public.academic_terms order by start_date desc limit 1)
  ),
  'profile',
  p.id::text,
  p.created_at
from public.profiles p
on conflict (user_id, reference_type, reference_id) do nothing;

insert into public.point_transactions (
  user_id,
  amount,
  category,
  rule_id,
  title,
  description,
  academic_term,
  event_id,
  reference_type,
  reference_id,
  created_at
)
select
  c.user_id,
  coalesce(e.points_value, 1),
  'attendance'::public.point_category,
  case when e.type = 'gbm' then 'gbm_attendance' else 'event_attendance' end,
  e.title,
  'Attended ' || e.title,
  coalesce(
    (select at.id from public.academic_terms at where at.start_date <= e.starts_at::date order by at.start_date desc limit 1),
    (select id from public.academic_terms where is_current = true limit 1),
    (select id from public.academic_terms order by start_date desc limit 1)
  ),
  e.id,
  'check_in',
  c.id::text,
  c.checked_in_at
from public.check_ins c
join public.events e on e.id = c.event_id
where c.user_id is not null and coalesce(e.points_value, 1) > 0
on conflict (user_id, reference_type, reference_id) do nothing;

-- 8. Aggregation Functions (Leaderboard & Point Totals)
create or replace function public.get_leaderboard(
  p_term text default null,
  p_limit int default 50
)
returns table (
  rank bigint,
  user_id uuid,
  name text,
  points bigint,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dense_rank() over (order by coalesce(sum(pt.amount), 0) desc) as rank,
    p.id as user_id,
    coalesce(nullif(p.full_name, ''), 'Member') as name,
    coalesce(sum(pt.amount), 0)::bigint as points,
    p.avatar_url
  from public.profiles p
  join public.point_transactions pt on pt.user_id = p.id
  where (p_term is null or pt.academic_term = p_term)
    and pt.amount > 0
  group by p.id, p.full_name, p.avatar_url
  having coalesce(sum(pt.amount), 0) > 0
  order by points desc, name asc
  limit coalesce(p_limit, 50);
$$;

grant execute on function public.get_leaderboard(text, int) to authenticated, anon;

create or replace function public.get_user_points_total(
  p_user_id uuid,
  p_term text default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::int
  from public.point_transactions
  where user_id = p_user_id
    and (p_term is null or academic_term = p_term);
$$;

grant execute on function public.get_user_points_total(uuid, text) to authenticated, anon;

create or replace function public.get_user_leaderboard_rank(
  p_user_id uuid,
  p_term text default null
)
returns int
language sql
stable
security definer
set search_path = public
as $$
  with user_scores as (
    select
      user_id,
      coalesce(sum(amount), 0) as total_pts
    from public.point_transactions
    where (p_term is null or academic_term = p_term)
      and amount > 0
    group by user_id
    having coalesce(sum(amount), 0) > 0
  ),
  ranked as (
    select
      user_id,
      dense_rank() over (order by total_pts desc) as rnk
    from user_scores
  )
  select rnk::int from ranked where user_id = p_user_id;
$$;

grant execute on function public.get_user_leaderboard_rank(uuid, text) to authenticated, anon;


