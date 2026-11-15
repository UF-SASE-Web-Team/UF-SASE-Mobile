import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, iconSize, radius, space } from '@/theme';

export type PillTone = 'blue' | 'orange' | 'green' | 'yellow' | 'pink' | 'neutral';
export type PillVariant = 'plain' | 'subtle' | 'onMedia';

export interface PillProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: PillTone;
  variant?: PillVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const getPlainIconColor = (tone: PillTone, colors: Colors) => {
  switch (tone) {
    case 'orange':
      return colors.content.accent.primary;
    case 'green':
      return colors.content.accent.secondary;
    case 'yellow':
      return colors.content.accent.tertiary;
    case 'pink':
      return colors.content.accent.quaternary;
    case 'neutral':
      return colors.content.onBase.secondary;
    case 'blue':
    default:
      return colors.content.onBase.brand;
  }
};

const getSubtleColors = (tone: PillTone, colors: Colors) => {
  switch (tone) {
    case 'orange':
      return {
        bg: colors.surface.accentSubtle.primary,
        content: colors.content.onAccentSubtle.primary,
      };
    case 'green':
      return {
        bg: colors.surface.accentSubtle.secondary,
        content: colors.content.onAccentSubtle.secondary,
      };
    case 'yellow':
      return {
        bg: colors.surface.accentSubtle.tertiary,
        content: colors.content.onAccentSubtle.tertiary,
      };
    case 'pink':
      return {
        bg: colors.surface.accentSubtle.quaternary,
        content: colors.content.onAccentSubtle.quaternary,
      };
    case 'blue':
      return {
        bg: colors.surface.saseBlueSubtle.primary,
        content: colors.content.onSaseBlueSubtle.primary,
      };
    case 'neutral':
    default:
      return {
        bg: colors.surface.base.secondary,
        content: colors.content.onBase.secondary,
      };
  }
};

export function Pill({
  label,
  icon,
  tone = 'blue',
  variant = 'plain',
  style,
  testID,
  accessibilityLabel,
}: PillProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  let containerStyle: StyleProp<ViewStyle> = [styles.base];
  let textColor: string;
  let iconColor: string;

  if (variant === 'onMedia') {
    containerStyle.push(styles.enclosed, styles.onMedia);
    textColor = colors.content.onMedia.primary;
    iconColor = colors.content.onMedia.primary;
  } else if (variant === 'subtle') {
    const subtle = getSubtleColors(tone, colors);
    containerStyle.push(styles.enclosed, { backgroundColor: subtle.bg });
    textColor = subtle.content;
    iconColor = subtle.content;
  } else {
    textColor = colors.content.onBase.secondary;
    iconColor = getPlainIconColor(tone, colors);
  }

  return (
    <View
      testID={testID}
      style={[containerStyle, style]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={iconSize.sm}
          color={iconColor}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
      <Text variant="bodySmStrong" color={textColor}>
        {label}
      </Text>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
    },
    enclosed: {
      borderRadius: radius.full,
      paddingHorizontal: space['200'],
      paddingVertical: space['050'],
    },
    onMedia: {
      backgroundColor: colors.surface.media.scrim,
    },
  });
