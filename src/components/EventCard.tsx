import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, space, borderWidth } from '@/theme';
import { EventRow, EventType, EventWithRsvp } from '@/types/events';

export interface EventCardProps {
  event: EventRow | EventWithRsvp;
  isRsvped?: boolean;
  hasAttended?: boolean;
  onPress?: (event: EventRow) => void;
  onRsvpPress?: (event: EventRow) => void;
}

const TAG_LABELS: Record<EventType, string> = {
  gbm: 'GBM',
  career: 'Career',
  social: 'Social',
  team: 'Team',
  other: 'Other',
};

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
          {event.type !== 'other' && (
            <View style={[styles.tag, styles[`tag_${event.type}`]]}>
              <Text variant="bodySmStrong" style={styles[`tagText_${event.type}`]}>
                {TAG_LABELS[event.type] ?? event.type.toUpperCase()}
              </Text>
            </View>
          )}
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
      ) : isStarted ? null : (
        <Pressable
          style={({ pressed }) => [
            styles.rsvpButton,
            isRsvped && styles.rsvpButtonActive,
            pressed && styles.rsvpButtonPressed,
          ]}
          onPress={handleRsvpPress}
          accessibilityRole="button"
          accessibilityLabel={isRsvped ? 'Cancel RSVP' : 'RSVP to event'}
        >
          <Text variant="bodyStrong" color={colors.content.onBase.primary} numberOfLines={1}>
            {isRsvped ? 'Going' : 'RSVP'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const createStyles = (colors: Colors) => {
  const tagColors: Record<EventType, string> = {
    gbm: colors.surface.saseBlue.primary,
    career: colors.surface.accent.primary,
    team: colors.surface.accent.secondary,
    other: colors.surface.accent.tertiary,
    social: colors.surface.accent.quaternary,
  };

  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      paddingVertical: space['150'],
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
    tag: {
      borderRadius: radius.full,
      paddingHorizontal: space['200'],
      paddingVertical: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tag_gbm: { backgroundColor: `${tagColors.gbm}66` },
    tag_career: { backgroundColor: `${tagColors.career}66` },
    tag_team: { backgroundColor: `${tagColors.team}66` },
    tag_other: { backgroundColor: `${tagColors.other}66` },
    tag_social: { backgroundColor: `${tagColors.social}66` },
    tagText_gbm: { color: tagColors.gbm },
    tagText_career: { color: tagColors.career },
    tagText_team: { color: tagColors.team },
    tagText_other: { color: tagColors.other },
    tagText_social: { color: tagColors.social },
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
    rsvpButtonActive: {
      backgroundColor: colors.surface.success.primary,
      borderColor: colors.surface.success.primary,
    },
    rsvpButtonPressed: {
      opacity: 0.75,
    },
  });
};
