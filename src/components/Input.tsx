import React, { forwardRef } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type InputProps = RNTextInputProps;

export const Input = forwardRef<RNTextInput, InputProps>(
  ({ keyboardAppearance, placeholderTextColor, style, ...props }, ref) => {
    const { keyboardAppearance: themeKeyboardAppearance, colors } = useTheme();

    return (
      <RNTextInput
        ref={ref}
        keyboardAppearance={keyboardAppearance ?? themeKeyboardAppearance}
        placeholderTextColor={placeholderTextColor ?? colors.content.onBase.secondary}
        style={StyleSheet.compose({ color: colors.content.onBase.primary }, style)}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
