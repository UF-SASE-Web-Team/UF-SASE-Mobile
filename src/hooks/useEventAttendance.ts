import { useCallback, useEffect, useState } from 'react';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { getEventAttendance, officerCheckIn, resendCheckInForm } from '@/services/admin';
import type { AttendanceRow } from '@/types/admin';

/** One event's check-ins with their Google Form status. Loads once `enabled`. */
export function useEventAttendance(eventId: string | undefined, enabled: boolean) {
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [resending, setResending] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      setRows(await getEventAttendance(eventId));
      setError(null);
    } catch (cause) {
      setError(getFriendlyErrorMessage(cause, 'Could not load attendance.'));
    }
  }, [eventId]);

  const shouldLoad = enabled && !!eventId && rows === null && !error;
  useEffect(() => {
    if (!shouldLoad || !eventId) return;
    let active = true;
    getEventAttendance(eventId)
      .then((data) => {
        if (active) setRows(data);
      })
      .catch((cause) => {
        if (active) setError(getFriendlyErrorMessage(cause, 'Could not load attendance.'));
      });
    return () => {
      active = false;
    };
  }, [shouldLoad, eventId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  /** Re-sends one check-in. Resolves false when the form sync is turned off. */
  const resend = async (checkInId: string): Promise<boolean> => {
    setResending(checkInId);
    try {
      const queued = await resendCheckInForm(checkInId);
      await load();
      return queued;
    } finally {
      setResending(null);
    }
  };

  const addAttendee = async (userId: string) => {
    if (!eventId) return;
    await officerCheckIn(eventId, userId);
    await load();
  };

  return {
    rows: rows ?? [],
    loading: shouldLoad,
    error,
    refreshing,
    refresh,
    resending,
    resend,
    addAttendee,
  };
}
