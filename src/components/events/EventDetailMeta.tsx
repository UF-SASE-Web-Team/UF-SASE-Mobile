import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { openMapLocation } from '@/lib/links';
import { iconSize, space, type Colors } from '@/theme';

export interface EventDetailMetaProps {
  formattedDate: string;
  formattedTimeWithDoors: string;
  locationName?: string | null;
  address?: string | null;
  onLocationPress?: () => void;
}

export function EventDetailMeta({
  formattedDate,
  formattedTimeWithDoors,
  locationName,
  address,
  onLocationPress,
}: EventDetailMetaProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const displayLocation = locationName?.trim() || address?.trim();
  const hasAddress = Boolean(address?.trim());

  const handlePressLocation = () => {
    if (onLocationPress) {
      onLocationPress();
      return;
    }
    if (address) {
      void openMapLocation(address);
    }
  };

  return (
    <View style={styles.infoList}>
      {Boolean(formattedDate) && (
        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={iconSize.md}
            color={colors.content.onBase.secondary}
          />
          <Text variant="body" color={colors.content.onBase.primary}>
            {formattedDate}
          </Text>
        </View>
      )}

      {Boolean(formattedTimeWithDoors) && (
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={iconSize.md}
            color={colors.content.onBase.secondary}
          />
          <Text variant="body" color={colors.content.onBase.primary}>
            {formattedTimeWithDoors}
          </Text>
        </View>
      )}

      {Boolean(displayLocation) &&
        (hasAddress ? (
          <Pressable
            testID="event-detail-location-pressable"
            style={({ pressed }) => [styles.metaRow, pressed && styles.metaRowPressed]}
            onPress={handlePressLocation}
            accessibilityRole="link"
            accessibilityLabel={`Location: ${displayLocation}`}
            accessibilityHint="Opens in maps"
            hitSlop={8}
          >
            <Ionicons
              name="location-outline"
              size={iconSize.md}
              color={colors.content.onBase.secondary}
            />
            <Text variant="body" color={colors.content.onBase.primary} style={styles.locationText}>
              {displayLocation}
            </Text>
            <Ionicons
              name="open-outline"
              size={iconSize.sm}
              color={colors.content.onBase.secondary}
            />
          </Pressable>
        ) : (
          <View style={styles.metaRow} testID="event-detail-location-static">
            <Ionicons
              name="location-outline"
              size={iconSize.md}
              color={colors.content.onBase.secondary}
            />
            <Text variant="body" color={colors.content.onBase.primary} style={styles.locationText}>
              {displayLocation}
            </Text>
          </View>
        ))}
    </View>
  );
}

const createStyles = (_colors: Colors) =>
  StyleSheet.create({
    infoList: {
      gap: space['200'],
      marginTop: space['100'],
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    metaRowPressed: {
      opacity: 0.7,
    },
    locationText: {
      flexShrink: 1,
    },
  });
