import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HappeningNowCard } from '@/components/events/HappeningNowCard';
import { space } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

interface HomeHappeningNowSectionProps {
  events: EventWithRsvp[];
  onCheckInPress: (event: EventRow) => void;
  onCardPress: (event: EventRow) => void;
}

export function HomeHappeningNowSection({
  events,
  onCheckInPress,
  onCardPress,
}: HomeHappeningNowSectionProps) {
  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      {events.map((event) => (
        <HappeningNowCard
          key={event.id}
          event={event}
          hasCheckedIn={event.has_attended}
          onCheckInPress={onCheckInPress}
          onPress={onCardPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space['300'],
  },
});
