-- Points totals and the semester leaderboard.
--
-- Computed in the database so the app receives compact summaries instead of
-- adding up raw check-in rows on the phone. Check-in rows stay owner-only under
-- RLS; these security definer functions expose only aggregated points.

-- The current academic term runs from its start date until the next term
-- starts (open-ended when no later term has been added yet). Term dates are
-- interpreted in Gainesville local time.
create or replace function public.current_term_window()
returns table (term_id text, term_name text, starts_at timestamptz, ends_at timestamptz)
language sql
stable
set search_path = ''
as $$
  select
    t.id,
    t.name,
    t.start_date::timestamp at time zone 'America/New_York',
    (
      select min(n.start_date)::timestamp at time zone 'America/New_York'
      from public.academic_terms n
      where n.start_date > t.start_date
    )
  from public.academic_terms t
  where t.is_current
$$;

comment on function public.current_term_window() is
  'Start and end of the current academic term (end is null when no later term exists).';

-- Every member with points this term, ranked. Ties share a rank.
-- Internal helper: reads all check-ins, so it is not callable over the API.
create or replace function public.semester_points_ranked()
returns table (user_id uuid, points integer, member_rank integer)
language sql
stable
security definer
set search_path = ''
as $$
  with term as (
    select starts_at, ends_at from public.current_term_window()
  ),
  totals as (
    select c.user_id, sum(e.points_value)::integer as points
    from public.check_ins c
    join public.events e on e.id = c.event_id
    cross join term
    where c.user_id is not null
      and e.starts_at >= term.starts_at
      and (term.ends_at is null or e.starts_at < term.ends_at)
    group by c.user_id
  )
  select t.user_id, t.points, (rank() over (order by t.points desc))::integer
  from totals t
  where t.points > 0
$$;

revoke execute on function public.semester_points_ranked() from public, anon, authenticated;

-- The signed-in member's all-time total, this term's points and rank.
create or replace function public.get_points_summary()
returns table (
  total_points integer,
  semester_points integer,
  semester_rank integer,
  ranked_members integer,
  term_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select * from public.semester_points_ranked()
  )
  select
    coalesce((
      select sum(e.points_value)
      from public.check_ins c
      join public.events e on e.id = c.event_id
      where c.user_id = (select auth.uid())
    ), 0)::integer,
    coalesce((select r.points from ranked r where r.user_id = (select auth.uid())), 0),
    (select r.member_rank from ranked r where r.user_id = (select auth.uid())),
    (select count(*) from ranked)::integer,
    (select w.term_name from public.current_term_window() w)
$$;

revoke execute on function public.get_points_summary() from public, anon;
grant execute on function public.get_points_summary() to authenticated;

-- Top members this term, plus the caller's own row when they fall outside the
-- top. Members the caller has blocked are left out; ranks are not renumbered.
create or replace function public.get_points_leaderboard(p_limit integer default 10)
returns table (
  member_rank integer,
  user_id uuid,
  full_name text,
  username text,
  avatar_url text,
  points integer,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      r.member_rank,
      r.user_id,
      p.full_name,
      p.username,
      p.avatar_url,
      r.points,
      r.user_id = (select auth.uid()) as is_me
    from public.semester_points_ranked() r
    join public.profiles p on p.id = r.user_id
    where not exists (
      select 1
      from public.profile_blocks b
      where b.blocker_id = (select auth.uid())
        and b.blocked_id = r.user_id
    )
  ),
  leaders as (
    select *
    from ranked
    order by member_rank, full_name, user_id
    limit least(greatest(coalesce(p_limit, 10), 1), 100)
  )
  select * from leaders
  union
  select * from ranked where is_me
  order by 1, 3
$$;

revoke execute on function public.get_points_leaderboard(integer) from public, anon;
grant execute on function public.get_points_leaderboard(integer) to authenticated;
