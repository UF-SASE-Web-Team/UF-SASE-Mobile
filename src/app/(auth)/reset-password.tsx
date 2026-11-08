import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { type Colors, iconSize, space } from '@/theme';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const router = useRouter();
  const { setIsRecovering, signOut } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    return () => {
      // If the screen is abandoned without completing password update, sign out immediately
      if (!isCompletedRef.current) {
        signOut().catch(() => {});
      }
    };
  }, [signOut]);

  // Validate format: min 8 characters with letters & digits
  const isPasswordValid = useMemo(() => {
    return (
      password.length >= MIN_PASSWORD_LENGTH && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
    );
  }, [password]);

  const doPasswordsMatch = password === confirmPassword;

  const handleUpdatePassword = async () => {
    setHasSubmitted(true);

    if (!isPasswordValid) {
      Alert.alert(
        'Invalid Password',
        'Password must be at least 8 characters with both letters and numbers.',
      );
      return;
    }

    if (!doPasswordsMatch) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Update failed', error.message);
      return;
    }

    isCompletedRef.current = true;
    setIsRecovering(false);

    Alert.alert('Success', 'Your password has been updated.', [
      {
        text: 'Continue',
        onPress: () => router.replace('/(tabs)'),
      },
    ]);
  };

  const handleCancel = async () => {
    isCompletedRef.current = true;
    await signOut();
    router.replace('/(auth)/login');
  };

  const passwordError =
    (touched.password || hasSubmitted) && !isPasswordValid
      ? 'Must be at least 8 characters with letters and numbers.'
      : undefined;

  const confirmPasswordError =
    (touched.confirmPassword || hasSubmitted) && !doPasswordsMatch
      ? 'Passwords do not match.'
      : undefined;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton
            onPress={handleCancel}
            accessibilityLabel="Cancel password reset"
            style={styles.backButton}
          />

          <Text variant="title" style={styles.title}>
            Set new password
          </Text>

          <View style={styles.form}>
            {/* New Password */}
            <Input
              placeholder="New password"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              onBlur={() => markTouched('password')}
              icon="key-outline"
              error={passwordError}
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

            {/* Confirm Password */}
            <Input
              placeholder="Confirm new password"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => markTouched('confirmPassword')}
              icon="key-outline"
              error={confirmPasswordError}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              onPress={handleUpdatePassword}
              loading={loading}
              accessibilityLabel="Update password"
            >
              Update password
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: space['600'],
      paddingVertical: space['400'],
      gap: space['400'],
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: space['100'],
    },
    title: {
      marginBottom: space['200'],
    },
    form: {
      gap: space['400'],
    },
    eyeIcon: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      marginTop: space['200'],
    },
  });
