import type { EventType } from '@/types/events';
import type { Database } from '@/types/supabase';

export type CheckInRow = Database['public']['Tables']['check_ins']['Row'];

type Functions = Database['public']['Functions'];

export type PointsSummaryRow = Functions['get_points_summary']['Returns'][number];
export type LeaderboardRow = Functions['get_points_leaderboard']['Returns'][number];

export interface PointsLogEntry {
  id: string;
  checkedInAt: string;
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  eventStartsAt: string;
  pointsValue: number;
}

export interface PointsSummary {
  totalPoints: number;
  semesterPoints: number;
  /** Null when the member has no points this term. */
  semesterRank: number | null;
  rankedMembers: number;
  termName: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  points: number;
  isMe: boolean;
}
