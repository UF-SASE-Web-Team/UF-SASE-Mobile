import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SaseFlask } from '@/components/ui/SaseFlask';
import { SaseLogo } from '@/components/ui/SaseLogo';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { space, type Colors } from '@/theme';

// Proportions from the SaseFlask (626x858) and SaseLogo (2251x511) artwork.
const FLASK_ASPECT_RATIO = 858 / 626;
const LOGO_ASPECT_RATIO = 2251 / 511;
const LOGO_WIDTH_RATIO = 3.5;

interface EventBackdropHeroProps {
  flyerUrl?: string | null;
  heroHeight: number;
  sheetTop: number;
  insetsTop: number;
  scrollY: Animated.Value;
  flyerViewerOrigin: { scale: number } | null;
}

export function EventBackdropHero({
  flyerUrl,
  heroHeight,
  sheetTop,
  insetsTop,
  scrollY,
  flyerViewerOrigin,
}: EventBackdropHeroProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const heroScale = scrollY.interpolate({
    inputRange: [-heroHeight, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-heroHeight, 0, heroHeight],
    outputRange: [heroHeight / 2, 0, -heroHeight / 2],
  });

  if (flyerUrl) {
    return (
      <Animated.View
        style={[
          styles.flyerHero,
          {
            height: heroHeight,
            opacity: flyerViewerOrigin ? 0 : 1,
            transform: [{ translateY: heroTranslateY }, { scale: heroScale }],
          },
        ]}
      >
        <Image
          testID="event-backdrop-image"
          source={{ uri: flyerUrl }}
          contentFit="cover"
          style={styles.flyerHeroImage}
          accessibilityRole="image"
          accessibilityLabel="Event flyer"
        />
      </Animated.View>
    );
  }

  return (
    <LinearGradient
      testID="event-backdrop-gradient"
      colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.backdropGradient, { height: heroHeight }]}
    >
      <View
        style={[styles.backdropLogo, { height: sheetTop, paddingTop: insetsTop }]}
        accessible
        accessibilityRole="image"
        accessibilityLabel="UF SASE Logo"
        testID="event-backdrop-logo"
      >
        <SaseFlask
          width={space['1200']}
          height={space['1200'] * FLASK_ASPECT_RATIO}
          fill={colors.content.onSaseBlue.secondary}
          color={colors.content.onSaseBlue.secondary}
        />
        <SaseLogo
          width={space['1200'] * LOGO_WIDTH_RATIO}
          height={(space['1200'] * LOGO_WIDTH_RATIO) / LOGO_ASPECT_RATIO}
          fill={colors.content.onSaseBlue.secondary}
          color={colors.content.onSaseBlue.secondary}
        />
      </View>
    </LinearGradient>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    flyerHero: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      overflow: 'hidden',
    },
    flyerHeroImage: {
      width: '100%',
      height: '100%',
    },
    backdropGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    backdropLogo: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['200'],
    },
  });
