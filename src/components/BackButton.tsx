import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, iconSize, radius, type Colors } from '@/theme';

export interface BackButtonProps {
  /**
   * Visual variant:
   * - 'default': circular secondary pill with subtle border
   * - 'onMedia': circular scrim pill without border for overlays on imagery
   */
  variant?: 'default' | 'onMedia';
  /**
   * Custom press handler. If omitted, performs safe navigation:
   * checks `router.canGoBack()` and falls back to `fallbackRoute` if provided.
   */
  onPress?: () => void;
  /**
   * Fallback route to replace with if `router.canGoBack()` is false.
   */
  fallbackRoute?: Href;
  /**
   * Accessibility label for screen readers. Defaults to 'Go back'.
   */
  accessibilityLabel?: string;
  /**
   * Optional custom style for layout or positioning.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Optional test ID for automated testing.
   */
  testID?: string;
}

export function BackButton({
  variant = 'default',
  onPress,
  fallbackRoute,
  accessibilityLabel = 'Go back',
  style,
  testID,
}: BackButtonProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (typeof router.canGoBack === 'function' ? router.canGoBack() : true) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute);
    } else {
      router.back();
    }
  };

  const isOnMedia = variant === 'onMedia';
  const iconColor = isOnMedia ? colors.content.onMedia.primary : colors.content.onBase.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.base,
        isOnMedia ? styles.onMedia : styles.default,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons name="chevron-back" size={iconSize.md} color={iconColor} />
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    base: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    default: {
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    onMedia: {
      backgroundColor: colors.surface.media.scrim,
      borderWidth: 0,
    },
    pressed: {
      opacity: 0.7,
    },
  });
