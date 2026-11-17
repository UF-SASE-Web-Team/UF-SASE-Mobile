import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPointsLog, getPointsSummary } from '@/services/points';
import type { PointsLogEntry, PointsSummary } from '@/types/points';

export const FREE_SHIRT_POINTS = 4;

function loadPoints(userId: string) {
  return Promise.all([getPointsLog(userId), getPointsSummary()]);
}

export function usePointsLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PointsLogEntry[]>([]);
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const applyResult = useCallback(([log, nextSummary]: [PointsLogEntry[], PointsSummary]) => {
    setEntries(log);
    setSummary(nextSummary);
    setError(null);
  }, []);

  const applyError = useCallback((err: any) => {
    console.error('Error fetching points:', err?.message);
    setError(err?.message || 'Failed to load points.');
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    loadPoints(user.id)
      .then((result) => {
        if (isMounted) applyResult(result);
      })
      .catch((err) => {
        if (isMounted) applyError(err);
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user, applyResult, applyError]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      applyResult(await loadPoints(user.id));
    } catch (err) {
      applyError(err);
    } finally {
      setRefreshing(false);
    }
  }, [user, applyResult, applyError]);

  return {
    entries,
    summary,
    // Without a signed-in user there is nothing to load, so never show a spinner.
    loading: Boolean(user) && !loaded,
    refreshing,
    error,
    showInfo,
    setShowInfo,
    totalPoints: summary?.totalPoints ?? 0,
    handleRefresh,
  };
}
