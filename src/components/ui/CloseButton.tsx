import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, iconSize, radius, type Colors } from '@/theme';

export interface CloseButtonProps {
  /**
   * Visual variant:
   * - 'default': circular secondary pill with subtle border
   * - 'onMedia': circular scrim pill without border for overlays on imagery
   */
  variant?: 'default' | 'onMedia';
  /**
   * Custom press handler.
   */
  onPress?: () => void;
  /**
   * Alias for onPress, commonly used for modal/sheet close handlers.
   */
  onClose?: () => void;
  /**
   * Whether the button is disabled (e.g. while submitting or busy).
   */
  disabled?: boolean;
  /**
   * Accessibility label for screen readers. Defaults to 'Close'.
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

export function CloseButton({
  variant = 'default',
  onPress,
  onClose,
  disabled = false,
  accessibilityLabel = 'Close',
  style,
  testID,
}: CloseButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    if (disabled) return;
    onPress?.();
    onClose?.();
  };

  const isOnMedia = variant === 'onMedia';
  const iconColor = isOnMedia ? colors.content.onMedia.primary : colors.content.onBase.primary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.base,
        isOnMedia ? styles.onMedia : styles.default,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name="close" size={iconSize.md} color={iconColor} />
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
    disabled: {
      opacity: 0.5,
    },
  });
