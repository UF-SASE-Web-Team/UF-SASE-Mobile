import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgramWithPoCs } from '@/types/programs';
import { isJoinLink } from '@/lib/programs';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space, radius, iconSize, borderWidth } from '@/theme';

export interface ProgramCardProps {
  program: ProgramWithPoCs;
  onPress?: (program: ProgramWithPoCs) => void;
}

/**
 * Standard Program Card: Redesigned with visual image banner, soft fade,
 * prominent program title, and circular chevron action button.
 */
export function StandardProgramCard({ program, onPress }: ProgramCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress?.(program)}
      accessibilityRole="button"
      accessibilityLabel={program.name}
    >
      {/* Full-bleed Background Image */}
      {program.image_url ? (
        <Image
          source={{ uri: program.image_url }}
          style={styles.backgroundImage}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={`${program.name} banner`}
        />
      ) : (
        <View style={styles.placeholderContainer}>
          <Ionicons name="sparkles-outline" size={32} color={colors.content.onBase.secondary} />
        </View>
      )}

      {/* Bottom Fade Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(12, 12, 13, 0.4)', colors.surface.media.scrim]}
        style={styles.bottomFadeGradient}
        pointerEvents="none"
      />

      {/* Card Body: Title & Action Chevron */}
      <View style={styles.contentContainer}>
        <View style={styles.titleWrapper}>
          <Text variant="bodyStrong" color={colors.content.onMedia.primary} numberOfLines={2}>
            {program.name}
          </Text>
        </View>

        <View style={styles.actionCircle} aria-hidden>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.content.onSaseBlue.primary}
            style={styles.actionChevron}
          />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Top Row Card: Open / Upcoming Applications
 */
export function ApplicationProgramCard({ program, onPress }: ProgramCardProps) {
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
    const supported = await Linking.canOpenURL(program.application_url);
    if (supported) {
      await Linking.openURL(program.application_url);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, styles.appCard, pressed && styles.cardPressed]}
      onPress={() => onPress?.(program)}
      accessibilityRole="button"
      accessibilityLabel={program.name}
    >
      <View style={styles.appImageContainer}>
        {program.image_url ? (
          <Image
            source={{ uri: program.image_url }}
            style={styles.image}
            resizeMode="cover"
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
            style={({ pressed }) => [styles.applyButton, pressed && styles.cardPressed]}
            onPress={handleApplyPress}
            hitSlop={space['200']}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel} ${isJoin ? '' : 'to '}${program.name}`}
          >
            <Text variant="bodySmStrong" style={styles.applyButtonText}>
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

      <View style={styles.appCardFooter}>
        {/* The name wraps to two lines unless a date line needs the room */}
        <Text
          variant="bodyStrong"
          style={styles.appCardTitle}
          numberOfLines={hasStatusLine ? 1 : 2}
        >
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

export { StandardProgramCard as ProgramCard };

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
    cardPressed: {
      opacity: 0.85,
    },
    backgroundImage: {
      ...StyleSheet.absoluteFill,
      width: '100%',
      height: '100%',
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
    bottomFadeGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
    },
    contentContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingHorizontal: space['300'],
      paddingBottom: space['300'],
      gap: space['200'],
      zIndex: 1,
    },
    titleWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    actionCircle: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.content.onMedia.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    actionChevron: {
      marginLeft: 1,
    },
    // Application Program Card Styles
    appCard: {
      width: 248,
      height: 232,
    },
    appImageContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.surface.base.tertiary,
      position: 'relative',
      overflow: 'hidden',
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
    appCardFooter: {
      paddingHorizontal: space['250'],
      paddingVertical: space['250'],
      gap: space['050'],
    },
    appCardTitle: {
      lineHeight: space['500'],
    },
    applyButton: {
      position: 'absolute',
      top: space['200'],
      right: space['200'],
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.saseBlue.secondary,
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
      borderRadius: radius.md,
      gap: space['100'],
    },
    applyButtonText: {
      color: colors.content.onSaseBlue.secondary,
    },
  });
