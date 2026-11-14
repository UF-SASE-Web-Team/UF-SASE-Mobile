import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AccentIcon } from '@/components/ui/AccentIcon';
import { useThemedStyles } from '@/context/ThemeContext';
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
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.listHeader}>
      <View style={styles.totalCard}>
        <AccentIcon icon="gift-outline" tone="yellow" size="lg" />
        <View style={styles.totalInfo}>
          <Text style={styles.totalTitle}>Total Points: {totalPoints}</Text>
          {totalPoints >= FREE_SHIRT_POINTS && (
            <Text style={styles.totalSubtitle}>Eligible for a free shirt!</Text>
          )}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        testID="points-info-button"
        onPress={onOpenInfo}
        style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
      >
        <Text style={styles.infoButtonText}>What Are Points?</Text>
      </Pressable>
      {/* Show refresh errors even when older points are still on screen */}
      {error && entriesCount > 0 && (
        <Text style={styles.errorText} accessibilityRole="alert">
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
      borderRadius: 30,
      backgroundColor: colors.surface.base.secondary,
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    totalInfo: {
      gap: space['050'],
    },
    totalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.content.onBase.primary,
    },
    totalSubtitle: {
      fontSize: 14,
      color: colors.content.onBase.secondary,
    },
    infoButton: {
      alignSelf: 'center',
      paddingVertical: space['200'],
      paddingHorizontal: space['400'],
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderRadius: radius.full,
    },
    infoButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.content.onSaseBlueSubtle.primary,
    },
    pressed: {
      opacity: 0.7,
    },
    errorText: {
      color: colors.content.onDanger.primary,
      fontSize: 14,
      textAlign: 'center',
    },
  });
