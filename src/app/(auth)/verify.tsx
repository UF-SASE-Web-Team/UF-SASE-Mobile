import { StyleSheet, Text, Alert, Button, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SixDigitInput } from '@/components/SixDigitInput';
import { useAuth } from '@/context/AuthContext';

export default function VerifyScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode: string }>();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const router = useRouter();
  const { setIsRecovering } = useAuth();

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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(mode === 'recovery' ? '/(auth)/forgot-password' : '/(auth)/signup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>
      <Text style={styles.title}>Check your email</Text>
      {mode === 'recovery' ? (
        <Text>If an account for {email} exists, we&apos;ve sent a 6-digit code.</Text>
      ) : (
        <Text>Enter the 6-digit code sent to {email}.</Text>
      )}
      <SixDigitInput
        value={token}
        onChangeText={setToken}
        onComplete={(code) => handleVerify(code)}
        disabled={loading}
      />
      <Button
        title={loading ? 'Verifying...' : 'Verify'}
        onPress={() => handleVerify()}
        disabled={loading || token.length !== 6}
      />
      <Button
        title={cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        onPress={handleResend}
        disabled={cooldown > 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
});
