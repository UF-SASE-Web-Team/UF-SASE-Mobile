import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { ProfileButton } from './ProfileButton';
import { ProfileSheet } from './ProfileSheet';
import { getProfileError } from '@/context/ProfileContext';
import { reportMember } from '@/services/moderation';
import { useTheme, useThemedStyles, type Colors, iconSize, radius, space } from '@/theme';
import type { ReportReason } from '@/types/moderation';

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate or offensive profile' },
  { value: 'impersonation', label: 'Pretending to be someone else' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Something else' },
];

const maxDetailsLength = 1000;

interface ReportMemberSheetProps {
  memberId: string;
  memberName: string;
  onClose: () => void;
  onReported: () => void;
}

export function ReportMemberSheet({
  memberId,
  memberName,
  onClose,
  onReported,
}: ReportMemberSheetProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const submit = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    try {
      await reportMember(memberId, reason, details);
      onReported();
    } catch (cause) {
      setError(getProfileError(cause, 'Could not send your report. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileSheet title="Report Member" visible onClose={onClose} busy={busy}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text variant="body" color={colors.content.onBase.secondary}>
            Why are you reporting {memberName}? Your report is only shared with UF SASE officers.
          </Text>
          <View accessibilityRole="radiogroup" style={styles.reasons}>
            {reasons.map((option) => {
              const selected = reason === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: selected, disabled: busy }}
                  disabled={busy}
                  onPress={() => setReason(option.value)}
                  style={({ pressed }) => [styles.reason, pressed && styles.pressed]}
                >
                  <Text variant="body" style={styles.reasonLabel}>
                    {option.label}
                  </Text>
                  <Ionicons
                    name={selected ? 'radio-button-on' : 'radio-button-off'}
                    size={iconSize.md}
                    color={
                      selected ? colors.content.onBase.primary : colors.content.onBase.secondary
                    }
                  />
                </Pressable>
              );
            })}
          </View>
          <Input
            accessibilityLabel="Report details"
            placeholder="Add details (optional)"
            value={details}
            onChangeText={setDetails}
            maxLength={maxDetailsLength}
            editable={!busy}
            multiline
            containerStyle={styles.details}
          />
          {error && (
            <Text variant="bodySm" accessibilityRole="alert" color={colors.content.onBase.primary}>
              {error}
            </Text>
          )}
          <ProfileButton
            title={busy ? 'Sending Report...' : 'Send Report'}
            onPress={submit}
            loading={busy}
            disabled={!reason}
          />
        </View>
      </ScrollView>
    </ProfileSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    content: { gap: space['400'] },
    reasons: {
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    reason: {
      minHeight: space['1200'],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space['300'],
      paddingHorizontal: space['400'],
      paddingVertical: space['250'],
    },
    reasonLabel: { flexShrink: 1 },
    details: { borderRadius: radius.lg },
    pressed: { opacity: 0.7 },
  });
