import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgramWithPoCs } from '@/types/programs';
import { isJoinLink } from '@/services/programs';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { openExternalLink } from '@/lib/links';
import { type Colors, space, radius, iconSize, borderWidth } from '@/theme';

export interface ApplicationCardProps {
  program: ProgramWithPoCs;
  onPress?: (program: ProgramWithPoCs) => void;
}

/**
 * Application Card: Card for programs currently accepting applications or join links.
 */
export function ApplicationCard({ program, onPress }: ApplicationCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const now = new Date();
  const opensAt = program.opens_at ? new Date(program.opens_at) : null;
  const closesAt = program.closes_at ? new Date(program.closes_at) : null;

  const isUpcoming = opensAt !== null && opensAt > now;
  const isOpen = !isUpcoming && (closesAt === null || closesAt > now);
  const isJoin = isJoinLink(program.application_url);
  const actionLabel = isJoin ? 'Join' : 'Apply';
  const hasStatusLine = isUpcoming || closesAt !== null;

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

  const handleApplyPress = async () => {
    if (!program.application_url) return;
    await openExternalLink(program.application_url, `${program.name} ${actionLabel}`);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(program)}
      accessibilityRole="button"
      accessibilityLabel={program.name}
    >
      <View style={styles.imageContainer}>
        {program.image_url ? (
          <Image
            source={{ uri: program.image_url }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessibilityRole="image"
            accessibilityLabel={`${program.name} banner`}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="sparkles-outline" size={32} color={colors.content.onBase.secondary} />
          </View>
        )}

        {isUpcoming && (
          <View style={styles.statusBadge}>
            <Text variant="bodySmStrong">Waiting</Text>
            <View style={styles.statusDot} />
          </View>
        )}

        {isOpen && program.application_url && (
          <Pressable
            style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
            onPress={handleApplyPress}
            hitSlop={space['200']}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} ${isJoin ? '' : 'to '}${program.name}`}
          >
            <Text
              variant="bodyStrong"
              color={colors.content.onSaseBlue.secondary}
              numberOfLines={1}
            >
              {actionLabel}
            </Text>
            <Ionicons
              name="open-outline"
              size={iconSize.sm}
              color={colors.content.onSaseBlue.secondary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <Text variant="bodyStrong" style={styles.title} numberOfLines={hasStatusLine ? 1 : 2}>
          {program.name}
        </Text>

        {hasStatusLine && (
          <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
            {isUpcoming ? (
              <>
                Applications open{' '}
                <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
                  soon!
                </Text>
              </>
            ) : (
              closesAt && (
                <>
                  {actionLabel} by{' '}
                  <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
                    {formatShortDate(closesAt)}!
                  </Text>
                </>
              )
            )}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export { ApplicationCard as ApplicationProgramCard };

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 248,
      height: 232,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      overflow: 'hidden',
      marginRight: space['300'],
      justifyContent: 'flex-end',
      position: 'relative',
    },
    cardPressed: {
      opacity: 0.85,
    },
    imageContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.surface.base.tertiary,
      position: 'relative',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.base.tertiary,
    },
    statusBadge: {
      position: 'absolute',
      top: space['200'],
      right: space['200'],
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
      paddingHorizontal: space['200'],
      paddingVertical: space['100'],
      borderRadius: radius.md,
      gap: space['100'],
    },
    statusDot: {
      width: space['200'],
      height: space['200'],
      borderRadius: radius.sm,
      backgroundColor: colors.content.onBase.primary,
    },
    footer: {
      paddingHorizontal: space['250'],
      paddingVertical: space['250'],
      gap: space['050'],
    },
    title: {
      lineHeight: space['500'],
    },
    applyButton: {
      position: 'absolute',
      top: space['200'],
      right: space['200'],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['100'],
      backgroundColor: colors.surface.saseBlue.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.surface.saseBlue.secondary,
      paddingHorizontal: space['150'],
      paddingVertical: space['150'],
      borderRadius: radius.md,
      minWidth: 65,
    },
    applyButtonPressed: {
      opacity: 0.75,
    },
  });
