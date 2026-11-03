import { Database } from '@/types/supabase';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventType = Database['public']['Enums']['event_type'];
export type EventRsvpRow = Database['public']['Tables']['event_rsvps']['Row'];

export interface EventWithRsvp extends EventRow {
  is_rsvped?: boolean;
  has_attended?: boolean;
}
