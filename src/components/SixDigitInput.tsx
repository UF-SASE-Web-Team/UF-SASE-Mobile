import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useState, useRef } from 'react';
import { Text } from '@/components/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { type Colors, borderWidth, fonts, radius, space } from '@/theme';

export interface SixDigitInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

export function SixDigitInput({ value, onChangeText, onComplete, disabled }: SixDigitInputProps) {
  const styles = useThemedStyles(createStyles);
  const { keyboardAppearance } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleKeyPress = ({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (nativeEvent.key === 'Backspace' && value.length === 6) {
      onChangeText(value.slice(0, -1));
    }
  };

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }}
      style={[styles.otpContainer, disabled && styles.otpContainerDisabled]}
      accessible={false}
    >
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);
        const isCurrent = isFocused && index === value.length;
        return (
          <View
            key={index}
            style={[
              styles.otpBox,
              isFilled && styles.otpBoxFilled,
              isCurrent && styles.otpBoxActive,
            ]}
          >
            <Text style={styles.otpDigit}>{digit}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
          onChangeText(numericText);
          if (numericText.length === 6) {
            onComplete?.(numericText);
          }
        }}
        onKeyPress={handleKeyPress}
        selection={{ start: value.length, end: value.length }}
        keyboardType="number-pad"
        keyboardAppearance={keyboardAppearance}
        maxLength={6}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={styles.hiddenInput}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel="6-digit verification code"
      />
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    otpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: space['200'],
      marginVertical: space['300'],
      position: 'relative',
    },
    otpContainerDisabled: {
      opacity: 0.5,
    },
    otpBox: {
      flex: 1,
      height: 54,
      maxWidth: space['1200'],
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.sm,
      backgroundColor: colors.surface.base.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    otpBoxFilled: {
      borderColor: colors.border.base.strong,
      backgroundColor: colors.surface.base.primary,
    },
    otpBoxActive: {
      borderColor: colors.surface.saseBlue.primary,
      borderWidth: borderWidth.lg,
      backgroundColor: colors.surface.base.primary,
    },
    otpDigit: {
      fontFamily: fonts.sans.semibold,
      fontSize: 22,
      color: colors.content.onBase.primary,
    },
    hiddenInput: {
      ...StyleSheet.absoluteFill,
      opacity: 0.01,
      zIndex: 10,
    },
  });
