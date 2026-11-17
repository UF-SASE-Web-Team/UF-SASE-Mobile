import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AccentIcon } from '@/components/ui/AccentIcon';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, radius, space, type Colors } from '@/theme';
import { FREE_SHIRT_POINTS } from '@/hooks/usePointsLog';
import type { PointsSummary } from '@/types/points';

interface PointsProgressCardProps {
  summary: PointsSummary | null;
  error: string | null;
  /** True when older data is still on screen, so a failed refresh shows a notice. */
  hasData: boolean;
  onOpenInfo: () => void;
}

export function PointsProgressCard({
  summary,
  error,
  hasData,
  onOpenInfo,
}: PointsProgressCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const totalPoints = summary?.totalPoints ?? 0;
  const termLabel = summary?.termName ?? 'This semester';
  const rankLabel = summary?.semesterRank
    ? `#${summary.semesterRank} of ${summary.rankedMembers}`
    : '–';

  return (
    <View style={styles.listHeader}>
      <View style={styles.totalCard}>
        <View style={styles.totalRow}>
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

        <View style={styles.stats}>
          <View style={styles.stat} testID="points-semester-points">
            <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
              {termLabel}
            </Text>
            <Text variant="bodyStrong">{summary?.semesterPoints ?? 0} pts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat} testID="points-semester-rank">
            <Text variant="bodySm" color={colors.content.onBase.secondary}>
              Your rank
            </Text>
            <Text variant="bodyStrong">{rankLabel}</Text>
          </View>
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
      gap: space['400'],
      padding: space['400'],
      borderRadius: radius.xl,
      backgroundColor: colors.surface.base.secondary,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
    },
    totalInfo: {
      flex: 1,
      gap: space['050'],
    },
    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: space['300'],
      borderTopWidth: borderWidth.sm,
      borderTopColor: colors.border.base.subtle,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
      gap: space['050'],
    },
    statDivider: {
      width: borderWidth.sm,
      alignSelf: 'stretch',
      backgroundColor: colors.border.base.subtle,
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
