import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Pill, PillVariant } from '@/components/ui/Pill';

export interface CheckedInBadgeProps {
  variant?: PillVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function CheckedInBadge({
  variant = 'subtle',
  style,
  testID = 'checked-in-badge',
}: CheckedInBadgeProps) {
  return (
    <Pill
      label="Checked in"
      icon="checkmark"
      tone="green"
      variant={variant}
      style={style}
      testID={testID}
      accessibilityLabel="Checked in"
    />
  );
}
