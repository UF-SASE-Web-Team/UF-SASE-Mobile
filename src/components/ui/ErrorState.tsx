import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AccentIcon, type AccentTone } from '@/components/ui/AccentIcon';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { type Colors, space } from '@/theme';

export interface ErrorStateProps {
  /** The raw error (Error instance, string, or unknown object). Sanitized via getFriendlyErrorMessage. */
  error?: unknown;
  /** Section or alert title. Defaults to "Something went wrong". */
  title?: string;
  /** Custom message or fallback if error is not set. */
  message?: string;
  /** Accent icon to display above title. Defaults to 'cloud-offline-outline'. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Accent tone for the icon. Defaults to 'orange'. */
  tone?: AccentTone;
  /** Callback invoked when the user presses "Try again". */
  onRetry?: () => void;
  /** Indicates whether a retry is currently in progress (displays spinner inside the retry button). */
  isRetrying?: boolean;
  /** Label for the retry button. Defaults to "Try again". */
  actionLabel?: string;
  /** Whether the error state is wrapped in a safe ScrollView. Defaults to true. */
  scrollable?: boolean;
  /** Optional extra actions or elements (e.g. BackButton) placed under the retry button. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ErrorState({
  error,
  title = 'Something went wrong',
  message,
  icon = 'cloud-offline-outline',
  tone = 'orange',
  onRetry,
  isRetrying = false,
  actionLabel = 'Try again',
  scrollable = true,
  children,
  style,
  testID = 'error-state',
}: ErrorStateProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const displayMessage = getFriendlyErrorMessage(
    error,
    message ?? 'We encountered an error loading this information. Please try again.',
  );

  const content = (
    <View style={[styles.innerContent, !scrollable && style]} testID={testID}>
      <AccentIcon icon={icon} tone={tone} size="lg" />
      <View style={styles.copy}>
        <Text variant="title" style={styles.centered}>
          {title}
        </Text>
        <Text
          variant="body"
          color={colors.content.onBase.secondary}
          style={styles.centered}
          accessibilityRole="alert"
        >
          {displayMessage}
        </Text>
      </View>
      {onRetry ? (
        <Button
          size="md"
          onPress={onRetry}
          loading={isRetrying}
          style={styles.actionButton}
          testID="error-retry-button"
        >
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, style]}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
      paddingVertical: space['800'],
      paddingHorizontal: space['600'],
    },
    innerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['400'],
      maxWidth: 360,
      width: '100%',
    },
    copy: {
      alignItems: 'center',
      gap: space['150'],
    },
    centered: {
      textAlign: 'center',
    },
    actionButton: {
      marginTop: space['200'],
      minWidth: 160,
    },
  });
