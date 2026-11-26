import { supabase } from '@/lib/supabase';
import { EventWithDetails, EventWithRsvp } from '@/types/events';

/**
 * Every events column members may read. `checkin_code` is left out on purpose:
 * the database refuses it (and `*`) for members, and officers fetch it with
 * `getEventCheckinCode`.
 */
const EVENT_COLUMNS =
  'id, title, type, description, starts_at, ends_at, location_name, address, lat, lng, flyer_url, rsvp, program_id, points_value, checkin_opens_at, checkin_closes_at, created_at';

export async function getEvents(): Promise<EventWithRsvp[]> {
  const { data, error: fetchError } = await supabase
    .from('events')
    .select(
      `${EVENT_COLUMNS}, event_rsvps(event_id, user_id), check_ins(event_id, user_id), rsvp_link:event_links!events_rsvp_fkey(id, event_id, title, url)`,
    )
    .order('starts_at', { ascending: true });

  if (fetchError) throw fetchError;

  return (data || []).map((event: any) => ({
    ...event,
    is_rsvped: Boolean(event.event_rsvps && event.event_rsvps.length > 0),
    has_attended: Boolean(event.check_ins && event.check_ins.length > 0),
  }));
}

export async function getEvent(eventId: string): Promise<EventWithDetails | null> {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      ${EVENT_COLUMNS},
      event_rsvps(event_id, user_id),
      check_ins(event_id, user_id),
      links:event_links!event_links_event_id_fkey(id, event_id, title, url, display_order),
      rsvp_link:event_links!events_rsvp_fkey(id, event_id, title, url),
      program:programs(
        id,
        name,
        program_members(
          id,
          user_id,
          display_name,
          is_poc,
          profile:profiles(
            id,
            full_name,
            avatar_url
          )
        )
      )
    `,
    )
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const links = ((data as any).links || []).sort(
    (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  return {
    ...data,
    links,
    is_rsvped: Boolean(data.event_rsvps && (data.event_rsvps as any[]).length > 0),
    has_attended: Boolean(data.check_ins && (data.check_ins as any[]).length > 0),
  } as EventWithDetails;
}

/** An event's 6-digit check-in code. Officers only; members get an error. */
export async function getEventCheckinCode(eventId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_event_checkin_code', { p_event_id: eventId });
  if (error) throw error;
  return data ?? null;
}

export async function checkInToEvent(
  eventId: string,
  payload: string,
  method: 'code' | 'qr' = 'code',
  attendedThisYear?: boolean,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_in', {
    p_event_id: eventId,
    p_method: method,
    p_payload: payload.trim(),
    ...(attendedThisYear === undefined ? {} : { p_attended_this_year: attendedThisYear }),
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Whether the signed-in member already checked in to an event this school year.
 * If not, check-in first asks whether they've attended a SASE event this year.
 */
export async function hasCheckedInThisSchoolYear(): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_checked_in_this_school_year');
  if (error) throw error;
  return Boolean(data);
}

export async function toggleEventRsvp(eventId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_event_rsvp', {
    p_event_id: eventId,
  });

  if (error) throw error;
  return Boolean(data);
}
