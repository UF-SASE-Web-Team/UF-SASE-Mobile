import { supabase } from '@/lib/supabase';
import { EventWithRsvp } from '@/types/events';

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

export async function toggleEventRsvp(
  eventId: string,
  userId: string,
  currentlyRsvped: boolean,
): Promise<boolean> {
  if (currentlyRsvped) {
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .match({ event_id: eventId, user_id: userId });

    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('event_rsvps')
      .insert({ event_id: eventId, user_id: userId });

    if (error) throw error;
    return true;
  }
}
