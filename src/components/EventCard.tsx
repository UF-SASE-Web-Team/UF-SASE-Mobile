import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';
import { EventTag } from '@/components/EventTag';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, space, borderWidth } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

export interface EventCardProps {
  event: EventRow | EventWithRsvp;
  isRsvped?: boolean;
  hasAttended?: boolean;
  onPress?: (event: EventRow) => void;
  onRsvpPress?: (event: EventRow) => void;
}

export function EventCard({
  event,
  isRsvped = false,
  hasAttended,
  onPress,
  onRsvpPress,
}: EventCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const attended =
    hasAttended ??
    (event as EventWithRsvp).has_attended ??
    Boolean((event as any).check_ins && (event as any).check_ins.length > 0);

  const now = new Date();
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const isValidStartDate = !Number.isNaN(startDate.getTime());
  const isValidEndDate = !Number.isNaN(endDate.getTime());

  const isEnded = isValidEndDate ? now > endDate : false;
  const isStarted = isValidStartDate ? now >= startDate : false;

  const month = isValidStartDate ? startDate.toLocaleDateString(undefined, { month: 'short' }) : '';
  const day = isValidStartDate ? startDate.getDate() : '';
  const time = isValidStartDate
    ? startDate.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const timeAndLocation = [time, event.location_name].filter(Boolean).join(' • ');

  const handleCardPress = () => {
    onPress?.(event);
  };

  const handleRsvpPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onRsvpPress?.(event);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, on ${month} ${day}`}
    >
      {/* Date Column */}
      <View style={styles.dateColumn}>
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {month}
        </Text>
        <Text variant="title" color={colors.content.onBase.secondary}>
          {day}
        </Text>
      </View>

      {/* Main Info */}
      <View style={styles.infoColumn}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.detailsRow}>
          {event.type && event.type !== 'other' && <EventTag type={event.type} />}
          {Boolean(timeAndLocation) && (
            <Text
              variant="bodySm"
              color={colors.content.onBase.primary}
              style={styles.detailsText}
              numberOfLines={1}
            >
              {timeAndLocation}
            </Text>
          )}
        </View>
      </View>

      {/* RSVP / Points Action */}
      {isEnded ? (
        attended ? (
          <View style={styles.rsvpButton} accessibilityLabel={`+${event.points_value} points`}>
            <Text variant="bodyStrong" color={colors.content.onBase.primary} numberOfLines={1}>
              +{event.points_value}
            </Text>
          </View>
        ) : null
      ) : isStarted || !event.rsvp ? null : (
        <Pressable
          style={({ pressed }) => [
            styles.rsvpButton,
            !isRsvped && styles.rsvpButtonIdle,
            isRsvped && styles.rsvpButtonActive,
            pressed && styles.rsvpButtonPressed,
          ]}
          onPress={handleRsvpPress}
          accessibilityRole="button"
          accessibilityLabel={isRsvped ? 'Cancel RSVP' : 'RSVP to event'}
        >
          <Text
            variant="bodyStrong"
            color={
              isRsvped ? colors.content.onBase.primary : colors.content.onSaseBlueSubtle.primary
            }
            numberOfLines={1}
          >
            {isRsvped ? 'Going' : 'RSVP'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      paddingVertical: space['200'],
      paddingHorizontal: space['250'],
    },
    cardPressed: {
      opacity: 0.8,
    },
    dateColumn: {
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: space['300'],
    },
    infoColumn: {
      flex: 1,
      justifyContent: 'center',
      marginRight: space['300'],
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: space['100'],
      gap: space['150'],
    },
    detailsText: {
      flex: 1,
    },
    rsvpButton: {
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.primary,
      paddingHorizontal: space['150'],
      paddingVertical: space['150'],
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 65,
    },
    rsvpButtonIdle: {
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderColor: colors.surface.saseBlueSubtle.primary,
    },
    rsvpButtonActive: {
      backgroundColor: colors.surface.success.primary,
      borderColor: colors.surface.success.primary,
    },
    rsvpButtonPressed: {
      opacity: 0.75,
    },
  });
