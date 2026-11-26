import {
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { useState, useRef } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { CODE_LENGTH, findCode, nextCode } from '@/lib/oneTimeCode';
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
  const { keyboardAppearance, colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] || '');

  const acceptCode = (code: string) => {
    setPasteError(null);
    onChangeText(code);
    if (code.length === CODE_LENGTH) onComplete?.(code);
  };

  // The real text field is invisible, so iOS never offers its Paste menu on it.
  // This button pastes a copied code (from an email, message or note) instead.
  const pasteText = (text: string | null | undefined) => {
    const code = text ? findCode(text) : null;
    if (code) acceptCode(code);
    else setPasteError(`No ${CODE_LENGTH}-digit code in what you copied.`);
  };

  const handleKeyPress = ({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (nativeEvent.key === 'Backspace' && value.length === CODE_LENGTH) {
      onChangeText(value.slice(0, -1));
    }
  };

  return (
    <View style={styles.wrapper}>
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
          onChangeText={(text) => acceptCode(nextCode(value, text))}
          onKeyPress={handleKeyPress}
          selection={{ start: value.length, end: value.length }}
          keyboardType="number-pad"
          keyboardAppearance={keyboardAppearance}
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
      {!disabled && (
        <View style={styles.pasteRow}>
          {Clipboard.isPasteButtonAvailable ? (
            <Clipboard.ClipboardPasteButton
              acceptedContentTypes={['plain-text']}
              onPress={(data) => pasteText(data.type === 'text' ? data.text : null)}
              backgroundColor={colors.surface.base.secondary}
              foregroundColor={colors.content.onBase.primary}
              cornerStyle="capsule"
              displayMode="iconAndLabel"
              style={styles.nativePaste}
              accessibilityLabel="Paste code"
            />
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onPress={async () => pasteText(await Clipboard.getStringAsync())}
              accessibilityLabel="Paste code"
            >
              Paste code
            </Button>
          )}
        </View>
      )}
      {pasteError ? (
        <Text
          variant="bodySm"
          color={colors.border.danger.primary}
          accessibilityRole="alert"
          style={styles.pasteError}
        >
          {pasteError}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: { alignSelf: 'stretch' },
    pasteRow: { alignItems: 'center' },
    // UIPasteControl needs an explicit size to render.
    nativePaste: { width: space['1200'] * 2.5, height: space['1000'] },
    pasteError: { textAlign: 'center', marginTop: space['200'] },
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
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    otpBoxFilled: {
      borderColor: colors.border.base.strong,
      borderWidth: borderWidth.sm,
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
