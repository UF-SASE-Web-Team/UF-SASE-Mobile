import { supabase } from '@/lib/supabase';
import { EventWithDetails, EventWithRsvp } from '@/types/events';

export async function getEvents(): Promise<EventWithRsvp[]> {
  const { data, error: fetchError } = await supabase
    .from('events')
    .select('*, event_rsvps(event_id, user_id), check_ins(event_id, user_id)')
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
      *,
      event_rsvps(event_id, user_id),
      check_ins(event_id, user_id),
      links:event_links(id, event_id, title, url, display_order),
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

export async function checkInToEvent(eventId: string, code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_in', {
    p_event_id: eventId,
    p_method: 'code',
    p_payload: code.trim(),
  });

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
