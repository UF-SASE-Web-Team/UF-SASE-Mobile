import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MenuView, NativeActionEvent } from '@expo/ui/community/menu';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, radius, space } from '@/theme';

export type TimeFilter = 'upcoming' | 'past';
export type TypeFilter = 'all' | 'gbm' | 'social' | 'career' | 'team';

export interface EventFiltersProps {
  timeFilter: TimeFilter;
  typeFilter: TypeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onTypeFilterChange: (filter: TypeFilter) => void;
}

const TIME_OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
];

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: 'GBM', value: 'gbm' },
  { label: 'Social', value: 'social' },
  { label: 'Career', value: 'career' },
  { label: 'Team', value: 'team' },
];

export function EventFilters({
  timeFilter,
  typeFilter,
  onTimeFilterChange,
  onTypeFilterChange,
}: EventFiltersProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const selectedTimeLabel = TIME_OPTIONS.find((o) => o.value === timeFilter)?.label ?? 'Upcoming';
  const selectedTypeLabel = TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label ?? 'All types';

  const timeActions = TIME_OPTIONS.map((opt) => ({
    id: opt.value,
    title: opt.label,
    state: (timeFilter === opt.value ? 'on' : 'off') as 'on' | 'off',
  }));

  const typeActions = TYPE_OPTIONS.map((opt) => ({
    id: opt.value,
    title: opt.label,
    state: (typeFilter === opt.value ? 'on' : 'off') as 'on' | 'off',
  }));

  return (
    <View style={styles.container}>
      {/* Time Filter Menu */}
      <MenuView
        onPressAction={({ nativeEvent }: NativeActionEvent) => {
          onTimeFilterChange(nativeEvent.event as TimeFilter);
        }}
        actions={timeActions}
      >
        <View style={styles.chip}>
          <Text variant="bodySmStrong" numberOfLines={1}>
            {selectedTimeLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.content.onBase.primary} />
        </View>
      </MenuView>

      {/* Type Filter Menu */}
      <MenuView
        onPressAction={({ nativeEvent }: NativeActionEvent) => {
          onTypeFilterChange(nativeEvent.event as TypeFilter);
        }}
        actions={typeActions}
      >
        <View style={styles.chip}>
          <Text variant="bodySmStrong" numberOfLines={1}>
            {selectedTypeLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.content.onBase.primary} />
        </View>
      </MenuView>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface.base.primary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      paddingHorizontal: space['300'],
      paddingVertical: space['150'],
      gap: space['100'],
      minWidth: 120,
    },
  });
