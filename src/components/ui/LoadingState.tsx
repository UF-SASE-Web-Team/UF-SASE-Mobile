import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { space } from '@/theme';

export interface LoadingStateProps {
  size?: 'small' | 'large';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function LoadingState({
  size = 'large',
  accessibilityLabel = 'Loading',
  style,
  testID = 'loading-state',
}: LoadingStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <ActivityIndicator
        size={size}
        color={colors.surface.saseBlue.primary}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: space['800'],
  },
});
