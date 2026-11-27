import {
  draftFromEvent,
  emptyEventDraft,
  moveStart,
  normalizeLinkUrl,
  validateEventDraft,
} from '@/lib/eventDraft';
import type { EventWithDetails } from '@/types/events';

describe('event drafts', () => {
  const now = new Date(2026, 10, 20, 14, 25);

  it('starts new events at the next full hour with a fresh 6-digit code', () => {
    const draft = emptyEventDraft(now);
    expect(draft.startsAt).toEqual(new Date(2026, 10, 20, 15, 0));
    expect(draft.endsAt).toEqual(new Date(2026, 10, 20, 16, 0));
    expect(draft.checkinCode).toMatch(/^\d{6}$/);
  });

  it('keeps the event length when the start moves', () => {
    const draft = emptyEventDraft(now);
    const moved = moveStart(draft, new Date(2026, 10, 21, 18, 0));
    expect(moved.endsAt).toEqual(new Date(2026, 10, 21, 19, 0));
  });

  it('flags every field that would be rejected', () => {
    const draft = {
      ...emptyEventDraft(now),
      title: ' ',
      locationName: '',
      pointsValue: '11',
      checkinCode: '123',
      links: [{ title: 'Slides', url: '', isRsvp: false }],
    };
    draft.endsAt = draft.startsAt;
    expect(Object.keys(validateEventDraft(draft)).sort()).toEqual(
      ['checkinCode', 'endsAt', 'link0', 'locationName', 'pointsValue', 'title'].sort(),
    );
    expect(
      validateEventDraft({ ...emptyEventDraft(now), title: 'GBM', locationName: 'Reitz' }),
    ).toEqual({});
  });

  it('marks the event RSVP link when editing', () => {
    const draft = draftFromEvent(
      {
        id: 'e1',
        title: 'GBM',
        type: 'gbm',
        starts_at: '2026-11-20T23:00:00Z',
        ends_at: '2026-11-21T00:00:00Z',
        location_name: 'Reitz',
        points_value: 2,
        rsvp: 'l2',
        links: [
          { id: 'l1', event_id: 'e1', title: 'Slides', url: 'https://a.co' },
          { id: 'l2', event_id: 'e1', title: 'RSVP', url: 'https://b.co' },
        ],
      } as EventWithDetails,
      '123456',
    );
    expect(draft.links.map((link) => link.isRsvp)).toEqual([false, true]);
    expect(draft.pointsValue).toBe('2');
    expect(draft.checkinCode).toBe('123456');
  });

  it('adds https to bare links', () => {
    expect(normalizeLinkUrl(' forms.gle/abc ')).toBe('https://forms.gle/abc');
    expect(normalizeLinkUrl('http://ufsase.com')).toBe('http://ufsase.com');
  });
});
