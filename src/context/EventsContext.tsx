import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEvents, toggleEventRsvp } from '@/services/events';
import { EventWithRsvp } from '@/types/events';

interface EventsContextType {
  events: EventWithRsvp[];
  activeEvents: EventWithRsvp[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  markEventAttended: (eventId: string) => void;
  toggleRsvp: (eventId: string) => Promise<boolean>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function EventsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventWithRsvp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getEvents()
      .then((data) => {
        if (!isMounted) return;
        setEvents(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching events:', err.message);
        setError(err.message || 'Failed to load events.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const refreshEvents = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getEvents();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching events:', err.message);
      setError(err.message || 'Failed to load events.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const markEventAttended = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((event) => (event.id === eventId ? { ...event, has_attended: true } : event)),
    );
  }, []);

  const toggleRsvp = useCallback(
    async (eventId: string) => {
      const targetEvent = events.find((e) => e.id === eventId);
      const currentStatus = Boolean(targetEvent?.is_rsvped);
      const nextStatus = !currentStatus;

      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, is_rsvped: nextStatus } : e)),
      );

      try {
        const serverStatus = await toggleEventRsvp(eventId);
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_rsvped: serverStatus } : e)),
        );
        return serverStatus;
      } catch (err) {
        // Revert on error
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_rsvped: currentStatus } : e)),
        );
        throw err;
      }
    },
    [events],
  );

  // Active events within checkin_opens_at/starts_at and checkin_closes_at/ends_at
  const activeEvents = useMemo(() => {
    const now = new Date();
    return events.filter((e) => {
      const opensAt = new Date(e.checkin_opens_at ?? e.starts_at);
      const closesAt = new Date(e.checkin_closes_at ?? e.ends_at);

      if (Number.isNaN(opensAt.getTime()) || Number.isNaN(closesAt.getTime())) {
        return false;
      }
      return now >= opensAt && now <= closesAt;
    });
  }, [events]);

  const value = useMemo(
    () => ({
      events,
      activeEvents,
      loading,
      refreshing,
      error,
      refreshEvents,
      markEventAttended,
      toggleRsvp,
    }),
    [
      events,
      activeEvents,
      loading,
      refreshing,
      error,
      refreshEvents,
      markEventAttended,
      toggleRsvp,
    ],
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}

export function useOptionalEvents() {
  return useContext(EventsContext);
}
