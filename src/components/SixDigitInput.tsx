import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useState, useRef } from 'react';

export interface SixDigitInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

export function SixDigitInput({ value, onChangeText, onComplete, disabled }: SixDigitInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  return (
    <Pressable
      style={styles.otpContainer}
      onPress={() => inputRef.current?.focus()}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="6-digit verification code"
    >
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
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        style={styles.hiddenInput}
        editable={!disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        caretHidden
      />
      {digits.map((digit, index) => {
        const isFilled = Boolean(digit);
        const isCurrent = isFocused && index === value.length;
        return (
          <View
            key={index}
            pointerEvents="none"
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
    position: 'relative',
  },
  otpBox: {
    flex: 1,
    height: 54,
    maxWidth: 48,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: '#666666',
  },
  otpBoxActive: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.01,
  },
});
