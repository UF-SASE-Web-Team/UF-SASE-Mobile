import { StyleSheet, View } from 'react-native';
import { EventTag, TAG_LABELS } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';
import type { EventType } from '@/types/events';

type PointsItemProps = {
  title: string;
  date: string;
  eventType: EventType;
  points: number;
};

export function PointsItem({ title, date, eventType, points }: PointsItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const parsed = new Date(date);
  const month = parsed.toLocaleDateString('en-US', { month: 'short' });
  const day = parsed.getDate();
  const pointsLabel = `${points} ${points === 1 ? 'point' : 'points'}`;
  const category = eventType === 'other' ? null : TAG_LABELS[eventType];

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={[title, category, `${month} ${day}`, pointsLabel]
        .filter(Boolean)
        .join(', ')}
      testID="points-item"
    >
      <View style={styles.date}>
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {month}
        </Text>
        <Text variant="title">{day}</Text>
      </View>

      <View style={styles.info}>
        <Text variant="bodySmStrong" numberOfLines={2}>
          {title}
        </Text>
        <EventTag type={eventType} variant="subtle" style={styles.tag} />
      </View>

      <View style={styles.points}>
        <Text variant="title" color={colors.content.onBase.brand}>
          +{points}
        </Text>
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {points === 1 ? 'pt' : 'pts'}
        </Text>
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
      minWidth: space['1000'],
    },
    info: {
      flex: 1,
      gap: space['100'],
    },
    tag: {
      alignSelf: 'flex-start',
    },
    points: {
      alignItems: 'center',
      minWidth: space['1000'],
    },
  });
