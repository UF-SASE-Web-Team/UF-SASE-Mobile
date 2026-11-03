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
    it('calls toggle_event_rsvp RPC and returns boolean result', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({ data: true, error: null });

      const result = await toggleEventRsvp('event-1');

      expect(supabase.rpc).toHaveBeenCalledWith('toggle_event_rsvp', {
        p_event_id: 'event-1',
      });
      expect(result).toBe(true);
    });

    it('returns false when RSVP was toggled off', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({ data: false, error: null });

      const result = await toggleEventRsvp('event-1');

      expect(supabase.rpc).toHaveBeenCalledWith('toggle_event_rsvp', {
        p_event_id: 'event-1',
      });
      expect(result).toBe(false);
    });

    it('throws error when RPC fails', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('RSVP window is closed'),
      });

      await expect(toggleEventRsvp('event-1')).rejects.toThrow('RSVP window is closed');
    });
  });
});
