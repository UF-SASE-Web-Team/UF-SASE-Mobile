import { checkInToEvent, getEvent, getEvents, toggleEventRsvp } from '@/services/events';
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

  describe('getEvent', () => {
    it('fetches single event and computes is_rsvped, has_attended, and sorted links', async () => {
      const mockEvent = {
        id: 'event-123',
        title: 'Single Event',
        event_rsvps: [{ event_id: 'event-123', user_id: 'user-1' }],
        check_ins: [],
        links: [
          { id: 'link-2', title: 'Carpool', url: 'https://carpool.com', display_order: 2 },
          { id: 'link-1', title: 'RSVP Form', url: 'https://form.com', display_order: 1 },
        ],
      };

      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockEvent, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      const result = await getEvent('event-123');

      expect(supabase.from).toHaveBeenCalledWith('events');
      expect(mockEq).toHaveBeenCalledWith('id', 'event-123');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'event-123',
          is_rsvped: true,
          has_attended: false,
          links: [
            { id: 'link-1', title: 'RSVP Form', url: 'https://form.com', display_order: 1 },
            { id: 'link-2', title: 'Carpool', url: 'https://carpool.com', display_order: 2 },
          ],
        }),
      );
    });

    it('returns null if event does not exist', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      const result = await getEvent('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('checkInToEvent', () => {
    it('calls check_in RPC with code and returns true', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: { id: 'checkin-1' },
        error: null,
      });

      const result = await checkInToEvent('event-123', '123456');

      expect(supabase.rpc).toHaveBeenCalledWith('check_in', {
        p_event_id: 'event-123',
        p_method: 'code',
        p_payload: '123456',
      });
      expect(result).toBe(true);
    });

    it('calls check_in RPC with qr method when specified', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: { id: 'checkin-2' },
        error: null,
      });

      const result = await checkInToEvent('event-123', 'https://ufsase.com/qr', 'qr');

      expect(supabase.rpc).toHaveBeenCalledWith('check_in', {
        p_event_id: 'event-123',
        p_method: 'qr',
        p_payload: 'https://ufsase.com/qr',
      });
      expect(result).toBe(true);
    });

    it('throws error if check_in RPC fails', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Invalid check-in payload'),
      });

      await expect(checkInToEvent('event-123', '000000')).rejects.toThrow(
        'Invalid check-in payload',
      );
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
