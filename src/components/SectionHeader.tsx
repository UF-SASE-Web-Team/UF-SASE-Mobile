import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import { useTheme } from '@/context/ThemeContext';
import { iconSize, space } from '@/theme';

export interface SectionHeaderProps {
  title: string;
  /** When provided, shows a "See all" button on the right. */
  onSeeAll?: () => void;
  /** Accessibility label for the "See all" button, e.g. "See all events". */
  seeAllLabel?: string;
}

export function SectionHeader({ title, onSeeAll, seeAllLabel }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text variant="title" accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={seeAllLabel ?? `See all ${title}`}
          hitSlop={space['200']}
          style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
        >
          <Text variant="bodySmStrong" color={colors.content.onBase.secondary}>
            See all
          </Text>
          <Ionicons
            name="chevron-forward"
            size={iconSize.sm}
            color={colors.content.onBase.secondary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space['300'],
    marginBottom: space['200'],
  },
  title: {
    flex: 1,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space['050'],
  },
  pressed: {
    opacity: 0.7,
  },
});
