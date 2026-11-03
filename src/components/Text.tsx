import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { textStyles } from '@/theme/typography';

export type TextVariant = keyof typeof textStyles;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  ref?: React.Ref<RNText>;
}

export function Text({ variant, color, style, ref, ...props }: TextProps) {
  const { colors } = useTheme();

  const resolvedColor = color ?? colors.content.onBase.primary;
  const variantStyle = variant ? textStyles[variant] : undefined;

  return <RNText ref={ref} style={[{ color: resolvedColor }, variantStyle, style]} {...props} />;
}
