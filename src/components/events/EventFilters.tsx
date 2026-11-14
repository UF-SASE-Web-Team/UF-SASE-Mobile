import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MenuView, NativeActionEvent } from '@expo/ui/community/menu';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TAG_LABELS } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, iconSize, radius, space } from '@/theme';
import { EventType } from '@/types/events';

export type TimeFilter = 'upcoming' | 'past' | 'all';
export type TypeFilter = 'all' | Exclude<EventType, 'other'>;

export interface EventFiltersProps {
  timeFilter: TimeFilter;
  typeFilter: TypeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onTypeFilterChange: (filter: TypeFilter) => void;
}

const TIME_OPTIONS: { label: string; value: TimeFilter }[] = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
  { label: 'All', value: 'all' },
];

const TYPE_OPTIONS: { label: string; value: TypeFilter }[] = [
  { label: 'All types', value: 'all' },
  { label: TAG_LABELS.social, value: 'social' },
  { label: TAG_LABELS.career, value: 'career' },
  { label: TAG_LABELS.service, value: 'service' },
  { label: TAG_LABELS.sports, value: 'sports' },
  { label: TAG_LABELS.gbm, value: 'gbm' },
  { label: TAG_LABELS.team, value: 'team' },
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

  const isTimeFiltered = timeFilter !== 'upcoming';
  const isTypeFiltered = typeFilter !== 'all';

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
        <View style={[styles.chip, isTimeFiltered && styles.chipActive]}>
          <Text
            variant="bodySmStrong"
            color={isTimeFiltered ? colors.content.onSaseBlueSubtle.primary : undefined}
            numberOfLines={1}
          >
            {selectedTimeLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={iconSize.sm}
            color={
              isTimeFiltered ? colors.content.onSaseBlueSubtle.primary : colors.content.onBase.brand
            }
          />
        </View>
      </MenuView>

      {/* Type Filter Menu */}
      <MenuView
        onPressAction={({ nativeEvent }: NativeActionEvent) => {
          onTypeFilterChange(nativeEvent.event as TypeFilter);
        }}
        actions={typeActions}
      >
        <View style={[styles.chip, isTypeFiltered && styles.chipActive]}>
          <Text
            variant="bodySmStrong"
            color={isTypeFiltered ? colors.content.onSaseBlueSubtle.primary : undefined}
            numberOfLines={1}
          >
            {selectedTypeLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={iconSize.sm}
            color={
              isTypeFiltered ? colors.content.onSaseBlueSubtle.primary : colors.content.onBase.brand
            }
          />
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
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      paddingHorizontal: space['300'],
      paddingVertical: space['150'],
      gap: space['100'],
      minWidth: 120,
    },
    chipActive: {
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderColor: colors.surface.saseBlueSubtle.primary,
    },
  });
