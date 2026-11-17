import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AccentIcon } from '@/components/ui/AccentIcon';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';
import { FREE_SHIRT_POINTS } from '@/hooks/usePointsLog';

interface PointsProgressCardProps {
  totalPoints: number;
  error: string | null;
  /** True when older data is still on screen, so a failed refresh shows a notice. */
  hasData: boolean;
}

export function PointsProgressCard({ totalPoints, error, hasData }: PointsProgressCardProps) {
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

      {/* Show refresh errors even when older points are still on screen */}
      {error && hasData && (
        <Text
          variant="bodySm"
          color={colors.content.onBase.secondary}
          style={styles.errorText}
          accessibilityRole="alert"
        >
          Could not refresh. Pull down to try again.
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
      flex: 1,
      gap: space['050'],
    },
    errorText: {
      textAlign: 'center',
    },
  });
