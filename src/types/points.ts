import type { EventType } from '@/types/events';
import type { Database } from '@/types/supabase';

export type CheckInRow = Database['public']['Tables']['check_ins']['Row'];

export interface PointsLogEntry {
  id: string;
  checkedInAt: string;
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  eventStartsAt: string;
  pointsValue: number;
}
