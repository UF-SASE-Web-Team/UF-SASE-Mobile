import React, { forwardRef } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { textStyles } from '@/theme/typography';

export type TextVariant = keyof typeof textStyles;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
}

export const Text = forwardRef<RNText, TextProps>(({ variant, color, style, ...props }, ref) => {
  const { colors } = useTheme();

  const resolvedColor = color ?? colors.content.onBase.primary;
  const variantStyle = variant ? textStyles[variant] : undefined;

  return (
    <RNText
      ref={ref}
      style={StyleSheet.compose(
        variantStyle ? { color: resolvedColor, ...variantStyle } : { color: resolvedColor },
        style,
      )}
      {...props}
    />
  );
});

Text.displayName = 'Text';
