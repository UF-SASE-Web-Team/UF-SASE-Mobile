import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { iconSize, radius, space, type Colors } from '@/theme';

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
      <Pressable
        testID="event-checkin-button"
        style={({ pressed }) => [styles.checkInButton, pressed && styles.checkInButtonPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Check in to event"
      >
        <Ionicons name="qr-code" size={iconSize.md} color={colors.content.onSaseBlue.primary} />
        <Text variant="bodyStrong" color={colors.content.onSaseBlue.primary}>
          Check-in
        </Text>
      </Pressable>
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
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['200'],
      backgroundColor: colors.surface.saseBlue.secondary,
      borderRadius: radius.md,
      paddingVertical: space['300'],
    },
    checkInButtonPressed: {
      opacity: 0.85,
    },
  });
