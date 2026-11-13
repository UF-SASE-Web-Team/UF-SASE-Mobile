import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/Button';
import { AccentIcon, type AccentTone } from '@/components/AccentIcon';
import { Text } from '@/components/Text';
import { useTheme } from '@/context/ThemeContext';
import { space } from '@/theme';

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  tone?: AccentTone;
  title?: string;
  message: string;
  /** Shown as a button only when both `actionLabel` and `onAction` are set. */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  icon,
  tone = 'blue',
  title,
  message,
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <AccentIcon icon={icon} tone={tone} size="lg" />
      <View style={styles.copy}>
        {title ? (
          <Text variant="bodyStrong" style={styles.centered}>
            {title}
          </Text>
        ) : null}
        <Text variant="body" color={colors.content.onBase.secondary} style={styles.centered}>
          {message}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Button onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space['800'],
    paddingHorizontal: space['400'],
    gap: space['300'],
  },
  copy: {
    gap: space['100'],
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    paddingVertical: space['250'],
    paddingHorizontal: space['500'],
  },
});
