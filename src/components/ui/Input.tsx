import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, iconSize, radius, space, textStyles } from '@/theme';

export interface InputProps extends RNTextInputProps {
  icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  iconColor?: string;
  iconSize?: number;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  error?: string | boolean;
  ref?: React.Ref<RNTextInput>;
}

export function Input({
  icon,
  leftIcon,
  rightIcon,
  iconColor,
  iconSize: customIconSize,
  containerStyle,
  inputStyle,
  style,
  placeholderTextColor,
  keyboardAppearance,
  error,
  testID,
  ref,
  ...props
}: InputProps) {
  const localInputRef = useRef<RNTextInput | null>(null);

  const { keyboardAppearance: themeKeyboardAppearance, colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const resolvedIconColor = iconColor ?? colors.content.onBase.primary;
  const resolvedPlaceholderColor = placeholderTextColor ?? colors.content.onBase.secondary;
  const resolvedIconSize = customIconSize ?? iconSize.md;

  // Stable callback ref merging across renders
  const handleRef = useCallback(
    (node: RNTextInput | null) => {
      localInputRef.current = node;
      if (!ref) return;

      if (typeof ref === 'function') {
        ref(node);
      } else if ('current' in ref) {
        (ref as React.MutableRefObject<RNTextInput | null>).current = node;
      }
    },
    [ref],
  );

  const activeLeftIcon = icon ?? leftIcon;

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.container, Boolean(error) ? styles.containerError : null, containerStyle]}
        onPress={() => localInputRef.current?.focus()}
        accessible={false}
        testID={testID ? `${testID}-container` : undefined}
      >
        {typeof activeLeftIcon === 'string' ? (
          <Ionicons
            name={activeLeftIcon as keyof typeof Ionicons.glyphMap}
            size={resolvedIconSize}
            color={resolvedIconColor}
          />
        ) : (
          activeLeftIcon
        )}

        <RNTextInput
          ref={handleRef}
          keyboardAppearance={keyboardAppearance ?? themeKeyboardAppearance}
          placeholderTextColor={resolvedPlaceholderColor}
          style={[styles.input, inputStyle, style]}
          testID={testID}
          aria-invalid={Boolean(error)}
          {...props}
        />

        {rightIcon ? <View style={styles.rightIconWrapper}>{rightIcon}</View> : null}
      </Pressable>

      {typeof error === 'string' && error.length > 0 ? (
        <Text variant="bodySm" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      gap: space['200'],
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.full,
      paddingHorizontal: space['600'],
      paddingVertical: space['400'],
      gap: space['300'],
      minHeight: 56,
    },
    containerError: {
      borderWidth: 1,
      borderColor: colors.border.danger.primary,
    },
    input: {
      flex: 1,
      fontFamily: textStyles.body.fontFamily,
      fontSize: textStyles.body.fontSize,
      color: colors.content.onBase.primary,
      paddingVertical: 0,
      paddingHorizontal: 0,
      margin: 0,
      textAlignVertical: 'center',
    },
    rightIconWrapper: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: colors.border.danger.primary,
      paddingHorizontal: space['400'],
    },
  });
