import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPointsLeaderboard } from '@/services/points';
import type { LeaderboardEntry } from '@/types/points';

/**
 * This term's points leaderboard. Loads the first time `enabled` is true so the
 * points page only fetches it once the Leaderboard tab is opened.
 */
export function useLeaderboard(enabled: boolean) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldLoad = enabled && Boolean(user) && !loaded;

  useEffect(() => {
    if (!shouldLoad) return;
    let isMounted = true;

    getPointsLeaderboard()
      .then((data) => {
        if (!isMounted) return;
        setEntries(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching leaderboard:', err?.message);
        setError(err?.message || 'Failed to load the leaderboard.');
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [shouldLoad]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setEntries(await getPointsLeaderboard());
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err?.message);
      setError(err?.message || 'Failed to load the leaderboard.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    entries,
    loading: shouldLoad,
    refreshing,
    error,
    handleRefresh,
  };
}
