import { Pressable, StyleSheet, View } from 'react-native';
import { TAG_LABELS } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, radius, space } from '@/theme';
import type { EventType } from '@/types/events';
import { Constants } from '@/types/supabase';

const label = (type: EventType) => (type === 'other' ? 'Other' : TAG_LABELS[type]);

export function EventTypePicker({
  value,
  onChange,
  disabled,
}: {
  value: EventType;
  onChange: (type: EventType) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.field}>
      <Text variant="bodyStrong">Type</Text>
      <View style={styles.options} accessibilityRole="radiogroup">
        {Constants.public.Enums.event_type.map((type) => {
          const selected = type === value;
          return (
            <Pressable
              key={type}
              accessibilityRole="radio"
              accessibilityLabel={label(type)}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(type)}
              style={[styles.option, selected && styles.selected]}
            >
              <Text
                variant="bodySmStrong"
                color={selected ? colors.content.onSaseBlue.primary : colors.content.onBase.primary}
              >
                {label(type)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    field: { gap: space['150'] },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: space['200'] },
    option: {
      paddingHorizontal: space['300'],
      paddingVertical: space['150'],
      borderRadius: radius.full,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      backgroundColor: colors.surface.base.secondary,
    },
    selected: {
      backgroundColor: colors.surface.saseBlue.primary,
      borderColor: colors.surface.saseBlue.primary,
    },
  });
