import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pill, PillTone, PillVariant } from '@/components/ui/Pill';
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

export const TAG_TONES: Record<TaggedEventType, PillTone> = {
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
   * `plain` sits inline on base surfaces; `subtle` adds a soft tinted chip;
   * `onMedia` adds a scrim chip so the tag stays readable over flyers and other imagery.
   */
  variant?: PillVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EventTag({ type, variant = 'plain', style, testID }: EventTagProps) {
  if (!type || type === 'other') return null;

  const label = TAG_LABELS[type] ?? String(type).toUpperCase();
  const icon = TAG_ICONS[type];
  const tone = TAG_TONES[type];

  return (
    <Pill
      label={label}
      icon={icon}
      tone={tone}
      variant={variant}
      style={style}
      testID={testID ?? `event-tag-${type}`}
      accessibilityLabel={`Category: ${label}`}
    />
  );
}
