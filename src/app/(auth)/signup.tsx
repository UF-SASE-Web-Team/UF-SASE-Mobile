import {
  StyleSheet,
  Text,
  TextInput,
  Alert,
  Button,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form submission attempt tracker
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Track blurred fields so we don't nag users while actively typing
  const [touched, setTouched] = useState({
    fullName: false,
    username: false,
    email: false,
    password: false,
  });

  const markTouched = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Async username validation state
  const [serverCheck, setServerCheck] = useState<{
    evaluatedUsername: string;
    isAvailable: boolean | null;
    networkError: boolean;
  }>({
    evaluatedUsername: '',
    isAvailable: null,
    networkError: false,
  });
  const [isRequestInFlight, setIsRequestInFlight] = useState(false);

  const router = useRouter();

  // Field refs to smoothly focus the first broken field on submit
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);

  // --- Synchronous Derived State ---
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();
  const cleanFullName = fullName.trim();

  const isEmailValid = useMemo(() => EMAIL_REGEX.test(cleanEmail), [cleanEmail]);

  const isUsernameFormatValid = useMemo(() => {
    return (
      cleanUsername.length >= 3 && cleanUsername.length <= 20 && USERNAME_REGEX.test(cleanUsername)
    );
  }, [cleanUsername]);

  const usernameStatus: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error' =
    useMemo(() => {
      if (!cleanUsername) return 'idle';
      if (!isUsernameFormatValid) return 'invalid';

      if (isRequestInFlight || serverCheck.evaluatedUsername !== cleanUsername) {
        return 'checking';
      }
      if (serverCheck.networkError) return 'error';
      if (serverCheck.isAvailable === true) return 'available';
      if (serverCheck.isAvailable === false) return 'taken';
      return 'idle';
    }, [cleanUsername, isUsernameFormatValid, isRequestInFlight, serverCheck]);

  const isPasswordValid = useMemo(() => {
    return (
      password.length >= MIN_PASSWORD_LENGTH && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
    );
  }, [password]);

  // Debounced Supabase RPC call
  useEffect(() => {
    if (!cleanUsername || !isUsernameFormatValid) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      if (isMounted) setIsRequestInFlight(true);

      const { data: isAvailable, error } = await supabase.rpc('check_username_available', {
        input_username: cleanUsername,
      });

      if (!isMounted) return;

      setIsRequestInFlight(false);
      setServerCheck({
        evaluatedUsername: cleanUsername,
        isAvailable: error ? null : Boolean(isAvailable),
        networkError: Boolean(error),
      });
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cleanUsername, isUsernameFormatValid]);

  const getReadableErrorMessage = (error: any) => {
    const msg = error?.message?.toLowerCase() ?? '';
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'An account with this email already exists. Try logging in.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Unable to reach the server. Please check your internet connection.';
    }
    if (msg.includes('rate limit') || error?.status === 429) {
      return 'Too many sign-up attempts. Please wait a minute before trying again.';
    }
    return error.message ?? 'An unexpected error occurred. Please try again.';
  };

  const handleSignup = async () => {
    setHasSubmitted(true);

    // Focus and alert the first failing field
    if (!cleanEmail || !isEmailValid) {
      emailInputRef.current?.focus();
      return;
    }
    if (!password || !isPasswordValid) {
      passwordInputRef.current?.focus();
      return;
    }
    if (!cleanFullName) {
      nameInputRef.current?.focus();
      return;
    }
    if (usernameStatus === 'checking') {
      Alert.alert('Please wait', 'Still checking username availability...');
      return;
    }
    if (usernameStatus !== 'available') {
      usernameInputRef.current?.focus();
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign-up failed', getReadableErrorMessage(error));
      return;
    }

    if (!data.session) {
      router.push({
        pathname: '/(auth)/verify',
        params: { email: cleanEmail, mode: 'signup' },
      });
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>

          <Text style={styles.title}>Get started</Text>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View
            style={[
              styles.inputContainer,
              (touched.email || hasSubmitted) && !isEmailValid && styles.inputErrorBorder,
            ]}
          >
            <TextInput
              ref={emailInputRef}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              onBlur={() => markTouched('email')}
              style={styles.input}
            />
            {email.length > 0 && (
              <TouchableOpacity
                onPress={() => setEmail('')}
                style={styles.clearIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-outline" size={22} color="#999999" />
              </TouchableOpacity>
            )}
          </View>
          {(touched.email || hasSubmitted) && !isEmailValid && (
            <Text style={[styles.statusText, styles.statusError]}>
              Please enter a valid email address.
            </Text>
          )}

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View
            style={[
              styles.inputContainer,
              (touched.password || hasSubmitted) && !isPasswordValid && styles.inputErrorBorder,
            ]}
          >
            <TextInput
              ref={passwordInputRef}
              placeholder="Password"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              onBlur={() => markTouched('password')}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
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
          {(touched.password || hasSubmitted) && !isPasswordValid && (
            <Text style={[styles.statusText, styles.statusError]}>
              Must be at least 8 characters with letters and numbers.
            </Text>
          )}

          {/* Full Name */}
          <Text style={styles.label}>Name</Text>
          <View
            style={[
              styles.inputContainer,
              (touched.fullName || hasSubmitted) && !cleanFullName && styles.inputErrorBorder,
            ]}
          >
            <TextInput
              ref={nameInputRef}
              placeholder="Full name"
              value={fullName}
              autoCorrect={false}
              autoCapitalize="words"
              textContentType="name"
              onChangeText={setFullName}
              onBlur={() => markTouched('fullName')}
              style={styles.input}
            />
            {fullName.length > 0 && (
              <TouchableOpacity
                onPress={() => setFullName('')}
                style={styles.clearIcon}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-outline" size={22} color="#999999" />
              </TouchableOpacity>
            )}
          </View>
          {(touched.fullName || hasSubmitted) && !cleanFullName && (
            <Text style={[styles.statusText, styles.statusError]}>
              Please enter your full name.
            </Text>
          )}

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <View
            style={[
              styles.inputContainer,
              (touched.username || hasSubmitted) &&
                usernameStatus !== 'available' &&
                usernameStatus !== 'idle' &&
                usernameStatus !== 'checking' &&
                styles.inputErrorBorder,
            ]}
          >
            <TextInput
              ref={usernameInputRef}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              value={username}
              onChangeText={setUsername}
              onBlur={() => markTouched('username')}
              style={styles.input}
            />
            {usernameStatus === 'checking' && (
              <View style={styles.indicatorIcon}>
                <ActivityIndicator size="small" color="#666666" />
              </View>
            )}
            {usernameStatus === 'available' && (
              <View style={styles.indicatorIcon} accessibilityLabel="Username available">
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              </View>
            )}
            {username.length > 0 &&
              usernameStatus !== 'checking' &&
              usernameStatus !== 'available' && (
                <TouchableOpacity
                  onPress={() => setUsername('')}
                  style={styles.clearIcon}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-outline" size={22} color="#999999" />
                </TouchableOpacity>
              )}
          </View>

          {(touched.username || hasSubmitted) && (
            <>
              {usernameStatus === 'taken' && (
                <Text style={[styles.statusText, styles.statusError]}>
                  Username is already taken.
                </Text>
              )}
              {usernameStatus === 'invalid' && (
                <Text style={[styles.statusText, styles.statusError]}>
                  3-20 letters, numbers, . or _. Must start with a letter.
                </Text>
              )}
              {usernameStatus === 'error' && (
                <Text style={[styles.statusText, styles.statusError]}>
                  Could not verify username. Check connection.
                </Text>
              )}
            </>
          )}

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Creating account...' : 'Create account'}
              onPress={handleSignup}
              disabled={loading} // Only disabled when in-flight request is running
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
    gap: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
  },
  inputErrorBorder: {
    borderColor: '#dc2626',
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  clearIcon: {
    paddingHorizontal: 8,
  },
  indicatorIcon: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 12,
    marginTop: -2,
    marginBottom: 4,
    color: '#666666',
  },
  statusError: {
    color: '#dc2626',
  },
  buttonContainer: {
    marginTop: 16,
    gap: 8,
  },
});
