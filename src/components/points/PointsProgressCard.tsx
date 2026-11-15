import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AccentIcon } from '@/components/ui/AccentIcon';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';
import { FREE_SHIRT_POINTS } from '@/hooks/usePointsLog';

interface PointsProgressCardProps {
  totalPoints: number;
  error: string | null;
  entriesCount: number;
  onOpenInfo: () => void;
}

export function PointsProgressCard({
  totalPoints,
  error,
  entriesCount,
  onOpenInfo,
}: PointsProgressCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.listHeader}>
      <View style={styles.totalCard}>
        <AccentIcon icon="gift-outline" tone="yellow" size="lg" />
        <View style={styles.totalInfo}>
          <Text variant="title">Total Points: {totalPoints}</Text>
          {totalPoints >= FREE_SHIRT_POINTS && (
            <Text variant="bodySm" color={colors.content.onBase.secondary}>
              Eligible for a free shirt!
            </Text>
          )}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        testID="points-info-button"
        onPress={onOpenInfo}
        style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
      >
        <Text variant="bodySmStrong" color={colors.content.onSaseBlueSubtle.primary}>
          What Are Points?
        </Text>
      </Pressable>
      {/* Show refresh errors even when older points are still on screen */}
      {error && entriesCount > 0 && (
        <Text
          variant="bodySm"
          color={colors.content.onDanger.primary}
          style={styles.errorText}
          accessibilityRole="alert"
        >
          Could not refresh points. Pull down to try again.
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    listHeader: {
      gap: space['400'],
      marginBottom: space['400'],
    },
    totalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      padding: space['400'],
      borderRadius: radius.xl,
      backgroundColor: colors.surface.base.secondary,
    },
    totalInfo: {
      gap: space['050'],
    },
    infoButton: {
      alignSelf: 'center',
      paddingVertical: space['200'],
      paddingHorizontal: space['400'],
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderRadius: radius.full,
    },
    pressed: {
      opacity: 0.7,
    },
    errorText: {
      textAlign: 'center',
    },
  });
