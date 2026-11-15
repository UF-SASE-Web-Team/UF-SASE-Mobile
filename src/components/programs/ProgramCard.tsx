import React from 'react';
import { StyleSheet } from 'react-native';
import { ProgramWithPoCs } from '@/types/programs';
import { PosterCard } from '@/components/ui/PosterCard';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space, radius, borderWidth } from '@/theme';

export interface ProgramCardProps {
  program: ProgramWithPoCs;
  onPress?: (program: ProgramWithPoCs) => void;
}

/**
 * Standard Program Card: Visual image banner, soft fade,
 * prominent program title, and circular chevron action button.
 */
export function ProgramCard({ program, onPress }: ProgramCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <PosterCard
      title={program.name}
      imageUrl={program.image_url}
      imageAccessibilityLabel={`${program.name} banner`}
      fallbackIcon="sparkles-outline"
      showChevron
      onPress={() => onPress?.(program)}
      style={styles.card}
    />
  );
}

export { ProgramCard as StandardProgramCard };

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 168,
      height: 204,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      overflow: 'hidden',
      marginRight: space['300'],
      justifyContent: 'flex-end',
      position: 'relative',
    },
  });
