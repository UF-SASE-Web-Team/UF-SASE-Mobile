import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles, type Colors, fonts, radius, space } from '@/theme';

interface ProfileButtonProps {
  title: string;
  onPress: () => void;
  /** `ghost` is a low-emphasis text-only button for rarely used actions. */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
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
  const isGhost = variant === 'ghost';
  const spinnerColor =
    variant === 'primary'
      ? colors.content.onMedia.primary
      : variant === 'danger'
        ? colors.content.onDanger.primary
        : variant === 'secondary'
          ? colors.content.onBase.primary
          : colors.content.onBase.secondary;
  const content = (
    <>
      {loading && <ActivityIndicator size={isGhost ? 'small' : undefined} color={spinnerColor} />}
      <Text
        variant={isGhost ? 'bodySm' : 'title'}
        style={[
          styles.label,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'danger' && styles.dangerLabel,
          isGhost && styles.ghostLabel,
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
        isGhost ? styles.ghostButton : styles.button,
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
      ) : isGhost ? (
        <View style={styles.ghostContent}>{content}</View>
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
      minHeight: 50,
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
    secondaryLabel: { color: colors.content.onBase.primary },
    danger: { backgroundColor: colors.surface.danger.primary },
    dangerLabel: { color: colors.content.onDanger.primary },
    ghostButton: { alignSelf: 'center' },
    ghostContent: {
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: space['200'],
    },
    ghostLabel: { color: colors.content.onBase.secondary },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.5 },
  });
