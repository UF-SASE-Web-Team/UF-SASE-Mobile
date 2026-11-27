import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, iconSize, radius, space } from '@/theme';
import type { AdminEventSummary } from '@/types/admin';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function AdminEventRow({
  event,
  onPress,
}: {
  event: AdminEventSummary;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const checkIns = `${event.checkInCount} check-in${event.checkInCount === 1 ? '' : 's'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${dateFormat.format(new Date(event.startsAt))}, ${checkIns}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.copy}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {event.title}
        </Text>
        <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
          {dateFormat.format(new Date(event.startsAt))} · {event.locationName}
        </Text>
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {checkIns}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={iconSize.sm} color={colors.content.onBase.secondary} />
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      padding: space['400'],
      borderRadius: radius.md,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      backgroundColor: colors.surface.base.secondary,
    },
    pressed: { opacity: 0.7 },
    copy: { flex: 1, gap: space['050'] },
  });
