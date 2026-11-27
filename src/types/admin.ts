import type { EventType } from '@/types/events';
import type { Database } from '@/types/supabase';

type Functions = Database['public']['Functions'];

export type AttendanceRow = Functions['get_event_attendance']['Returns'][number];
export type FormStatus = 'submitted' | 'failed' | 'pending' | 'off';

/** An event in the officer events list. */
export interface AdminEventSummary {
  id: string;
  title: string;
  type: EventType;
  startsAt: string;
  locationName: string;
  checkInCount: number;
}

export interface EventLinkDraft {
  /** Missing for links that haven't been saved yet. */
  id?: string;
  title: string;
  url: string;
  /** The link members are sent to when they RSVP. At most one per event. */
  isRsvp: boolean;
}

/** Everything an officer edits on an event. */
export interface EventDraft {
  title: string;
  type: EventType;
  startsAt: Date;
  endsAt: Date;
  locationName: string;
  address: string;
  description: string;
  pointsValue: string;
  checkinCode: string;
  flyerUrl: string | null;
  links: EventLinkDraft[];
}

export interface MemberSearchResult {
  id: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
}
