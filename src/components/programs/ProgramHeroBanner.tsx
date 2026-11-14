import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { GRAPHICS } from '@/lib/assets';
import { space, type Colors } from '@/theme';

interface ProgramHeroBannerProps {
  programName: string;
}

export function ProgramHeroBanner({ programName }: ProgramHeroBannerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.titleContainer}>
      <View style={styles.titleWrapper}>
        <Image
          source={GRAPHICS.starLeft}
          style={styles.starLeft}
          contentFit="cover"
          cachePolicy="memory-disk"
          accessibilityRole="none"
          importantForAccessibility="no"
          accessibilityElementsHidden
        />

        <MaskedView
          maskElement={
            <Text
              variant="display"
              color={colors.content.onBase.primary}
              style={[styles.titleText, styles.maskText]}
            >
              {programName}
            </Text>
          }
        >
          <LinearGradient
            colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <Text
              variant="display"
              color={colors.content.onBase.primary}
              style={[styles.titleText, styles.hiddenTitleText]}
              aria-hidden
            >
              {programName}
            </Text>
          </LinearGradient>
        </MaskedView>

        <Image
          source={GRAPHICS.starRight}
          style={styles.starRight}
          contentFit="cover"
          cachePolicy="memory-disk"
          accessibilityRole="none"
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
      </View>
    </View>
  );
}

const createStyles = (_colors: Colors) =>
  StyleSheet.create({
    titleContainer: {
      paddingHorizontal: space['1000'],
      paddingTop: space['400'],
      paddingBottom: space['400'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleWrapper: {
      position: 'relative',
      alignSelf: 'center',
    },
    starLeft: {
      position: 'absolute',
      left: -38,
      bottom: 0,
      width: 36,
      height: 37,
      zIndex: 1,
    },
    starRight: {
      position: 'absolute',
      right: -30,
      top: -16,
      width: 28,
      height: 39,
      zIndex: 1,
    },
    titleText: {
      textAlign: 'center',
    },
    maskText: {
      backgroundColor: 'transparent',
    },
    hiddenTitleText: {
      opacity: 0,
    },
  });
