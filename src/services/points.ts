import { supabase } from '@/lib/supabase';
import type { LeaderboardMember, PointsLogEntry } from '@/types/points';

export type { LeaderboardMember, PointsLogEntry };

export async function getPointsLog(userId: string): Promise<PointsLogEntry[]> {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('id, title, category, amount, created_at, event_id, rule_id, description')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    pointsValue: row.amount,
    date: row.created_at,
    eventId: row.event_id,
    ruleId: row.rule_id,
    description: row.description,
  }));
}

export async function getUserPointsTotal(userId: string, term?: string | null): Promise<number> {
  const { data, error } = await supabase.rpc('get_user_points_total', {
    p_user_id: userId,
    p_term: term ?? undefined,
  });

  if (!error && typeof data === 'number') {
    return data;
  }

  // Fallback: direct aggregate query from point_transactions
  let query = supabase.from('point_transactions').select('amount').eq('user_id', userId);

  if (term) {
    query = query.eq('academic_term', term);
  }

  const { data: rows, error: selectError } = await query;
  if (selectError) throw selectError;
  return (rows ?? []).reduce((sum, row) => sum + row.amount, 0);
}

export async function getLeaderboard(
  term?: string | null,
  limit: number = 50,
): Promise<LeaderboardMember[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_term: term ?? undefined,
    p_limit: limit,
  });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    rank: Number(row.rank),
    userId: row.user_id,
    name: row.name,
    points: Number(row.points),
    avatarUrl: row.avatar_url,
  }));
}

export async function getUserLeaderboardRank(
  userId: string,
  term?: string | null,
): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_user_leaderboard_rank', {
    p_user_id: userId,
    p_term: term ?? undefined,
  });

  if (!error && typeof data === 'number') {
    return data;
  }

  // Fallback: search user's position in getLeaderboard
  try {
    const list = await getLeaderboard(term, 100);
    const member = list.find((m) => m.userId === userId);
    return member?.rank ?? null;
  } catch {
    return null;
  }
}
