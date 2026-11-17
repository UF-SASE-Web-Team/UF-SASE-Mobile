import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, iconSize, radius, space, type Colors } from '@/theme';

export type PointsItemProps = {
  title: string;
  date: string;
  category?: string;
  status?: string;
  pointsValue?: number;
  attendanceCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
  stripeColor?: string;
};

export function PointsItem({
  title,
  date,
  category = 'Attendance',
  pointsValue = 1,
  isFirst = false,
  isLast = false,
  stripeColor,
}: PointsItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const parsed = new Date(date);
  const isValidDate = !Number.isNaN(parsed.getTime());
  const month = isValidDate ? parsed.toLocaleDateString('en-US', { month: 'short' }) : '';
  const day = isValidDate ? String(parsed.getDate()).padStart(2, '0') : '';
  const formattedDate = isValidDate ? `${month} ${day}` : date;

  // Resolve point type category: 'Attendance', 'Digital Engagement', 'Commitment', or 'Marketplace'
  const normalizedCategory = category.toLowerCase().trim();
  const resolvedPointType =
    normalizedCategory === 'digital_engagement' || normalizedCategory === 'digital engagement'
      ? 'Digital Engagement'
      : normalizedCategory === 'commitment'
        ? 'Commitment'
        : normalizedCategory === 'marketplace'
          ? 'Marketplace'
          : 'Attendance';

  // Blue for attendance events, gold/yellow for digital engagement, green for commitment, orange for marketplace
  const isDigital = resolvedPointType === 'Digital Engagement';
  const isCommitment = resolvedPointType === 'Commitment';
  const isMarketplace = resolvedPointType === 'Marketplace';

  const resolvedStripeColor =
    stripeColor ??
    (isDigital
      ? colors.surface.warning.primary
      : isCommitment
        ? colors.surface.accent.secondary
        : isMarketplace
          ? colors.surface.accent.primary
          : colors.surface.saseBlue.primary);

  const isZeroPoints = pointsValue === 0;

  return (
    <View
      style={[
        styles.row,
        isFirst && styles.firstRow,
        isLast && styles.lastRow,
        !isLast && styles.dividerRow,
      ]}
      accessible
      accessibilityLabel={`${title}, ${formattedDate}, ${resolvedPointType}, ${pointsValue > 0 ? `plus ${pointsValue}` : pointsValue} points`}
      testID="points-item"
    >
      {/* Left Edge Indicator Stripe */}
      <View
        style={[
          styles.stripe,
          { backgroundColor: resolvedStripeColor },
          isFirst && styles.stripeTop,
          isLast && styles.stripeBottom,
        ]}
      />

      {/* Title & Metadata (Date • Point Type) */}
      <View style={styles.info}>
        <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Text variant="bodySm" style={styles.dateText}>
            {formattedDate}
          </Text>
          <Text variant="bodySm" style={styles.metaDot}>
            •
          </Text>
          <Text variant="bodySm" style={styles.dateText}>
            {resolvedPointType}
          </Text>
        </View>
      </View>

      {/* Points Delta */}
      <View style={styles.pointsContainer}>
        <Ionicons
          name="star"
          size={iconSize.sm}
          color={isZeroPoints ? colors.content.onBase.secondary : colors.content.onBase.brand}
        />
        <Text
          variant="bodyStrong"
          style={[styles.pointsText, isZeroPoints && styles.zeroPointsText]}
        >
          {pointsValue}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface.base.secondary,
      paddingVertical: space['200'],
      paddingHorizontal: space['400'],
      borderLeftWidth: borderWidth.sm,
      borderRightWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      position: 'relative',
      overflow: 'hidden',
    },
    firstRow: {
      borderTopWidth: borderWidth.sm,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    lastRow: {
      borderBottomWidth: borderWidth.sm,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    dividerRow: {
      borderBottomWidth: borderWidth.sm,
      borderBottomColor: colors.border.base.subtle,
    },
    stripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
    },
    stripeTop: {
      borderTopLeftRadius: radius.lg,
    },
    stripeBottom: {
      borderBottomLeftRadius: radius.lg,
    },
    info: {
      flex: 1,
      paddingLeft: space['150'],
      gap: space['050'],
    },
    title: {
      color: colors.content.onBase.primary,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      color: colors.content.onBase.secondary,
    },
    metaDot: {
      color: colors.content.onBase.secondary,
      marginHorizontal: space['150'],
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
      marginLeft: space['200'],
    },
    pointsText: {
      color: colors.content.onBase.primary,
    },
    zeroPointsText: {
      color: colors.content.onBase.secondary,
    },
  });
