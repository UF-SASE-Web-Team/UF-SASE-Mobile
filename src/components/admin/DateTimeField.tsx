import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, radius, space } from '@/theme';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (value: Date) => void;
  error?: string;
  disabled?: boolean;
}

/** A date and a time picker side by side: inline on iOS, dialogs on Android. */
export function DateTimeField({ label, value, onChange, error, disabled }: DateTimeFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const openAndroid = (mode: 'date' | 'time') =>
    DateTimePickerAndroid.open({
      value,
      mode,
      onChange: (event, picked) => {
        if (event.type === 'set' && picked) onChange(picked);
      },
    });

  return (
    <View style={styles.field}>
      <Text variant="bodyStrong">{label}</Text>
      <View style={styles.pickers}>
        {Platform.OS === 'ios' ? (
          <>
            <DateTimePicker
              value={value}
              mode="date"
              display="compact"
              disabled={disabled}
              accessibilityLabel={`${label} date`}
              onChange={(_, picked) => picked && onChange(picked)}
            />
            <DateTimePicker
              value={value}
              mode="time"
              display="compact"
              minuteInterval={5}
              disabled={disabled}
              accessibilityLabel={`${label} time`}
              onChange={(_, picked) => picked && onChange(picked)}
            />
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label} date`}
              disabled={disabled}
              onPress={() => openAndroid('date')}
              style={styles.chip}
            >
              <Text variant="body">{dateFormat.format(value)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label} time`}
              disabled={disabled}
              onPress={() => openAndroid('time')}
              style={styles.chip}
            >
              <Text variant="body">{timeFormat.format(value)}</Text>
            </Pressable>
          </>
        )}
      </View>
      {error ? (
        <Text variant="bodySm" color={colors.border.danger.primary} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    field: { gap: space['150'] },
    pickers: { flexDirection: 'row', alignItems: 'center', gap: space['200'] },
    chip: {
      paddingHorizontal: space['300'],
      paddingVertical: space['200'],
      borderRadius: radius.sm,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      backgroundColor: colors.surface.base.secondary,
    },
  });
