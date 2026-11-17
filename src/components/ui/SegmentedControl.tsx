import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { type Colors, borderWidth, iconSize, radius, space } from '@/theme';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
  accessibilityLabel?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityRole?: 'tab' | 'radio' | 'button';
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  style,
  testID,
  accessibilityRole = 'tab',
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const containerRole = accessibilityRole === 'radio' ? 'radiogroup' : 'tablist';

  return (
    <View style={[styles.container, style]} accessibilityRole={containerRole} testID={testID}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const itemAccessibilityState =
          accessibilityRole === 'radio'
            ? { checked: isSelected, disabled }
            : { selected: isSelected, disabled };

        return (
          <Pressable
            key={option.value}
            testID={option.testID ?? (testID ? `${testID}-${option.value}` : undefined)}
            accessibilityRole={accessibilityRole}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={itemAccessibilityState}
            disabled={disabled}
            onPress={() => {
              if (!isSelected) onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.button,
              isSelected && styles.buttonActive,
              pressed && !disabled && styles.buttonPressed,
              disabled && styles.buttonDisabled,
            ]}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={iconSize.sm}
                color={
                  isSelected ? colors.content.onSaseBlue.primary : colors.content.onBase.secondary
                }
              />
            ) : null}
            <Text
              variant="bodySmStrong"
              color={
                isSelected ? colors.content.onSaseBlue.primary : colors.content.onBase.secondary
              }
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.full,
      padding: space['100'],
      gap: space['100'],
      width: '100%',
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space['200'],
      paddingHorizontal: space['150'],
      borderRadius: radius.full,
      gap: space['150'],
      borderWidth: borderWidth.sm,
      borderColor: 'transparent',
    },
    buttonActive: {
      backgroundColor: colors.surface.saseBlue.primary,
      borderColor: colors.surface.saseBlue.primary,
      shadowColor: colors.surface.media.backdrop,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    buttonPressed: {
      opacity: 0.8,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
