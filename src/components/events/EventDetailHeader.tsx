import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CheckedInBadge } from '@/components/events/CheckedInBadge';
import { EventTag } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, radius, space, type Colors } from '@/theme';
import { EventType } from '@/types/events';

interface EventDetailHeaderProps {
  title: string;
  type?: EventType | null;
  rsvpEnabled: boolean;
  isRsvped: boolean;
  hasCheckedIn: boolean;
  isCheckinStarted: boolean;
  onRsvpPress: () => void;
}

export function EventDetailHeader({
  title,
  type,
  rsvpEnabled,
  isRsvped,
  hasCheckedIn,
  isCheckinStarted,
  onRsvpPress,
}: EventDetailHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const hasTag = Boolean(type && type !== 'other');
  const hasPills = hasTag || hasCheckedIn;

  return (
    <>
      <View style={styles.headerRow}>
        <Text variant="title" style={styles.title} numberOfLines={3}>
          {title}
        </Text>

        {!hasCheckedIn && !isCheckinStarted && rsvpEnabled && (
          <Pressable
            style={({ pressed }) => [
              styles.rsvpButton,
              !isRsvped && styles.rsvpButtonIdle,
              isRsvped && styles.rsvpButtonActive,
              pressed && styles.rsvpButtonPressed,
            ]}
            onPress={onRsvpPress}
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
      </View>

      {hasPills && (
        <View style={styles.tagRow}>
          {hasTag && <EventTag type={type!} variant="subtle" />}
          {hasCheckedIn && <CheckedInBadge variant="subtle" />}
        </View>
      )}
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space['200'],
    },
    title: {
      flex: 1,
    },
    rsvpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['100'],
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.secondary,
      paddingHorizontal: space['150'],
      paddingVertical: space['150'],
      minWidth: 72,
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
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: space['200'],
    },
  });
