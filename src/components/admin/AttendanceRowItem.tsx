import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { formStatusLabel, formStatusTone } from '@/lib/formStatus';
import { type Colors, borderWidth, radius, space } from '@/theme';
import type { AttendanceRow } from '@/types/admin';

const timeFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const METHOD_LABELS = { code: 'Code', qr: 'QR', manual: 'Added by officer' } as const;

export function AttendanceRowItem({
  row,
  onResend,
  resending,
}: {
  row: AttendanceRow;
  onResend: () => void;
  resending: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {row.full_name}
        </Text>
        <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
          {row.username ? `@${row.username} · ` : ''}
          {timeFormat.format(new Date(row.checked_in_at))} · {METHOD_LABELS[row.method]}
        </Text>
      </View>
      <View style={styles.status}>
        <Pill
          label={formStatusLabel(row.form_status, row.form_submit_error)}
          tone={formStatusTone(row.form_status)}
          variant="subtle"
        />
        {row.form_status === 'failed' ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={onResend}
            loading={resending}
            disabled={resending}
            accessibilityLabel={`Resend form for ${row.full_name}`}
          >
            Resend
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      padding: space['300'],
      borderRadius: radius.md,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      backgroundColor: colors.surface.base.secondary,
    },
    copy: { flex: 1, gap: space['050'] },
    status: { alignItems: 'flex-end', gap: space['100'] },
  });
