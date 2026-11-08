import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgramWithPoCs } from '@/types/programs';
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

  const formatShortDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

  const handleApplyPress = async () => {
    if (isOpen && program.application_url) {
      const supported = await Linking.canOpenURL(program.application_url);
      if (supported) {
        await Linking.openURL(program.application_url);
      }
    } else if (onPress) {
      onPress(program);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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

        <LinearGradient
          colors={[`${colors.surface.base.secondary}00`, colors.surface.base.secondary]}
          style={styles.imageFadeGradient}
          pointerEvents="none"
        />

        {isUpcoming && (
          <View style={styles.statusBadge}>
            <Text variant="bodySmStrong">Waiting</Text>
            <View style={styles.statusDot} />
          </View>
        )}
      </View>

      <View style={styles.appCardFooter}>
        <Text variant="bodySmStrong" numberOfLines={1}>
          {program.name}
        </Text>

        <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
          {isUpcoming ? (
            <>
              Applications open{' '}
              <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
                soon!
              </Text>
            </>
          ) : closesAt ? (
            <>
              Apply by{' '}
              <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
                {formatShortDate(closesAt)}!
              </Text>
            </>
          ) : (
            <>
              Applications{' '}
              <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
                open!
              </Text>
            </>
          )}
        </Text>

        <Pressable
          style={[styles.applyButton, !isOpen && styles.applyButtonDisabled]}
          disabled={!isOpen || !program.application_url}
          onPress={handleApplyPress}
          accessibilityRole="button"
          accessibilityLabel={`Apply to ${program.name}`}
        >
          <Text
            variant="bodySmStrong"
            color={isOpen ? colors.content.onSaseBlue.secondary : colors.content.onBase.secondary}
          >
            Apply
          </Text>
          {isOpen && (
            <Ionicons
              name="open-outline"
              size={iconSize.sm}
              color={colors.content.onSaseBlue.secondary}
              style={styles.buttonIcon}
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

export { StandardProgramCard as ProgramCard };

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 168,
      height: 218,
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
    imageFadeGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 48,
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
    appImageContainer: {
      height: 105,
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
      backgroundColor: colors.content.onBase.secondary,
    },
    appCardFooter: {
      flex: 1,
      paddingHorizontal: space['250'],
      paddingVertical: space['200'],
      justifyContent: 'space-between',
      gap: space['100'],
    },
    applyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.saseBlue.primary,
      paddingVertical: space['150'],
      borderRadius: radius.lg,
      gap: space['150'],
    },
    applyButtonDisabled: {
      backgroundColor: colors.surface.base.tertiary,
    },
    buttonIcon: {
      marginLeft: space['050'],
    },
  });
