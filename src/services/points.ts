import { supabase } from '@/lib/supabase';
import type { LeaderboardEntry, PointsLogEntry, PointsSummary } from '@/types/points';

export type { LeaderboardEntry, PointsLogEntry, PointsSummary };

export const LEADERBOARD_SIZE = 10;

export async function getPointsLog(userId: string): Promise<PointsLogEntry[]> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, checked_in_at, event:events(id, title, type, starts_at, points_value)')
    .eq('user_id', userId)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).flatMap((row) =>
    row.event
      ? [
          {
            id: row.id,
            checkedInAt: row.checked_in_at,
            eventId: row.event.id,
            eventTitle: row.event.title,
            eventType: row.event.type,
            eventStartsAt: row.event.starts_at,
            pointsValue: row.event.points_value,
          },
        ]
      : [],
  );
}

/** The signed-in member's all-time total plus this term's points and rank. */
export async function getPointsSummary(): Promise<PointsSummary> {
  const { data, error } = await supabase.rpc('get_points_summary').single();

  if (error) throw error;

  return {
    totalPoints: data?.total_points ?? 0,
    semesterPoints: data?.semester_points ?? 0,
    semesterRank: data?.semester_rank ?? null,
    rankedMembers: data?.ranked_members ?? 0,
    termName: data?.term_name ?? null,
  };
}

/** Top members this term, plus the caller's own row when they fall outside the top. */
export async function getPointsLeaderboard(
  limit: number = LEADERBOARD_SIZE,
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_points_leaderboard', { p_limit: limit });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    rank: row.member_rank,
    userId: row.user_id,
    fullName: row.full_name,
    username: row.username ?? null,
    avatarUrl: row.avatar_url ?? null,
    points: row.points,
    isMe: row.is_me,
  }));
}
