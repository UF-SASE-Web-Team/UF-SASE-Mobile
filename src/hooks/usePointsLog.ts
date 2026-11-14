import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPointsLog } from '@/services/points';
import type { PointsLogEntry } from '@/types/points';

export const FREE_SHIRT_POINTS = 4;

export function usePointsLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<PointsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    try {
      const data = await getPointsLog(user.id);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching points log:', err.message);
      setError(err.message || 'Failed to load points.');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getPointsLog(user.id)
      .then((data) => {
        if (!isMounted) return;
        setEntries(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching points log:', err.message);
        setError(err.message || 'Failed to load points.');
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

  const totalPoints = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.pointsValue, 0),
    [entries],
  );

  return {
    entries,
    loading,
    refreshing,
    error,
    showInfo,
    setShowInfo,
    totalPoints,
    handleRefresh,
  };
}
