import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { listAdminEvents } from '@/services/admin';
import type { AdminEventSummary } from '@/types/admin';

type SplitEvents = { upcoming: AdminEventSummary[]; past: AdminEventSummary[] };

/** Upcoming events soonest first; past events most recent first. */
function splitByNow(events: AdminEventSummary[], now: number): SplitEvents {
  return {
    upcoming: events.filter((event) => new Date(event.startsAt).getTime() >= now).reverse(),
    past: events.filter((event) => new Date(event.startsAt).getTime() < now),
  };
}

const LOAD_ERROR = 'Could not load events.';

/** Every event, split into upcoming and past. Reloads whenever the screen is focused. */
export function useAdminEvents() {
  const [events, setEvents] = useState<SplitEvents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Coming back from the editor shows the saved changes.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      listAdminEvents()
        .then((all) => {
          if (!active) return;
          setEvents(splitByNow(all, Date.now()));
          setError(null);
        })
        .catch((cause) => {
          if (active) setError(getFriendlyErrorMessage(cause, LOAD_ERROR));
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setEvents(splitByNow(await listAdminEvents(), Date.now()));
      setError(null);
    } catch (cause) {
      setError(getFriendlyErrorMessage(cause, LOAD_ERROR));
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    upcoming: events?.upcoming ?? [],
    past: events?.past ?? [],
    loading: events === null && !error,
    error,
    refresh,
    refreshing,
  };
}
