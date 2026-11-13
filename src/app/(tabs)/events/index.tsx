import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { EventCard } from '@/components/EventCard';
import { EventCheckInModal } from '@/components/EventCheckInModal';
import { EventFilters, TimeFilter, TypeFilter } from '@/components/EventFilters';
import { HappeningNowCard } from '@/components/HappeningNowCard';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space } from '@/theme';
import { openExternalLink } from '@/lib/links';
import { EventRow, EventWithRsvp } from '@/types/events';

interface EventSection {
  key: string;
  title: string;
  data: EventWithRsvp[];
}

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.surface.saseBlue.primary} />
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
      <SectionList<EventWithRsvp, EventSection>
        sections={monthSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isRsvped={item.is_rsvped}
            hasAttended={item.has_attended}
            onPress={handleCardPress}
            onRsvpPress={handleRsvpPress}
          />
        )}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.monthHeader}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="body" color={colors.content.onBase.secondary}>
              {data.length} {data.length === 1 ? 'event' : 'events'}
            </Text>
          </View>
        )}
        renderSectionFooter={() => <View style={styles.sectionFooter} />}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Events Display Header */}
            <View style={styles.header}>
              <Text variant="display">Events</Text>
            </View>

            {/* Happening Now Banner(s) */}
            {activeEvents.map((event) => (
              <HappeningNowCard
                key={event.id}
                event={event}
                hasCheckedIn={event.has_attended}
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
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            message="No events found."
            actionLabel={isFiltered ? 'Clear filters' : undefined}
            onAction={
              isFiltered
                ? () => {
                    setTimeFilter('upcoming');
                    setTypeFilter('all');
                  }
                : undefined
            }
          />
        }
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEvents}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
        stickySectionHeadersEnabled={false}
      />

      {selectedCheckInEvent && (
        <EventCheckInModal
          visible={Boolean(selectedCheckInEvent)}
          onClose={() => setSelectedCheckInEvent(null)}
          eventId={selectedCheckInEvent.id}
          eventTitle={selectedCheckInEvent.title}
          pointsValue={selectedCheckInEvent.points_value}
          onSuccess={() => {
            const eventId = selectedCheckInEvent.id;
            markEventAttended(eventId);
            setSelectedCheckInEvent(null);
            refreshEvents();
          }}
        />
      )}
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
    },
    listHeader: {
      gap: space['400'],
      marginBottom: space['400'],
    },
    header: {
      marginBottom: space['100'],
    },
    monthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: space['400'],
    },
    itemSeparator: {
      height: space['400'],
    },
    sectionFooter: {
      height: space['400'],
    },
  });
