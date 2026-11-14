import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { SixDigitInput } from '@/components/ui/SixDigitInput';
import { ProfileSheet } from './ProfileSheet';
import { ProfileButton } from './ProfileButton';
import { getProfileError } from '@/context/ProfileContext';
import {
  sendPasswordResetEmail,
  updatePassword,
  verifyPasswordResetCode,
} from '@/services/profiles';
import { useThemedStyles, type Colors, radius, space, textStyles } from '@/theme';

export function PasswordResetSheet({ email, onClose }: { email: string; onClose: () => void }) {
  const [step, setStep] = useState<'code' | 'password'>('code');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const verify = async () => {
    if (busy || token.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await verifyPasswordResetCode(email, token);
      setStep('password');
    } catch (cause) {
      setError(getProfileError(cause, 'Could not verify this code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await sendPasswordResetEmail(email);
      setCooldown(60);
      setToken('');
    } catch (cause) {
      setError(getProfileError(cause, 'Could not resend your code.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Use at least 8 characters, including letters and numbers.');
      return;
    }
    if (password !== confirmation) {
      setError('Your passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      Alert.alert('Password updated', 'Your new password is ready to use.');
      onClose();
    } catch (cause) {
      setError(getProfileError(cause, 'Could not update your password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileSheet
      title={step === 'code' ? 'Check your email' : 'Reset Password'}
      visible
      onClose={onClose}
      busy={busy}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        {step === 'code' ? (
          <>
            <Text variant="body">Enter the 6-digit password reset code sent to {email}.</Text>
            <SixDigitInput value={token} onChangeText={setToken} disabled={busy} />
            <ProfileButton
              title={busy ? 'Verifying...' : 'Verify Code'}
              onPress={verify}
              disabled={token.length !== 6}
              loading={busy}
            />
            <ProfileButton
              title={cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
              onPress={resend}
              variant="secondary"
              disabled={cooldown > 0 || busy}
            />
          </>
        ) : (
          <>
            <Text variant="body">Use at least 8 characters, including letters and numbers.</Text>
            <View style={styles.field}>
              <Text variant="bodyStrong">New Password</Text>
              <Input
                accessibilityLabel="New password"
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                editable={!busy}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text variant="bodyStrong">Confirm Password</Text>
              <Input
                accessibilityLabel="Confirm new password"
                placeholder="Confirm new password"
                value={confirmation}
                onChangeText={setConfirmation}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                editable={!busy}
                style={styles.input}
              />
            </View>
            <ProfileButton
              title={busy ? 'Updating Password...' : 'Update Password'}
              onPress={submit}
              loading={busy}
            />
          </>
        )}
        {error && (
          <Text variant="bodySm" accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}
      </ScrollView>
    </ProfileSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    content: { gap: space['400'] },
    field: { gap: space['200'] },
    input: {
      ...textStyles.body,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.md,
      padding: space['300'],
    },
    error: { color: colors.surface.danger.primary },
  });
