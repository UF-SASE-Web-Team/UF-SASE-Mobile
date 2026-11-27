import type { EventDraft } from '@/types/admin';
import type { EventWithDetails } from '@/types/events';

export const CHECKIN_CODE_LENGTH = 6;
export const MAX_EVENT_POINTS = 10;

/** A random 6-digit check-in code, like the database default. */
export function randomCheckinCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(CHECKIN_CODE_LENGTH, '0');
}

/** A new event starting at the next full hour, running for an hour. */
export function emptyEventDraft(now: Date = new Date()): EventDraft {
  const startsAt = new Date(now);
  startsAt.setMinutes(0, 0, 0);
  startsAt.setHours(startsAt.getHours() + 1);
  const endsAt = new Date(startsAt);
  endsAt.setHours(endsAt.getHours() + 1);
  return {
    title: '',
    type: 'gbm',
    startsAt,
    endsAt,
    locationName: '',
    address: '',
    description: '',
    pointsValue: '1',
    checkinCode: randomCheckinCode(),
    flyerUrl: null,
    links: [],
  };
}

export function draftFromEvent(event: EventWithDetails, checkinCode: string): EventDraft {
  return {
    title: event.title,
    type: event.type,
    startsAt: new Date(event.starts_at),
    endsAt: new Date(event.ends_at),
    locationName: event.location_name,
    address: event.address ?? '',
    description: event.description ?? '',
    pointsValue: String(event.points_value),
    checkinCode,
    flyerUrl: event.flyer_url ?? null,
    links: (event.links ?? []).map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      isRsvp: link.id === event.rsvp,
    })),
  };
}

/** Moves the end time along with the start, keeping the event's length. */
export function moveStart(draft: EventDraft, startsAt: Date): EventDraft {
  const length = draft.endsAt.getTime() - draft.startsAt.getTime();
  return { ...draft, startsAt, endsAt: new Date(startsAt.getTime() + Math.max(length, 0)) };
}

/** Field-level problems with a draft, keyed by field. Empty when it can be saved. */
export function validateEventDraft(draft: EventDraft): Partial<Record<string, string>> {
  const errors: Partial<Record<string, string>> = {};
  if (!draft.title.trim()) errors.title = 'Add a title.';
  if (!draft.locationName.trim()) errors.locationName = 'Add a location.';
  if (draft.endsAt <= draft.startsAt) errors.endsAt = 'The event must end after it starts.';
  const points = Number(draft.pointsValue);
  if (!/^\d+$/.test(draft.pointsValue.trim()) || points < 0 || points > MAX_EVENT_POINTS) {
    errors.pointsValue = `Points must be a whole number from 0 to ${MAX_EVENT_POINTS}.`;
  }
  if (!new RegExp(`^\\d{${CHECKIN_CODE_LENGTH}}$`).test(draft.checkinCode)) {
    errors.checkinCode = `The check-in code is ${CHECKIN_CODE_LENGTH} digits.`;
  }
  draft.links.forEach((link, index) => {
    if (!link.title.trim() || !link.url.trim()) {
      errors[`link${index}`] = 'Each link needs a title and a URL.';
    }
  });
  return errors;
}

/** Adds https:// to bare links like "forms.gle/abc". */
export function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
