import { StyleSheet, Alert, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { Input } from '@/components/Input';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, iconSize, space } from '@/theme';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

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
        if (lookupError) {
          console.error('Username lookup error:', lookupError);
        }
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
      console.error('Sign-in error:', signInError);
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
      <BackButton fallbackRoute="/(auth)" style={styles.backButton} />

      <Text variant="title" style={styles.title}>
        Welcome back
      </Text>

      <View style={styles.form}>
        <Input
          placeholder="Email or username"
          autoCapitalize="none"
          autoCorrect={false}
          value={identifier}
          onChangeText={setIdentifier}
          icon="person-outline"
        />

        <Input
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
          icon="key-outline"
          rightIcon={
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={iconSize.md}
                color={colors.content.onBase.secondary}
              />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(auth)/forgot-password' })}
          style={styles.forgotPasswordButton}
          accessibilityRole="button"
          accessibilityLabel="Forgot password?"
        >
          <Text variant="bodySmStrong" style={styles.forgotPasswordText}>
            Forgot password?
          </Text>
        </TouchableOpacity>

        <Button
          variant="primary"
          onPress={handleSignin}
          loading={loading}
          style={styles.loginButton}
        >
          {loading ? 'Signing in...' : 'Log in'}
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
      paddingTop: space['300'],
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: space['400'],
    },
    title: {
      marginBottom: space['600'],
    },
    form: {
      gap: space['400'],
    },
    eyeIcon: {
      paddingHorizontal: space['100'],
    },
    forgotPasswordButton: {
      paddingHorizontal: space['300'],
    },
    forgotPasswordText: {
      color: colors.surface.saseBlue.primary,
    },
    loginButton: {
      marginTop: space['200'],
    },
  });
