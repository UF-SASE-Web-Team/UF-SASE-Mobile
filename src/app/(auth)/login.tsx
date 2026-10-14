import { StyleSheet, Text, TextInput, Alert, Button, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignin = async () => {
    const cleanIdentifier = identifier.trim().toLowerCase();
    if (!cleanIdentifier || !password) {
      Alert.alert('Error', 'Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    let resolvedEmail = cleanIdentifier;
    if (!cleanIdentifier.includes('@')) {
      const { data: targetEmail, error: lookupError } = await supabase.rpc(
        'get_email_from_username',
        { p_username: cleanIdentifier },
      );
      if (lookupError || !targetEmail) {
        setLoading(false);
        Alert.alert('Login failed', 'Invalid username/email or password.');
        return;
      }
      resolvedEmail = targetEmail;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });
    setLoading(false);

    if (signInError) {
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        Alert.alert('Email Unverified', 'Please verify your email before logging in.', [
          {
            text: 'Verify Code',
            onPress: () =>
              router.push({
                pathname: '/(auth)/verify',
                params: { email: resolvedEmail, mode: 'signup' },
              }),
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        Alert.alert('Login failed', 'Invalid username/email or password.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Text style={styles.title}>Welcome to UF SASE</Text>
      {/* <Text style={styles.label}>Email or username</Text> */}
      <TextInput
        placeholder="Email or username"
        autoCapitalize="none"
        autoCorrect={false}
        value={identifier}
        onChangeText={setIdentifier}
        style={styles.input}
      />
      {/* <Text style={styles.label}>Password</Text> */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#666666"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Signing in...' : 'Log in'}
          onPress={handleSignin}
          disabled={loading}
        />
        <Button
          title="Forgot password?"
          onPress={() => router.push({ pathname: '/(auth)/forgot-password' })}
        />
        <Button
          title="Create account"
          onPress={() => router.push({ pathname: '/(auth)/signup' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  buttonContainer: {
    marginTop: 12,
    gap: 8,
  },
});
