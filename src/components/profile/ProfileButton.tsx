import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import {
  useTheme,
  useThemedStyles,
  type Colors,
  fonts,
  profileLayout,
  radius,
  space,
} from '@/theme';

interface ProfileButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function ProfileButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ProfileButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const content = (
    <>
      {loading && <ActivityIndicator color={colors.content.onMedia.primary} />}
      <Text
        variant="title"
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'danger' && styles.dangerLabel,
        ]}
      >
        {title}
      </Text>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
          start={{ x: 0, y: 0.8 }}
          end={{ x: 1, y: 0.2 }}
          style={styles.content}
        >
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.content, variant === 'danger' ? styles.danger : styles.secondary]}>
          {content}
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    button: {
      borderRadius: radius.full,
      shadowColor: colors.surface.media.scrim,
      shadowOffset: { width: 0, height: space['050'] },
      shadowOpacity: 0.2,
      shadowRadius: space['100'],
      elevation: space['050'],
    },
    content: {
      minHeight: profileLayout.actionHeight,
      borderRadius: radius.full,
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: space['200'],
    },
    label: {
      color: colors.content.onMedia.primary,
      fontFamily: fonts.sans.medium,
      textAlign: 'center',
      flexShrink: 1,
    },
    secondary: { backgroundColor: colors.surface.base.tertiary },
    secondaryLabel: { color: colors.content.onBase.brand },
    danger: { backgroundColor: colors.surface.danger.secondary },
    dangerLabel: { color: colors.content.onDanger.secondary },
    pressed: { opacity: profileLayout.pressedOpacity },
    disabled: { opacity: profileLayout.disabledOpacity },
  });
