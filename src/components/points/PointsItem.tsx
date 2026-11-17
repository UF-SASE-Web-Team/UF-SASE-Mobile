import { StyleSheet, View } from 'react-native';
import { EventTag, TAG_LABELS } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { spellPoints } from '@/lib/points';
import { borderWidth, radius, space, type Colors } from '@/theme';
import type { EventType } from '@/types/events';

type PointsItemProps = {
  title: string;
  date: string;
  eventType: EventType;
  points: number;
};

/** A check-in on the points log. Mirrors EventCard so attended events look the same everywhere. */
export function PointsItem({ title, date, eventType, points }: PointsItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const parsed = new Date(date);
  const month = parsed.toLocaleDateString('en-US', { month: 'short' });
  const day = parsed.getDate();
  const category = eventType === 'other' ? null : TAG_LABELS[eventType];

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={[title, category, `${month} ${day}`, spellPoints(points)]
        .filter(Boolean)
        .join(', ')}
      testID="points-item"
    >
      <View style={styles.dateColumn}>
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {month}
        </Text>
        <Text variant="title" color={colors.content.onBase.secondary}>
          {day}
        </Text>
      </View>

      <View style={styles.infoColumn}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {title}
        </Text>
        {category ? (
          <View style={styles.detailsRow}>
            <EventTag type={eventType} />
          </View>
        ) : null}
      </View>

      <View style={styles.pointsChip}>
        <Text variant="bodyStrong" numberOfLines={1}>
          +{points}
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
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.lg,
      paddingVertical: space['200'],
      paddingHorizontal: space['250'],
    },
    dateColumn: {
      minWidth: space['1000'],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: space['300'],
    },
    infoColumn: {
      flex: 1,
      justifyContent: 'center',
      marginRight: space['300'],
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: space['100'],
    },
    pointsChip: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.primary,
      paddingHorizontal: space['300'],
      paddingVertical: space['150'],
    },
  });
