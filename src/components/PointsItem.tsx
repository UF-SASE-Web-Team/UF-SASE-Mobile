import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@/context/ThemeContext';
import { space, type Colors } from '@/theme';

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
        <Text style={styles.month}>{month}</Text>
        <Text style={styles.day}>{day}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.row}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{category}</Text>
          </View>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      <View style={styles.check}>
        <Ionicons name="checkmark" size={26} color="#FFFFFF" />
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
      borderRadius: 30,
      paddingVertical: space['300'],
      paddingHorizontal: space['400'],
      gap: space['300'],
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    date: {
      alignItems: 'center',
      width: 36,
    },
    month: {
      fontSize: 14,
      color: colors.surface.saseBlue.secondary,
    },
    day: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.surface.saseBlue.secondary,
    },
    info: {
      flex: 1,
      gap: space['100'],
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.surface.saseBlue.secondary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    pill: {
      backgroundColor: '#FBE3E3',
      borderRadius: 30,
      paddingHorizontal: space['300'],
      paddingVertical: 2,
    },
    pillText: {
      fontSize: 13,
      color: '#C0392B',
    },
    status: {
      fontSize: 13,
      color: colors.surface.saseBlue.secondary,
    },
    check: {
      width: 48,
      height: 48,
      borderRadius: 30,
      backgroundColor: '#8BC34A',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
