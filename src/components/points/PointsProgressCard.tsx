import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, fonts, radius, space, type Colors } from '@/theme';

interface PointsProgressCardProps {
  totalPoints: number;
  rank?: number | null;
  error?: string | null;
  entriesCount?: number;
  onOpenInfo?: () => void;
  onOpenLeaderboard?: () => void;
}

export function PointsProgressCard({
  totalPoints,
  rank,
  error,
  entriesCount = 0,
  onOpenInfo,
  onOpenLeaderboard,
}: PointsProgressCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const rankText = rank != null ? `#${rank}` : '–';

  return (
    <View style={styles.container}>
      <View style={styles.cardsRow}>
        {/* Points Card */}
        <Pressable
          style={({ pressed }) => [styles.pointsWrapper, pressed && onOpenInfo && styles.pressed]}
          onPress={onOpenInfo}
          disabled={!onOpenInfo}
          accessibilityRole="button"
          accessibilityLabel={`Total points: ${totalPoints}. View how points work`}
          testID="points-summary-card"
        >
          <LinearGradient
            colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsCard}
          >
            <Text variant="bodySmStrong" style={styles.pointsLabel}>
              POINTS
            </Text>
            <Text variant="display" style={styles.pointsValue} numberOfLines={1}>
              {totalPoints}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Rank Card */}
        <Pressable
          style={({ pressed }) => [
            styles.rankWrapper,
            styles.rankCard,
            pressed && onOpenLeaderboard && styles.pressed,
          ]}
          onPress={onOpenLeaderboard}
          disabled={!onOpenLeaderboard}
          accessibilityRole="button"
          accessibilityLabel={`Rank: ${rankText}. View leaderboard`}
          testID="rank-summary-card"
        >
          <Text
            variant="bodySmStrong"
            color={colors.content.onBase.secondary}
            style={styles.rankLabel}
          >
            RANK
          </Text>
          <Text
            variant="display"
            color={colors.content.onBase.primary}
            style={styles.rankValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {rankText}
          </Text>
        </Pressable>
      </View>

      {/* Show refresh errors even when older points are still on screen */}
      {error && entriesCount > 0 && (
        <Text
          variant="bodySm"
          color={colors.content.onBase.secondary}
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
    container: {
      gap: space['200'],
    },
    cardsRow: {
      flexDirection: 'row',
      gap: space['300'],
      width: '100%',
    },
    pointsWrapper: {
      flex: 2,
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    rankWrapper: {
      flex: 1,
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    pointsCard: {
      flex: 1,
      paddingVertical: space['300'],
      paddingHorizontal: space['500'],
      borderRadius: radius.xl,
      gap: space['050'],
      justifyContent: 'center',
    },
    pointsLabel: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 12,
      letterSpacing: 0.8,
      fontFamily: fonts.sans.bold,
      fontWeight: '700',
    },
    pointsValue: {
      color: colors.content.onMedia.primary,
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fonts.display.bold,
      fontWeight: '700',
    },
    rankCard: {
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      paddingVertical: space['300'],
      paddingHorizontal: space['500'],
      gap: space['050'],
      justifyContent: 'center',
    },
    rankLabel: {
      fontSize: 12,
      letterSpacing: 0.8,
      fontFamily: fonts.sans.bold,
      fontWeight: '700',
    },
    rankValue: {
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fonts.display.bold,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.85,
    },
    errorText: {
      textAlign: 'center',
      paddingHorizontal: space['400'],
    },
  });
