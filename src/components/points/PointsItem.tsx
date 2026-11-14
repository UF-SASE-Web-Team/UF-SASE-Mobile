import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { iconSize, radius, space, type Colors } from '@/theme';

type PointsItemProps = {
  title: string;
  date: string;
  category: string;
  status?: string;
};

export function PointsItem({
  title,
  date,
  category,
  status = 'attendance confirmed',
}: PointsItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const parsed = new Date(date);
  const month = parsed.toLocaleDateString('en-US', { month: 'short' });
  const day = parsed.getDate();

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${title}, ${category}, ${month} ${day}, ${status}`}
      testID="points-item"
    >
      <View style={styles.date}>
        <Text variant="bodySm">{month}</Text>
        <Text variant="title">{day}</Text>
      </View>

      <View style={styles.info}>
        <Text variant="bodySmStrong" numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.row}>
          <View style={styles.pill}>
            <Text variant="bodySmStrong" color={colors.content.onAccentSubtle.primary}>
              {category}
            </Text>
          </View>
          <Text variant="bodySm" color={colors.content.onBase.secondary}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.check}>
        <Ionicons name="checkmark" size={iconSize.md} color={colors.content.onMedia.primary} />
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.xl,
      paddingVertical: space['300'],
      paddingHorizontal: space['400'],
      gap: space['300'],
    },
    date: {
      alignItems: 'center',
      width: 36,
    },
    info: {
      flex: 1,
      gap: space['100'],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    pill: {
      backgroundColor: colors.surface.accentSubtle.primary,
      borderRadius: radius.full,
      paddingHorizontal: space['300'],
      paddingVertical: space['050'],
    },
    check: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: colors.surface.success.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
