import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, iconSize, space } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

export interface HappeningNowCardProps {
  event: EventRow | EventWithRsvp;
  hasCheckedIn?: boolean;
  onCheckInPress?: (event: EventRow) => void;
  onPress?: (event: EventRow) => void;
}

export function HappeningNowCard({
  event,
  hasCheckedIn,
  onCheckInPress,
  onPress,
}: HappeningNowCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const isCheckedIn = hasCheckedIn ?? (event as EventWithRsvp).has_attended ?? false;

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        });
  };

  const startTime = formatTime(event.starts_at);
  const endTime = formatTime(event.ends_at);
  const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;

  const checkinDate = event.checkin_opens_at ? new Date(event.checkin_opens_at) : null;
  const startDate = event.starts_at ? new Date(event.starts_at) : null;

  const hasEarlyDoors = Boolean(
    checkinDate &&
    startDate &&
    !Number.isNaN(checkinDate.getTime()) &&
    !Number.isNaN(startDate.getTime()) &&
    checkinDate.getTime() < startDate.getTime(),
  );

  const timeText = hasEarlyDoors ? `Doors open ${formatTime(event.checkin_opens_at)}` : timeRange;

  const subtitle = [timeText, event.location_name].filter(Boolean).join(' • ');

  const handlePress = () => {
    onPress?.(event);
  };

  const handleCheckInPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onCheckInPress?.(event);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Happening now: ${event.title}`}
    >
      <LinearGradient
        colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.headerRow}>
          <Text variant="bodySmStrong" color={colors.content.onMedia.primary}>
            Happening Now
          </Text>
        </View>

        <Text
          variant="title"
          color={colors.content.onMedia.primary}
          numberOfLines={1}
          style={styles.title}
        >
          {event.title}
        </Text>

        {Boolean(subtitle) && (
          <Text
            variant="bodySm"
            color="rgba(255, 255, 255, 0.85)"
            numberOfLines={1}
            style={styles.subtitle}
          >
            {subtitle}
          </Text>
        )}

        {isCheckedIn ? (
          <View
            style={styles.checkedInContainer}
            accessibilityLabel="Checked in"
            testID="happening-now-checked-in-badge"
          >
            <Ionicons
              name="checkmark-circle"
              size={iconSize.md}
              color={colors.content.onMedia.primary}
            />
            <Text variant="bodyStrong" color={colors.content.onMedia.primary}>
              Checked in
            </Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.checkInButton, pressed && styles.checkInButtonPressed]}
            onPress={handleCheckInPress}
            accessibilityRole="button"
            accessibilityLabel="Check-in"
          >
            <Ionicons
              name="barcode-outline"
              size={iconSize.md}
              color={colors.content.onMedia.primary}
            />
            <Text variant="bodyStrong" color={colors.content.onMedia.primary}>
              Check-in
            </Text>
          </Pressable>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const createStyles = (colors: Colors) => {
  return StyleSheet.create({
    wrapper: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    wrapperPressed: {
      opacity: 0.95,
    },
    container: {
      borderRadius: radius.md,
      paddingHorizontal: space['400'],
      paddingVertical: space['300'],
    },
    headerRow: {
      marginBottom: space['100'],
    },
    title: {
      marginBottom: space['100'],
    },
    subtitle: {
      marginBottom: space['400'],
    },
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.media.scrim,
      borderRadius: radius.md,
      paddingVertical: space['300'],
      gap: space['200'],
    },
    checkInButtonPressed: {
      opacity: 0.85,
    },
    checkedInContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.media.scrim,
      borderRadius: radius.md,
      paddingVertical: space['300'],
      gap: space['200'],
    },
  });
};
