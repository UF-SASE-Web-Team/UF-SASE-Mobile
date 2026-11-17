import { getPointsLeaderboard, getPointsSummary, LEADERBOARD_SIZE } from '@/services/points';
import { supabase } from '@/lib/supabase';

describe('points service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPointsSummary', () => {
    it('maps the summary RPC row', async () => {
      const single = jest.fn().mockResolvedValue({
        data: {
          total_points: 8,
          semester_points: 3,
          semester_rank: 1,
          ranked_members: 12,
          term_name: 'Fall 2026',
        },
        error: null,
      });
      (supabase.rpc as jest.Mock) = jest.fn().mockReturnValue({ single });

      await expect(getPointsSummary()).resolves.toEqual({
        totalPoints: 8,
        semesterPoints: 3,
        semesterRank: 1,
        rankedMembers: 12,
        termName: 'Fall 2026',
      });
      expect(supabase.rpc).toHaveBeenCalledWith('get_points_summary');
    });

    it('treats a missing rank as unranked', async () => {
      const single = jest.fn().mockResolvedValue({
        data: {
          total_points: 0,
          semester_points: 0,
          semester_rank: null,
          ranked_members: 4,
          term_name: null,
        },
        error: null,
      });
      (supabase.rpc as jest.Mock) = jest.fn().mockReturnValue({ single });

      const summary = await getPointsSummary();

      expect(summary.semesterRank).toBeNull();
      expect(summary.termName).toBeNull();
    });

    it('throws RPC errors', async () => {
      const single = jest.fn().mockResolvedValue({ data: null, error: new Error('boom') });
      (supabase.rpc as jest.Mock) = jest.fn().mockReturnValue({ single });

      await expect(getPointsSummary()).rejects.toThrow('boom');
    });
  });

  describe('getPointsLeaderboard', () => {
    it('requests the default size and maps rows', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: [
          {
            member_rank: 1,
            user_id: 'user-1',
            full_name: 'Alice Gator',
            username: 'alice',
            avatar_url: 'sase-shark',
            points: 4,
            is_me: true,
          },
        ],
        error: null,
      });

      const result = await getPointsLeaderboard();

      expect(supabase.rpc).toHaveBeenCalledWith('get_points_leaderboard', {
        p_limit: LEADERBOARD_SIZE,
      });
      expect(result).toEqual([
        {
          rank: 1,
          userId: 'user-1',
          fullName: 'Alice Gator',
          username: 'alice',
          avatarUrl: 'sase-shark',
          points: 4,
          isMe: true,
        },
      ]);
    });

    it('throws RPC errors', async () => {
      (supabase.rpc as jest.Mock) = jest
        .fn()
        .mockResolvedValue({ data: null, error: new Error('nope') });

      await expect(getPointsLeaderboard()).rejects.toThrow('nope');
    });
  });
});
