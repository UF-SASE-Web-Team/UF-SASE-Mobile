-- Make the point_transactions ledger the single source of truth for points.
--
-- 1. Drop the earlier check-in based points functions. The app now reads
--    totals, ranks and the leaderboard from the ledger RPCs instead.
-- 2. Lock the ledger RPCs to signed-in members. They expose member names and
--    avatars, which profiles RLS only shows to authenticated users.
-- 3. Hide members the caller has blocked from their leaderboard, matching how
--    blocks work elsewhere in the app. Ranks are computed before filtering so
--    everyone else keeps their real position.
-- 4. Keep trigger functions out of the RPC surface, like the other
--    security definer helpers (see lock_down_trigger_and_definer_functions).

-- 1. Superseded check-in based points functions
drop function if exists public.get_points_leaderboard(integer);
drop function if exists public.get_points_summary();
drop function if exists public.semester_points_ranked();
drop function if exists public.current_term_window();

-- 3. Leaderboard that respects blocks (same signature and columns as before)
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
set search_path = ''
as $$
  with totals as (
    select
      p.id as user_id,
      coalesce(nullif(p.full_name, ''), 'Member') as name,
      sum(pt.amount)::bigint as points,
      p.avatar_url
    from public.profiles p
    join public.point_transactions pt on pt.user_id = p.id
    where (p_term is null or pt.academic_term = p_term)
      and pt.amount > 0
    group by p.id, p.full_name, p.avatar_url
    having sum(pt.amount) > 0
  ),
  ranked as (
    select dense_rank() over (order by t.points desc) as rank, t.*
    from totals t
  )
  select r.rank, r.user_id, r.name, r.points, r.avatar_url
  from ranked r
  where not exists (
    select 1
    from public.profile_blocks b
    where b.blocker_id = (select auth.uid())
      and b.blocked_id = r.user_id
  )
  order by r.points desc, r.name asc
  limit least(greatest(coalesce(p_limit, 50), 1), 100);
$$;

-- 2. Signed-in members only
revoke execute on function public.get_leaderboard(text, int) from public, anon;
revoke execute on function public.get_user_points_total(uuid, text) from public, anon;
revoke execute on function public.get_user_leaderboard_rank(uuid, text) from public, anon;
grant execute on function public.get_leaderboard(text, int) to authenticated;
grant execute on function public.get_user_points_total(uuid, text) to authenticated;
grant execute on function public.get_user_leaderboard_rank(uuid, text) to authenticated;

-- 4. Trigger functions are not callable over the API
revoke execute on function public.handle_profile_created_points() from public, anon, authenticated;
revoke execute on function public.handle_check_in_points() from public, anon, authenticated;
