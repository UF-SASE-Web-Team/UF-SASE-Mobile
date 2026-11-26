import { supabase } from '@/lib/supabase';
import { deleteEvent, saveEvent, searchMembers } from '@/services/admin';
import type { EventDraft } from '@/types/admin';

type Call = { table: string; method: string; args: unknown[] };

/**
 * A stand-in for supabase.from(): every builder method is recorded and
 * chainable, and awaiting (or .single()) yields `result(table, calls)`.
 */
function mockTables(result: (table: string, methods: string[]) => unknown) {
  const calls: Call[] = [];
  (supabase.from as jest.Mock) = jest.fn((table: string) => {
    const methods: string[] = [];
    const builder: any = new Proxy(
      {},
      {
        get(_, prop: string) {
          if (prop === 'then') {
            const value = result(table, methods);
            return (resolve: (v: unknown) => void) => resolve(value);
          }
          return (...args: unknown[]) => {
            methods.push(prop);
            calls.push({ table, method: prop, args });
            return prop === 'single' ? Promise.resolve(result(table, methods)) : builder;
          };
        },
      },
    );
    return builder;
  });
  return calls;
}

const draft: EventDraft = {
  title: ' GBM 5 ',
  type: 'gbm',
  startsAt: new Date('2026-12-01T23:00:00Z'),
  endsAt: new Date('2026-12-02T00:00:00Z'),
  locationName: 'Reitz',
  address: '',
  description: '',
  pointsValue: '2',
  checkinCode: '123456',
  flyerUrl: null,
  links: [
    { id: 'keep', title: 'Slides', url: 'slides.com/x', isRsvp: false },
    { title: 'RSVP', url: 'https://forms.gle/new', isRsvp: true },
  ],
};

describe('admin service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an event, syncs its links and sets the RSVP link', async () => {
    const calls = mockTables((table, methods) => {
      if (table === 'events' && methods.includes('insert')) {
        return { data: { id: 'event-1' }, error: null };
      }
      if (table === 'event_links' && methods[0] === 'select') {
        return { data: [{ id: 'keep' }, { id: 'old' }], error: null };
      }
      if (table === 'event_links' && methods.includes('insert')) {
        return { data: { id: 'new-link' }, error: null };
      }
      return { data: null, error: null };
    });

    await expect(saveEvent(draft)).resolves.toBe('event-1');

    const insert = calls.find((c) => c.table === 'events' && c.method === 'insert');
    expect(insert?.args[0]).toEqual(
      expect.objectContaining({ title: 'GBM 5', points_value: 2, address: null }),
    );
    const linkInsert = calls.find((c) => c.table === 'event_links' && c.method === 'insert');
    expect(linkInsert?.args[0]).toEqual(
      expect.objectContaining({ title: 'RSVP', display_order: 1, event_id: 'event-1' }),
    );
    const linkUpdate = calls.find((c) => c.table === 'event_links' && c.method === 'update');
    expect(linkUpdate?.args[0]).toEqual(expect.objectContaining({ url: 'https://slides.com/x' }));
    const rsvp = calls.filter((c) => c.table === 'events' && c.method === 'update').at(-1);
    expect(rsvp?.args[0]).toEqual({ rsvp: 'new-link' });
    const removed = calls.find((c) => c.table === 'event_links' && c.method === 'in');
    expect(removed?.args).toEqual(['id', ['old']]);
  });

  it('explains why an event with check-ins cannot be deleted', async () => {
    mockTables(() => ({ data: null, error: { code: '23503', message: 'fk' } }));
    await expect(deleteEvent('event-1')).rejects.toThrow(/already checked in/);
  });

  it('only searches members with a usable query', async () => {
    const calls = mockTables(() => ({ data: [], error: null }));
    await expect(searchMembers(' a ')).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();

    await searchMembers('alice, (x)');
    const filter = calls.find((c) => c.method === 'or');
    expect(filter?.args[0]).not.toMatch(/[,(]x/);
    expect(filter?.args[0]).toContain('full_name.ilike.%alice');
  });
});
