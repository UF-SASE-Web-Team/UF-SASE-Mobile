import React from 'react';
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet } from 'react-native';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, radius, space } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  ...props
}: ButtonProps) {
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;

  const resolvedAccessibilityLabel =
    accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

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
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={styles[`${variant}Text`].color} />}
      {typeof children === 'string' ? (
        <Text variant="bodyStrong" color={styles[`${variant}Text`].color}>
          {children}{' '}
        </Text>
      ) : (
        children
      )}
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
      borderRadius: radius.full,
      paddingVertical: space['400'],
      paddingHorizontal: space['600'],
      gap: space['200'],
    },
    primary: {
      backgroundColor: colors.surface.saseBlue.primary,
    },
    secondary: {
      backgroundColor: colors.surface.saseBlue.secondary,
    },
    primaryText: {
      color: colors.content.onSaseBlue.primary,
    },
    secondaryText: {
      color: colors.content.onSaseBlue.secondary,
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.6,
    },
  });
