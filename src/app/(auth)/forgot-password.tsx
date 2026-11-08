import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { type Colors, space } from '@/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BackButton fallbackRoute="/(auth)/login" style={styles.backButton} />

      <Text variant="title" style={styles.title}>
        Forgot password
      </Text>

      <Text variant="body" style={styles.subtitle}>
        Enter your email and we&apos;ll send a reset code.
      </Text>

      <View style={styles.form}>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
        />

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={handleReset}
            loading={loading}
            accessibilityLabel="Continue"
          >
            Continue
          </Button>
        </View>
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
    subtitle: {
      color: colors.content.onBase.secondary,
      marginBottom: space['300'],
    },
    form: {
      gap: space['400'],
    },
    buttonContainer: {
      marginTop: space['200'],
    },
  });
