import {
  StyleSheet,
  Text,
  TextInput,
  Alert,
  Button,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const router = useRouter();
  const { setIsRecovering, signOut } = useAuth();
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Cancel password reset"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.title}>Set new password</Text>
          {/* <Text style={styles.subtitle}> */}
          {/* Create a new password that is at least 8 characters long. */}
          {/* </Text> */}

          {/* New Password */}
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="New password"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#666666"
              />
            </TouchableOpacity>
          </View>
          {hasSubmitted && !isPasswordValid && (
            <Text style={[styles.statusText, styles.statusError]}>
              Must be at least 8 characters with letters and numbers.
            </Text>
          )}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Confirm new password"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoCapitalize="none"
              autoCorrect={false}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />
          </View>
          {hasSubmitted && !doPasswordsMatch && (
            <Text style={[styles.statusText, styles.statusError]}>Passwords do not match.</Text>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Updating password...' : 'Update password'}
              onPress={handleUpdatePassword}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 12,
    marginTop: -4,
    marginBottom: 4,
  },
  statusError: {
    color: '#dc2626',
  },
  buttonContainer: {
    marginTop: 16,
  },
});
