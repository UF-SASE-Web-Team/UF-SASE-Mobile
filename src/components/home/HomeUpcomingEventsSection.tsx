import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HomeEventCard } from '@/components/events/HomeEventCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { space, type Colors } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

interface HomeUpcomingEventsSectionProps {
  events: EventWithRsvp[];
  loading: boolean;
  error: string | null;
  onCardPress: (event: EventRow) => void;
}

export function HomeUpcomingEventsSection({
  events,
  loading,
  error,
  onCardPress,
}: HomeUpcomingEventsSectionProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Upcoming Events"
        onSeeAll={() => router.push('/events')}
        seeAllLabel="See all events"
      />
      {events.length > 0 ? (
        <FlatList
          data={events}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          style={styles.horizontalListOuter}
          contentContainerStyle={styles.eventsList}
          renderItem={({ item }) => <HomeEventCard event={item} onPress={onCardPress} />}
        />
      ) : loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator
            color={colors.surface.saseBlue.primary}
            accessibilityLabel="Loading events"
          />
        </View>
      ) : (
        <EmptyState
          icon={error ? 'cloud-offline-outline' : 'calendar-outline'}
          tone={error ? 'orange' : 'blue'}
          message={
            error
              ? "Couldn't load events. Pull down to refresh."
              : 'No upcoming events right now. Check back soon!'
          }
          style={styles.emptyState}
        />
      )}
    </View>
  );
}

const createStyles = (_colors: Colors) =>
  StyleSheet.create({
    section: {
      gap: space['200'],
    },
    horizontalListOuter: {
      marginHorizontal: -space['400'],
    },
    eventsList: {
      paddingHorizontal: space['400'],
      gap: space['300'],
    },
    emptyState: {
      paddingVertical: space['600'],
    },
  });
