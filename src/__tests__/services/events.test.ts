import { getEvents, toggleEventRsvp } from '@/services/events';
import { supabase } from '@/lib/supabase';

describe('events service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('correctly maps is_rsvped and has_attended from Supabase joins', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Attended & RSVPeed Event',
          starts_at: '2026-09-01T18:00:00Z',
          ends_at: '2026-09-01T20:00:00Z',
          points_value: 2,
          event_rsvps: [{ event_id: 'event-1', user_id: 'user-1' }],
          check_ins: [{ event_id: 'event-1', user_id: 'user-1' }],
        },
        {
          id: 'event-2',
          title: 'Not Attended Event',
          starts_at: '2026-09-02T18:00:00Z',
          ends_at: '2026-09-02T20:00:00Z',
          points_value: 1,
          event_rsvps: [],
          check_ins: [],
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockEvents, error: null });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      const result = await getEvents();

      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(mockSelect).toHaveBeenCalledWith(
        '*, event_rsvps(event_id, user_id), check_ins(event_id, user_id)',
      );
      expect(result).toEqual([
        expect.objectContaining({
          id: 'event-1',
          is_rsvped: true,
          has_attended: true,
        }),
        expect.objectContaining({
          id: 'event-2',
          is_rsvped: false,
          has_attended: false,
        }),
      ]);
    });

    it('throws error when supabase query fails', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });
      const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      await expect(getEvents()).rejects.toThrow('Network error');
    });
  });

  describe('toggleEventRsvp', () => {
    it('deletes RSVP when currently rsvped', async () => {
      const mockMatch = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ match: mockMatch });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ delete: mockDelete });

      const result = await toggleEventRsvp('event-1', 'user-1', true);

      expect(supabase.from).toHaveBeenCalledWith('event_rsvps');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockMatch).toHaveBeenCalledWith({ event_id: 'event-1', user_id: 'user-1' });
      expect(result).toBe(false);
    });

    it('inserts RSVP when not currently rsvped', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ insert: mockInsert });

      const result = await toggleEventRsvp('event-1', 'user-1', false);

      expect(supabase.from).toHaveBeenCalledWith('event_rsvps');
      expect(mockInsert).toHaveBeenCalledWith({ event_id: 'event-1', user_id: 'user-1' });
      expect(result).toBe(true);
    });
  });
});
