// Officer-only data access. The database enforces who can do what (is_officer
// policies and RPCs); these functions only shape requests and responses.
import { supabase } from '@/lib/supabase';
import { normalizeLinkUrl } from '@/lib/eventDraft';
import { prepareFlyer } from '@/lib/flyerImage';
import type {
  AdminEventSummary,
  AttendanceRow,
  EventDraft,
  MemberSearchResult,
} from '@/types/admin';

const FLYER_BUCKET = 'public-assets';
const FLYER_FOLDER = 'event-flyers';

export async function listAdminEvents(): Promise<AdminEventSummary[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, type, starts_at, location_name, check_ins(count)')
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    type: event.type,
    startsAt: event.starts_at,
    locationName: event.location_name,
    checkInCount: (event.check_ins as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

/**
 * Creates or updates an event and its links. Returns the event ID. Link order
 * follows the draft, and the link marked RSVP becomes the event's RSVP link.
 */
export async function saveEvent(draft: EventDraft, eventId?: string): Promise<string> {
  const fields = {
    title: draft.title.trim(),
    type: draft.type,
    starts_at: draft.startsAt.toISOString(),
    ends_at: draft.endsAt.toISOString(),
    location_name: draft.locationName.trim(),
    address: draft.address.trim() || null,
    description: draft.description.trim() || null,
    points_value: Number(draft.pointsValue),
    checkin_code: draft.checkinCode,
    flyer_url: draft.flyerUrl,
  };

  let id = eventId;
  if (id) {
    const { error } = await supabase.from('events').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from('events').insert(fields).select('id').single();
    if (error) throw error;
    id = data.id;
  }

  await saveEventLinks(id, draft);
  return id;
}

async function saveEventLinks(eventId: string, draft: EventDraft) {
  const { data: existing, error: loadError } = await supabase
    .from('event_links')
    .select('id')
    .eq('event_id', eventId);
  if (loadError) throw loadError;

  const keep = new Set(draft.links.map((link) => link.id).filter(Boolean));
  const removed = (existing ?? []).map((link) => link.id).filter((id) => !keep.has(id));

  let rsvpId: string | null = null;
  for (const [index, link] of draft.links.entries()) {
    const row = {
      event_id: eventId,
      title: link.title.trim(),
      url: normalizeLinkUrl(link.url),
      display_order: index,
    };
    let linkId = link.id;
    if (linkId) {
      const { error } = await supabase.from('event_links').update(row).eq('id', linkId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('event_links').insert(row).select('id').single();
      if (error) throw error;
      linkId = data.id;
    }
    if (link.isRsvp) rsvpId = linkId;
  }

  const { error: rsvpError } = await supabase
    .from('events')
    .update({ rsvp: rsvpId })
    .eq('id', eventId);
  if (rsvpError) throw rsvpError;

  if (removed.length > 0) {
    const { error } = await supabase.from('event_links').delete().in('id', removed);
    if (error) throw error;
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', eventId);
  if (error) {
    // check_ins keeps its foreign key so points are never deleted with an event.
    if (error.code === '23503') {
      throw new Error("Members have already checked in to this event, so it can't be deleted.");
    }
    throw error;
  }
}

/**
 * Converts a picked photo to a WebP under 500 KB, uploads it and points the
 * event at it. Returns the flyer's public URL.
 */
export async function uploadEventFlyer(
  eventId: string,
  image: { uri: string; width: number },
): Promise<string> {
  const body = await prepareFlyer(image.uri, image.width);
  const path = `${FLYER_FOLDER}/${eventId}/${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(FLYER_BUCKET)
    .upload(path, body, { contentType: 'image/webp' });
  if (uploadError) throw uploadError;

  // Stored as a full URL: event screens (including older app builds) load
  // flyer_url as-is rather than resolving bucket paths.
  const {
    data: { publicUrl },
  } = supabase.storage.from(FLYER_BUCKET).getPublicUrl(path);
  const { error } = await supabase
    .from('events')
    .update({ flyer_url: publicUrl })
    .eq('id', eventId);
  if (error) throw error;
  return publicUrl;
}

export async function getEventAttendance(eventId: string): Promise<AttendanceRow[]> {
  const { data, error } = await supabase.rpc('get_event_attendance', { p_event_id: eventId });
  if (error) throw error;
  return data ?? [];
}

/** Re-sends a check-in to the Google Form. False when the form sync is turned off. */
export async function resendCheckInForm(checkInId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('resend_check_in_form', {
    p_check_in_id: checkInId,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function officerCheckIn(eventId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('officer_check_in', {
    p_event_id: eventId,
    p_user_id: userId,
  });
  if (error) throw error;
}

/** Members whose name or username contains the query. */
export async function searchMembers(query: string): Promise<MemberSearchResult[]> {
  // Commas and parentheses would break the PostgREST `or` filter.
  const term = query
    .trim()
    .replace(/[,()%*]/g, ' ')
    .trim();
  if (term.length < 2) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`)
    .order('full_name')
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((member) => ({
    id: member.id,
    fullName: member.full_name,
    username: member.username,
    avatarUrl: member.avatar_url,
  }));
}
