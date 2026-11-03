import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EventCard } from '@/components/EventCard';
import { EventFilters, TimeFilter, TypeFilter } from '@/components/EventFilters';
import { HappeningNowCard } from '@/components/HappeningNowCard';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getEvents, toggleEventRsvp } from '@/services/events';
import { type Colors, space } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

interface MonthGroup {
  key: string;
  title: string;
  events: EventWithRsvp[];
}

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [events, setEvents] = useState<EventWithRsvp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    let isMounted = true;

    getEvents()
      .then((data) => {
        if (!isMounted) return;
        setEvents(data);
        const initialRsvps: Record<string, boolean> = {};
        data.forEach((e) => {
          initialRsvps[e.id] = Boolean(e.is_rsvped);
        });
        setRsvps(initialRsvps);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching events:', err.message);
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getEvents();
      setEvents(data);
      const initialRsvps: Record<string, boolean> = {};
      data.forEach((e) => {
        initialRsvps[e.id] = Boolean(e.is_rsvped);
      });
      setRsvps(initialRsvps);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching events:', err.message);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCardPress = (event: EventRow) => {
    router.push(`/events/${event.id}` as any);
  };

  const handleCheckInPress = (event: EventRow) => {
    router.push(`/events/${event.id}` as any);
  };

  const handleRsvpPress = async (event: EventRow) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to RSVP for events.');
      return;
    }

    const currentStatus = Boolean(rsvps[event.id]);
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setRsvps((prev) => ({ ...prev, [event.id]: nextStatus }));

    try {
      const newStatus = await toggleEventRsvp(event.id);
      setRsvps((prev) => ({ ...prev, [event.id]: newStatus }));
    } catch (err: any) {
      // Revert on error
      setRsvps((prev) => ({ ...prev, [event.id]: currentStatus }));
      Alert.alert('RSVP Error', err.message || 'Could not update RSVP status.');
    }
  };

  // Find all currently active events within their effective check-in window
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

  // Filter events based on timeFilter and typeFilter
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => {
      // Type filter
      if (typeFilter !== 'all' && event.type !== typeFilter) {
        return false;
      }

      // Time filter
      const eventEnd = new Date(event.ends_at);
      if (timeFilter === 'upcoming') {
        return eventEnd >= now;
      }
      if (timeFilter === 'past') {
        return eventEnd < now;
      }
      return true;
    });
  }, [events, timeFilter, typeFilter]);

  // Group filtered events by month & year
  const monthGroups = useMemo<MonthGroup[]>(() => {
    const groups: Record<string, MonthGroup> = {};

    filteredEvents.forEach((event) => {
      const date = new Date(event.starts_at);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = {
          key,
          title: date.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          }),
          events: [],
        };
      }
      groups[key].events.push(event);
    });

    return Object.values(groups);
  }, [filteredEvents]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.content.saseBlue.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text variant="body" color={colors.content.onDanger.primary}>
          Failed to load events: {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.content.saseBlue.primary}
          />
        }
      >
        {/* Events Display Header */}
        <View style={styles.header}>
          <Text variant="display">Events</Text>
        </View>

        {/* Happening Now Banner(s) */}
        {activeEvents.map((event) => (
          <HappeningNowCard
            key={event.id}
            event={event}
            onCheckInPress={handleCheckInPress}
            onPress={handleCardPress}
          />
        ))}

        {/* Filter Chips */}
        <EventFilters
          timeFilter={timeFilter}
          typeFilter={typeFilter}
          onTimeFilterChange={setTimeFilter}
          onTypeFilterChange={setTypeFilter}
        />

        {/* Month Sections */}
        {monthGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="body" color={colors.content.onBase.secondary}>
              No events found.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {monthGroups.map((group) => (
              <View key={group.key} style={styles.monthSection}>
                {/* Month Heading */}
                <View style={styles.monthHeader}>
                  <Text variant="bodyStrong">{group.title}</Text>
                  <Text variant="body" color={colors.content.onBase.secondary}>
                    {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                  </Text>
                </View>

                {/* Cards Container with space[400] gap */}
                <View style={styles.cardsContainer}>
                  {group.events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isRsvped={rsvps[event.id] ?? event.is_rsvped}
                      hasAttended={event.has_attended}
                      onPress={handleCardPress}
                      onRsvpPress={handleRsvpPress}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
    },
    scrollContent: {
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['1000'],
      gap: space['400'],
    },
    header: {
      marginBottom: space['100'],
    },
    listContainer: {
      gap: space['400'],
    },
    monthSection: {
      gap: space['400'],
    },
    monthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardsContainer: {
      gap: space['400'],
    },
    emptyContainer: {
      paddingVertical: space['800'],
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
