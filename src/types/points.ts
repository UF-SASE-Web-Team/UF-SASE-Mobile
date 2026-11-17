import type { Database } from '@/types/supabase';

export type PointCategory = Database['public']['Enums']['point_category'];
export type PointRuleRow = Database['public']['Tables']['point_rules']['Row'];
export type PointTransactionRow = Database['public']['Tables']['point_transactions']['Row'];
export type CheckInRow = Database['public']['Tables']['check_ins']['Row'];

export interface PointsLogEntry {
  id: string;
  title: string;
  category: PointCategory;
  pointsValue: number;
  date: string;
  eventId?: string | null;
  ruleId?: string | null;
  description?: string | null;
}

export interface LeaderboardMember {
  rank: number;
  userId: string;
  name: string;
  points: number;
  avatarUrl?: string | null;
}
