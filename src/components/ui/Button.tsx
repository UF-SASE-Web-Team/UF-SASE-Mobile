import React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, radius, space } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends PressableProps {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  ...props
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;

  const content = children ?? title;
  const resolvedAccessibilityLabel =
    accessibilityLabel ?? (typeof content === 'string' ? content : undefined);

  const textColor = styles[`${variant}Text`].color;
  const textVariant = size === 'sm' ? 'bodySmStrong' : 'bodyStrong';

  const sizeStyle = size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={resolvedAccessibilityLabel}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
        ...accessibilityState,
      }}
      style={(state) => [
        styles.base,
        styles[variant],
        sizeStyle,
        state.pressed &&
          !isDisabled &&
          (variant === 'ghost' ? styles.pressedGhost : styles.pressed),
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator size="small" color={textColor} /> : (leftIcon ?? null)}
      {typeof content === 'string' ? (
        <Text variant={textVariant} color={textColor}>
          {content}
        </Text>
      ) : (
        content
      )}
      {!loading && rightIcon ? rightIcon : null}
    </Pressable>
  );
}

export default Button;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['200'],
    },
    sizeSm: {
      paddingVertical: space['200'],
      paddingHorizontal: space['400'],
      borderRadius: radius.md,
    },
    sizeMd: {
      paddingVertical: space['300'],
      paddingHorizontal: space['600'],
      borderRadius: radius.md,
    },
    sizeLg: {
      paddingVertical: space['400'],
      paddingHorizontal: space['600'],
      borderRadius: radius.full,
    },
    primary: {
      backgroundColor: colors.surface.saseBlue.primary,
    },
    secondary: {
      backgroundColor: colors.surface.saseBlue.secondary,
    },
    danger: {
      backgroundColor: colors.surface.danger.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      alignSelf: 'center',
    },
    outline: {
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    primaryText: {
      color: colors.content.onSaseBlue.primary,
    },
    secondaryText: {
      color: colors.content.onSaseBlue.secondary,
    },
    dangerText: {
      color: colors.content.onDanger.primary,
    },
    ghostText: {
      color: colors.content.onBase.secondary,
    },
    outlineText: {
      color: colors.content.onBase.primary,
    },
    pressed: {
      opacity: 0.85,
    },
    pressedGhost: {
      opacity: 0.7,
    },
    disabled: {
      opacity: 0.6,
    },
  });
