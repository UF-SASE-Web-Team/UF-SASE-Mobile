import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/Button';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { iconSize, space, type Colors } from '@/theme';

interface EventCheckInBottomBarProps {
  insetsBottom: number;
  onPress: () => void;
}

export function EventCheckInBottomBar({ insetsBottom, onPress }: EventCheckInBottomBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View
      testID="bottom-check-in-container"
      style={[
        styles.bottomContainer,
        {
          paddingBottom: Math.max(insetsBottom, space['300']),
        },
      ]}
      pointerEvents="box-none"
    >
      <LinearGradient
        testID="bottom-fade-gradient"
        colors={['rgba(0,0,0,0)', colors.surface.media.scrim]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />
      <Button
        testID="event-checkin-button"
        variant="secondary"
        size="md"
        onPress={onPress}
        accessibilityLabel="Check in to event"
        leftIcon={
          <Ionicons
            name="barcode-outline"
            size={iconSize.md}
            color={colors.content.onSaseBlue.secondary}
          />
        }
      >
        Check-in
      </Button>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
    },
    bottomGradient: {
      position: 'absolute',
      top: -30,
      left: 0,
      right: 0,
      bottom: 0,
    },
  });
