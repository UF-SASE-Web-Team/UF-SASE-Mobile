import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EventCard } from '@/components/events/EventCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { space } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

interface HomeNextEventSectionProps {
  event: EventWithRsvp | null;
  onPress: (event: EventRow) => void;
  onRsvpPress: (event: EventRow) => void;
}

export function HomeNextEventSection({ event, onPress, onRsvpPress }: HomeNextEventSectionProps) {
  if (!event) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Your Next Event" />
      <EventCard event={event} isRsvped onPress={onPress} onRsvpPress={onRsvpPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space['200'],
  },
});
