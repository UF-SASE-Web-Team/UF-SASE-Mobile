import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, iconSize, radius, space, type Colors } from '@/theme';

export interface PosterCardProps {
  /** Title text displayed at the bottom of the poster card */
  title: string;
  /** Optional overline text or node displayed above the title */
  overline?: React.ReactNode;
  /** Optional color override for the overline text (defaults to onMedia.primary) */
  overlineColor?: string;
  /** Image URL for full-bleed background */
  imageUrl?: string | null;
  /** Accessible label for the background image (default: `${title} banner`) */
  imageAccessibilityLabel?: string;
  /** Fallback icon for the placeholder if image is missing or fails (default: 'sparkles-outline') */
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  /** Optional custom placeholder renderer */
  renderPlaceholder?: () => React.ReactNode;
  /** Optional badge/tag rendered in the top-left corner */
  topLeftBadge?: React.ReactNode;
  /** Optional badge/tag rendered in the top-right corner */
  topRightBadge?: React.ReactNode;
  /** Optional action accessory rendered to the right of the title (e.g. custom button) */
  rightAccessory?: React.ReactNode;
  /** If true, renders a circular action button with a forward chevron to the right of the title */
  showChevron?: boolean;
  /** Press handler */
  onPress?: () => void;
  /** Accessibility label for the card (defaults to title) */
  accessibilityLabel?: string;
  /** Optional style override for outer card container */
  style?: StyleProp<ViewStyle>;
  /** Test ID for the outer card Pressable */
  testID?: string;
  /** Test ID for placeholder when no image or image fails */
  placeholderTestID?: string;
}

export function PosterCard({
  title,
  overline,
  overlineColor,
  imageUrl,
  imageAccessibilityLabel,
  fallbackIcon = 'sparkles-outline',
  renderPlaceholder,
  topLeftBadge,
  topRightBadge,
  rightAccessory,
  showChevron = false,
  onPress,
  accessibilityLabel,
  style,
  testID,
  placeholderTestID,
}: PosterCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage = Boolean(imageUrl) && !imageFailed;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
    >
      {hasImage ? (
        <Image
          source={{ uri: imageUrl! }}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          accessibilityRole="image"
          accessibilityLabel={imageAccessibilityLabel ?? `${title} banner`}
          onError={() => setImageFailed(true)}
        />
      ) : renderPlaceholder ? (
        renderPlaceholder()
      ) : (
        <View style={styles.placeholderContainer} testID={placeholderTestID}>
          <LinearGradient
            colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name={fallbackIcon} size={iconSize.lg} color={colors.content.onMedia.primary} />
        </View>
      )}

      {/* Bottom fade keeps title readable over any flyer or background image */}
      <LinearGradient
        colors={['transparent', 'rgba(12, 12, 13, 0.4)', colors.surface.media.scrim]}
        style={styles.bottomFadeGradient}
        pointerEvents="none"
      />

      {topLeftBadge ? <View style={styles.topLeftBadge}>{topLeftBadge}</View> : null}
      {topRightBadge ? <View style={styles.topRightBadge}>{topRightBadge}</View> : null}

      <View style={styles.contentContainer}>
        <View style={styles.titleWrapper}>
          {Boolean(overline) &&
            (typeof overline === 'string' ? (
              <Text
                variant="bodySmStrong"
                color={overlineColor ?? colors.content.onMedia.primary}
                numberOfLines={1}
                style={styles.overline}
              >
                {overline}
              </Text>
            ) : (
              overline
            ))}
          <Text
            variant="bodyStrong"
            color={colors.content.onMedia.primary}
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>
        </View>

        {rightAccessory ? (
          rightAccessory
        ) : showChevron ? (
          <View style={styles.actionCircle} aria-hidden>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.content.onSaseBlue.primary}
              style={styles.actionChevron}
            />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

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
      justifyContent: 'flex-end',
      position: 'relative',
    },
    cardPressed: {
      opacity: 0.85,
    },
    backgroundImage: {
      ...StyleSheet.absoluteFill,
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
    topLeftBadge: {
      position: 'absolute',
      top: space['300'],
      left: space['300'],
      zIndex: 2,
    },
    topRightBadge: {
      position: 'absolute',
      top: space['300'],
      right: space['300'],
      zIndex: 2,
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
      gap: space['050'],
    },
    overline: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    title: {
      lineHeight: 22,
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
  });
