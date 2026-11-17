import {
  getLeaderboard,
  getPointsLog,
  getUserLeaderboardRank,
  getUserPointsTotal,
} from '@/services/points';
import { supabase } from '@/lib/supabase';

describe('points service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPointsLog', () => {
    it('fetches point transactions for a user and formats entries correctly', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          title: 'GBM #1: Avatar the Last SASEbender',
          category: 'attendance',
          amount: 1,
          created_at: '2026-09-02T00:00:00Z',
          event_id: 'event-gbm-1',
          rule_id: 'gbm_attendance',
          description: 'Attended GBM #1',
        },
        {
          id: 'tx-2',
          title: 'Create SASE Account',
          category: 'digital_engagement',
          amount: 1,
          created_at: '2026-09-01T12:00:00Z',
          event_id: null,
          rule_id: 'account_created',
          description: 'Awarded for creating a UF SASE account',
        },
      ];

      const mockOrder = jest.fn().mockResolvedValue({ data: mockTransactions, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      const result = await getPointsLog('user-123');

      expect(supabase.from).toHaveBeenCalledWith('point_transactions');
      expect(mockSelect).toHaveBeenCalledWith(
        'id, title, category, amount, created_at, event_id, rule_id, description',
      );
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tx-1',
        title: 'GBM #1: Avatar the Last SASEbender',
        category: 'attendance',
        pointsValue: 1,
        date: '2026-09-02T00:00:00Z',
        eventId: 'event-gbm-1',
        ruleId: 'gbm_attendance',
        description: 'Attended GBM #1',
      });
      expect(result[1]).toEqual({
        id: 'tx-2',
        title: 'Create SASE Account',
        category: 'digital_engagement',
        pointsValue: 1,
        date: '2026-09-01T12:00:00Z',
        eventId: null,
        ruleId: 'account_created',
        description: 'Awarded for creating a UF SASE account',
      });
    });

    it('throws error when database query fails', async () => {
      const dbError = new Error('Database connection failed');
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: dbError });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      await expect(getPointsLog('user-123')).rejects.toThrow('Database connection failed');
    });

    it('returns empty array when no data exists', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      const result = await getPointsLog('user-456');
      expect(result).toEqual([]);
    });
  });

  describe('getUserPointsTotal', () => {
    it('returns total points from RPC call', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({ data: 42, error: null });

      const total = await getUserPointsTotal('user-123', 'fall-2026');

      expect(supabase.rpc).toHaveBeenCalledWith('get_user_points_total', {
        p_user_id: 'user-123',
        p_term: 'fall-2026',
      });
      expect(total).toBe(42);
    });

    it('falls back to querying point_transactions table when RPC returns error', async () => {
      (supabase.rpc as jest.Mock) = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('RPC not found') });

      const mockRows = [{ amount: 10 }, { amount: 5 }, { amount: 2 }];
      const mockEqTerm = jest.fn().mockResolvedValue({ data: mockRows, error: null });
      const mockEqUser = jest.fn().mockReturnValue({ eq: mockEqTerm });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEqUser });
      (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: mockSelect });

      const total = await getUserPointsTotal('user-123', 'fall-2026');

      expect(supabase.from).toHaveBeenCalledWith('point_transactions');
      expect(total).toBe(17);
    });
  });

  describe('getLeaderboard', () => {
    it('calls get_leaderboard RPC and maps member rankings', async () => {
      const mockRpcData = [
        { rank: 1, user_id: 'u1', name: 'Alice Gator', points: 30, avatar_url: 'sase-shark' },
        { rank: 2, user_id: 'u2', name: 'Bob Gator', points: 20, avatar_url: null },
      ];
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({ data: mockRpcData, error: null });

      const result = await getLeaderboard('fall-2026', 25);

      expect(supabase.rpc).toHaveBeenCalledWith('get_leaderboard', {
        p_term: 'fall-2026',
        p_limit: 25,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        rank: 1,
        userId: 'u1',
        name: 'Alice Gator',
        points: 30,
        avatarUrl: 'sase-shark',
      });
      expect(result[1]).toEqual({
        rank: 2,
        userId: 'u2',
        name: 'Bob Gator',
        points: 20,
        avatarUrl: null,
      });
    });

    it('throws error when get_leaderboard RPC fails', async () => {
      (supabase.rpc as jest.Mock) = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('Network error') });

      await expect(getLeaderboard()).rejects.toThrow('Network error');
    });
  });

  describe('getUserLeaderboardRank', () => {
    it('returns rank from get_user_leaderboard_rank RPC', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({ data: 14, error: null });

      const rank = await getUserLeaderboardRank('user-123', 'fall-2026');

      expect(supabase.rpc).toHaveBeenCalledWith('get_user_leaderboard_rank', {
        p_user_id: 'user-123',
        p_term: 'fall-2026',
      });
      expect(rank).toBe(14);
    });

    it('falls back to getLeaderboard when RPC fails or is missing', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockImplementation((fn: string) => {
        if (fn === 'get_user_leaderboard_rank') {
          return Promise.resolve({ data: null, error: new Error('RPC not found') });
        }
        if (fn === 'get_leaderboard') {
          return Promise.resolve({
            data: [
              { rank: 1, user_id: 'u1', name: 'Alice', points: 30, avatar_url: null },
              { rank: 5, user_id: 'user-123', name: 'Bob', points: 15, avatar_url: null },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const rank = await getUserLeaderboardRank('user-123', 'fall-2026');

      expect(rank).toBe(5);
    });

    it('returns null when user is not on leaderboard', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockImplementation((fn: string) => {
        if (fn === 'get_user_leaderboard_rank') {
          return Promise.resolve({ data: null, error: new Error('RPC not found') });
        }
        if (fn === 'get_leaderboard') {
          return Promise.resolve({
            data: [{ rank: 1, user_id: 'u1', name: 'Alice', points: 30, avatar_url: null }],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const rank = await getUserLeaderboardRank('user-not-found');
      expect(rank).toBeNull();
    });
  });
});
