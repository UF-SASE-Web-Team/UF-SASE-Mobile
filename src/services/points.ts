import { supabase } from '@/lib/supabase';
import { EventType } from '@/types/events';

export interface PointsLogEntry {
  id: string;
  checkedInAt: string;
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  eventStartsAt: string;
  pointsValue: number;
}

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
