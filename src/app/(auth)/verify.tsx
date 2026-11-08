import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { SixDigitInput } from '@/components/SixDigitInput';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useThemedStyles } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { type Colors, space } from '@/theme';

export default function VerifyScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const router = useRouter();
  const { setIsRecovering } = useAuth();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (tokenOverride?: string) => {
    const rawToken = typeof tokenOverride === 'string' ? tokenOverride : token;
    const cleanToken = rawToken.trim();
    if (cleanToken.length !== 6) {
      Alert.alert('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    if (mode === 'recovery') setIsRecovering(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: cleanToken,
      type: mode === 'recovery' ? 'recovery' : 'signup',
    });
    setLoading(false);

    if (error) {
      if (mode === 'recovery') setIsRecovering(false);
      Alert.alert('Verification failed', error.message);
      return;
    }

    if (mode === 'recovery') {
      router.replace('/(auth)/reset-password');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCooldown(60);

    const { error } =
      mode === 'recovery'
        ? await supabase.auth.resetPasswordForEmail(email)
        : await supabase.auth.resend({
            type: 'signup',
            email,
          });

    if (error) {
      Alert.alert('Could not resend code', error.message);
    } else {
      Alert.alert('Sent', 'A new 6-digit confirmation code has been sent.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BackButton
        fallbackRoute={mode === 'recovery' ? '/(auth)/forgot-password' : '/(auth)/signup'}
        style={styles.backButton}
      />

      <Text variant="title" style={styles.title}>
        Check your email
      </Text>

      {mode === 'recovery' ? (
        <Text variant="body" style={styles.instructions}>
          If an account for {email} exists, we&apos;ve sent a 6-digit code.
        </Text>
      ) : (
        <Text variant="body" style={styles.instructions}>
          Enter the 6-digit code sent to {email}.
        </Text>
      )}

      <View style={styles.codeContainer}>
        <SixDigitInput
          value={token}
          onChangeText={setToken}
          onComplete={(code) => handleVerify(code)}
          disabled={loading}
        />
      </View>

      <View style={styles.buttonsContainer}>
        <Button
          variant="primary"
          onPress={() => handleVerify()}
          disabled={loading || token.length !== 6}
          loading={loading}
          accessibilityLabel="Verify"
        >
          Verify
        </Button>

        <Button
          variant="secondary"
          onPress={handleResend}
          disabled={cooldown > 0}
          accessibilityLabel="Resend code"
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
      paddingHorizontal: space['600'],
      paddingVertical: space['400'],
      gap: space['300'],
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: space['100'],
    },
    title: {
      marginBottom: space['100'],
    },
    instructions: {
      color: colors.content.onBase.secondary,
      marginBottom: space['300'],
    },
    codeContainer: {
      alignItems: 'center',
      marginVertical: space['300'],
    },
    buttonsContainer: {
      marginTop: space['200'],
      gap: space['300'],
    },
  });
