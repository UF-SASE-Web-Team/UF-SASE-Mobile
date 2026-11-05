import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, space } from '@/theme';
import { EventType } from '@/types/events';

export const TAG_LABELS: Record<Exclude<EventType, 'other'>, string> = {
  gbm: 'GBM',
  career: 'Career',
  social: 'Social',
  team: 'Team',
};

export interface TagColorTokens {
  background: string;
  text: string;
}

export const getTagColor = (type: EventType, colors: Colors): TagColorTokens | null => {
  switch (type) {
    case 'gbm':
      return {
        background: colors.surface.accentSubtle.tertiary,
        text: colors.content.onAccentSubtle.tertiary,
      };
    case 'career':
      return {
        background: colors.surface.accentSubtle.primary,
        text: colors.content.onAccentSubtle.primary,
      };
    case 'social':
      return {
        background: colors.surface.accentSubtle.quaternary,
        text: colors.content.onAccentSubtle.quaternary,
      };
    case 'team':
      return {
        background: colors.surface.accentSubtle.secondary,
        text: colors.content.onAccentSubtle.secondary,
      };
    case 'other':
    default:
      return null;
  }
};

export interface EventTagProps {
  type: EventType;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EventTag({ type, style, testID }: EventTagProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (!type || type === 'other') return null;

  const tagColors = getTagColor(type, colors);
  if (!tagColors) return null;

  const label = TAG_LABELS[type] ?? String(type).toUpperCase();

  return (
    <View
      testID={testID ?? `event-tag-${type}`}
      style={[styles.tag, { backgroundColor: tagColors.background }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Category: ${label}`}
    >
      <Text variant="bodySmStrong" style={{ color: tagColors.text }}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    tag: {
      borderRadius: radius.full,
      paddingHorizontal: space['250'],
      paddingVertical: space['050'],
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
  });
