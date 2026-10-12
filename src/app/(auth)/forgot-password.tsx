import { StyleSheet, Text, TextInput, Alert, Button, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert('Validation Error', 'Please enter your email.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    setLoading(false);

    if (error) {
      Alert.alert('Could not send code', error.message);
      return;
    }

    router.push({
      pathname: '/(auth)/verify',
      params: { email: cleanEmail, mode: 'recovery' },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
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
      <Text style={styles.title}>Forgot password</Text>
      <Text>Enter your email and we&apos;ll send a reset code.</Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Button
        title={loading ? 'Sending code...' : 'Continue'}
        onPress={handleReset}
        disabled={loading}
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
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 10,
  },
});
