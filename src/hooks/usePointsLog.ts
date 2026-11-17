import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { getPointsLog, getUserLeaderboardRank, getUserPointsTotal } from '@/services/points';
import type { PointsLogEntry } from '@/types/points';

export const FREE_SHIRT_POINTS = 4;

export function usePointsLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PointsLogEntry[]>([]);
  const [totalPointsFromRpc, setTotalPointsFromRpc] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setTotalPointsFromRpc(null);
      setRank(null);
      return;
    }
    try {
      const [entriesData, totalData, rankData] = await Promise.all([
        getPointsLog(user.id),
        getUserPointsTotal(user.id).catch(() => null),
        getUserLeaderboardRank(user.id).catch(() => null),
      ]);
      setEntries(entriesData);
      setTotalPointsFromRpc(totalData);
      setRank(rankData);
      setError(null);
    } catch (err: any) {
      console.warn('Error fetching points log:', err?.message || err);
      setError(getFriendlyErrorMessage(err, "Couldn't load points."));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    Promise.all([
      getPointsLog(user.id),
      getUserPointsTotal(user.id).catch(() => null),
      getUserLeaderboardRank(user.id).catch(() => null),
    ])
      .then(([entriesData, totalData, rankData]) => {
        if (!isMounted) return;
        setEntries(entriesData);
        setTotalPointsFromRpc(totalData);
        setRank(rankData);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.warn('Error fetching points log:', err?.message || err);
        setError(getFriendlyErrorMessage(err, "Couldn't load points."));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const totalPoints = useMemo(() => {
    if (typeof totalPointsFromRpc === 'number') {
      return totalPointsFromRpc;
    }
    return entries.reduce((sum, entry) => sum + entry.pointsValue, 0);
  }, [totalPointsFromRpc, entries]);

  return {
    entries,
    loading,
    refreshing,
    error,
    showInfo,
    setShowInfo,
    totalPoints,
    rank,
    handleRefresh,
  };
}
