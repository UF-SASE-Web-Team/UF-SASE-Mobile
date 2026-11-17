import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AccentIcon } from '@/components/ui/AccentIcon';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { formatPoints } from '@/lib/points';
import { borderWidth, radius, space, type Colors } from '@/theme';
import type { PointsSummary } from '@/types/points';

interface SemesterStandingCardProps {
  summary: PointsSummary | null;
}

/** The member's points and rank for the current term, shown above the leaderboard. */
export function SemesterStandingCard({ summary }: SemesterStandingCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const rankLabel = summary?.semesterRank
    ? `#${summary.semesterRank} of ${summary.rankedMembers}`
    : '–';

  return (
    <View style={styles.card} testID="semester-standing">
      <View style={styles.stat} testID="points-semester-points">
        <AccentIcon icon="calendar-outline" tone="blue" size="md" />
        <View style={styles.statText}>
          <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
            {summary?.termName ?? 'This semester'}
          </Text>
          <Text variant="bodyStrong">{formatPoints(summary?.semesterPoints ?? 0)}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat} testID="points-semester-rank">
        <AccentIcon icon="trophy-outline" tone="yellow" size="md" />
        <View style={styles.statText}>
          <Text variant="bodySm" color={colors.content.onBase.secondary}>
            Your rank
          </Text>
          <Text variant="bodyStrong">{rankLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      paddingVertical: space['300'],
      borderRadius: radius.md,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      backgroundColor: colors.surface.base.secondary,
    },
    stat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingHorizontal: space['400'],
    },
    statText: {
      flex: 1,
      gap: space['050'],
    },
    divider: {
      width: borderWidth.sm,
      alignSelf: 'stretch',
      backgroundColor: colors.border.base.subtle,
    },
  });
