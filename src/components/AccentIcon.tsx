import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/context/ThemeContext';
import { type Colors, iconSize } from '@/theme';

export type AccentTone = 'blue' | 'orange' | 'green' | 'yellow' | 'pink';

export interface AccentIconProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: AccentTone;
  size?: keyof typeof iconSize;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const getToneColor = (tone: AccentTone, colors: Colors) => {
  switch (tone) {
    case 'orange':
      return colors.content.accent.primary;
    case 'green':
      return colors.content.accent.secondary;
    case 'yellow':
      return colors.content.accent.tertiary;
    case 'pink':
      return colors.content.accent.quaternary;
    case 'blue':
    default:
      return colors.content.onBase.brand;
  }
};

/**
 * Decorative icon in a brand accent color. The one place accents appear at
 * full strength, so use it sparingly: section headers and empty states.
 */
export function AccentIcon({ icon, tone = 'blue', size = 'md', style, testID }: AccentIconProps) {
  const { colors } = useTheme();

  return (
    <Ionicons
      testID={testID}
      name={icon}
      size={iconSize[size]}
      color={getToneColor(tone, colors)}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
