import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { EventTag } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, iconSize, radius, space, type Colors } from '@/theme';
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

  return (
    <>
      <View style={styles.headerRow}>
        <Text variant="title" style={styles.title} numberOfLines={3}>
          {title}
        </Text>

        {hasCheckedIn ? (
          <View style={styles.checkedInBadge} accessibilityLabel="Checked in">
            <Ionicons
              name="checkmark"
              size={iconSize.md}
              color={colors.content.onSuccess.primary}
            />
            <Text variant="bodySmStrong" color={colors.content.onSuccess.primary}>
              Checked in
            </Text>
          </View>
        ) : isCheckinStarted || !rsvpEnabled ? null : (
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

      {type && type !== 'other' && (
        <View style={styles.tagRow}>
          <EventTag type={type} />
        </View>
      )}
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: space['400'],
      marginBottom: space['300'],
    },
    title: {
      flex: 1,
    },
    rsvpButton: {
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.secondary,
      paddingHorizontal: space['150'],
      paddingVertical: space['150'],
      alignItems: 'center',
      justifyContent: 'center',
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
    checkedInBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
      backgroundColor: colors.surface.success.primary,
      borderRadius: radius.md,
      paddingHorizontal: space['250'],
      paddingVertical: space['150'],
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
