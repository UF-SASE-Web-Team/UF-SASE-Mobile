import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AccentIcon, type AccentTone } from '@/components/ui/AccentIcon';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, space } from '@/theme';
import { EventType } from '@/types/events';

type TaggedEventType = Exclude<EventType, 'other'>;

export const TAG_LABELS: Record<TaggedEventType, string> = {
  gbm: 'GBM',
  career: 'Pro Dev',
  social: 'Social',
  service: 'Service',
  sports: 'Sports',
  team: 'Team',
};

export const TAG_ICONS: Record<TaggedEventType, keyof typeof Ionicons.glyphMap> = {
  gbm: 'megaphone-outline',
  career: 'briefcase-outline',
  social: 'balloon-outline',
  service: 'heart-outline',
  sports: 'basketball-outline',
  team: 'people-outline',
};

export const TAG_TONES: Record<TaggedEventType, AccentTone> = {
  gbm: 'yellow',
  career: 'orange',
  social: 'pink',
  service: 'green',
  sports: 'blue',
  team: 'green',
};

export interface EventTagProps {
  type: EventType;
  /**
   * `plain` sits inline on base surfaces; `onMedia` adds a scrim chip so the
   * tag stays readable over flyers and other imagery.
   */
  variant?: 'plain' | 'onMedia';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EventTag({ type, variant = 'plain', style, testID }: EventTagProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (!type || type === 'other') return null;

  const label = TAG_LABELS[type] ?? String(type).toUpperCase();
  const icon = TAG_ICONS[type];
  const onMedia = variant === 'onMedia';
  const contentColor = onMedia ? colors.content.onMedia.primary : colors.content.onBase.secondary;

  return (
    <View
      testID={testID ?? `event-tag-${type}`}
      style={[styles.tag, onMedia && styles.onMedia, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Category: ${label}`}
    >
      {icon ? <AccentIcon icon={icon} tone={TAG_TONES[type]} size="sm" /> : null}
      <Text variant="bodySmStrong" color={contentColor}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: space['100'],
    },
    onMedia: {
      backgroundColor: colors.surface.media.scrim,
      borderRadius: radius.full,
      paddingHorizontal: space['200'],
      paddingVertical: space['050'],
    },
  });
