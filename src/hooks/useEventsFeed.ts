import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TimeFilter, TypeFilter } from '@/components/events/EventFilters';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { openExternalLink } from '@/lib/links';
import { EventRow, EventWithRsvp } from '@/types/events';

export interface EventSection {
  key: string;
  title: string;
  data: EventWithRsvp[];
}

export function useEventsFeed() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    events,
    activeEvents,
    loading,
    refreshing,
    error,
    refreshEvents,
    markEventAttended,
    toggleRsvp,
  } = useEvents();

  const [selectedCheckInEvent, setSelectedCheckInEvent] = useState<EventRow | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const isFiltered = timeFilter !== 'upcoming' || typeFilter !== 'all';

  const clearFilters = () => {
    setTimeFilter('upcoming');
    setTypeFilter('all');
  };

  const handleCardPress = (event: EventRow) => {
    router.push(`/events/${event.id}` as any);
  };

  const handleCheckInPress = (event: EventRow) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to events.');
      return;
    }
    if ((event as EventWithRsvp).has_attended) {
      Alert.alert('Already checked in', 'You have already checked in to this event.');
      return;
    }
    setSelectedCheckInEvent(event);
  };

  const handleRsvpPress = async (event: EventRow) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to RSVP for events.');
      return;
    }

    try {
      const isGoing = await toggleRsvp(event.id);
      const rsvpUrl = (event as EventWithRsvp).rsvp_link?.url;
      // Send the user to the RSVP form when they RSVP, not when they cancel.
      if (isGoing && rsvpUrl) {
        await openExternalLink(rsvpUrl);
      }
    } catch (err: any) {
      Alert.alert('RSVP Error', err.message || 'Could not update RSVP status.');
    }
  };

  // Filter events based on timeFilter and typeFilter
  const filteredEvents = useMemo(() => {
    const now = new Date().getTime();

    // Since `events` is already ordered chronologically ascending by `starts_at`,
    // iterating backwards filters and reverses in a single O(N) pass for 'past' events
    // without an extra sort or reverse step.
    if (timeFilter === 'past') {
      const result: EventWithRsvp[] = [];
      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (typeFilter !== 'all' && event.type !== typeFilter) {
          continue;
        }
        if (new Date(event.ends_at).getTime() < now) {
          result.push(event);
        }
      }
      return result;
    }

    const result: EventWithRsvp[] = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (typeFilter !== 'all' && event.type !== typeFilter) {
        continue;
      }
      if (timeFilter === 'upcoming' && new Date(event.ends_at).getTime() < now) {
        continue;
      }
      result.push(event);
    }
    return result;
  }, [events, timeFilter, typeFilter]);

  // Group filtered events by month & year into SectionList sections
  const monthSections = useMemo<EventSection[]>(() => {
    const groups = new Map<string, EventSection>();

    filteredEvents.forEach((event) => {
      const date = new Date(event.starts_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          title: date.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          }),
          data: [],
        };
        groups.set(key, group);
      }
      group.data.push(event);
    });

    return Array.from(groups.values());
  }, [filteredEvents]);

  const handleCheckInSuccess = () => {
    if (selectedCheckInEvent) {
      markEventAttended(selectedCheckInEvent.id);
      setSelectedCheckInEvent(null);
      refreshEvents();
    }
  };

  return {
    activeEvents,
    monthSections,
    loading,
    refreshing,
    error,
    timeFilter,
    typeFilter,
    isFiltered,
    selectedCheckInEvent,
    setTimeFilter,
    setTypeFilter,
    clearFilters,
    setSelectedCheckInEvent,
    handleCardPress,
    handleCheckInPress,
    handleRsvpPress,
    handleCheckInSuccess,
    refreshEvents,
  };
}
