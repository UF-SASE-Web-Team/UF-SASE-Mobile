import { Database } from '@/types/supabase';

export type EventRow = Database['public']['Tables']['events']['Row'];
export type EventType = Database['public']['Enums']['event_type'];
export type EventRsvpRow = Database['public']['Tables']['event_rsvps']['Row'];

export interface EventWithRsvp extends EventRow {
  is_rsvped?: boolean;
  has_attended?: boolean;
}

export interface EventLink {
  id: string;
  event_id: string;
  title: string;
  url: string;
  display_order?: number;
}

export interface EventWithDetails extends EventWithRsvp {
  links?: EventLink[];
  program?: {
    id: string;
    name: string;
    program_members?: {
      id: string;
      user_id: string | null;
      display_name: string;
      is_poc: boolean;
      profile?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      } | null;
    }[];
  } | null;
}
