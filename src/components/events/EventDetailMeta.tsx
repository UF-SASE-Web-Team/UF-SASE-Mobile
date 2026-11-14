import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { iconSize, space, type Colors } from '@/theme';

interface EventDetailMetaProps {
  formattedDate: string;
  formattedTimeWithDoors: string;
  locationName?: string | null;
}

export function EventDetailMeta({
  formattedDate,
  formattedTimeWithDoors,
  locationName,
}: EventDetailMetaProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

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

      {Boolean(locationName) && (
        <View style={styles.metaRow}>
          <Ionicons
            name="location-outline"
            size={iconSize.md}
            color={colors.content.onBase.secondary}
          />
          <Text variant="body" color={colors.content.onBase.primary}>
            {locationName}
          </Text>
        </View>
      )}
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
  });
