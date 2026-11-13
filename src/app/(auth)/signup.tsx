import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { legalLinks } from '@/lib/links';
import { supabase } from '@/lib/supabase';
import { discardUnverifiedSignup, suggestUsername } from '@/services/auth';
import { type Colors, iconSize, space } from '@/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/;
const MIN_PASSWORD_LENGTH = 8;

function openLegalLink(url: string) {
  Linking.openURL(url).catch(() =>
    Alert.alert('Could not open link', `Please visit ${url} in your browser.`),
  );
}

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
  const [isSuggesting, setIsSuggesting] = useState(false);

  // The email the server last rejected as already registered
  const [takenEmail, setTakenEmail] = useState<string | null>(null);

  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Field refs to smoothly focus the first broken field on submit
  const emailInputRef = useRef<any>(null);
  const passwordInputRef = useRef<any>(null);
  const nameInputRef = useRef<any>(null);
  const usernameInputRef = useRef<any>(null);

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
    if (serverCheck.evaluatedUsername === cleanUsername && serverCheck.isAvailable === true) {
      return;
    }

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
  }, [
    cleanUsername,
    isUsernameFormatValid,
    serverCheck.evaluatedUsername,
    serverCheck.isAvailable,
  ]);

  const handleSuggestUsername = async () => {
    if (isSuggesting) return;
    try {
      setIsSuggesting(true);
      const suggested = await suggestUsername();
      const cleanSuggested = suggested.trim().toLowerCase();
      setUsername(cleanSuggested);
      setServerCheck({
        evaluatedUsername: cleanSuggested,
        isAvailable: true,
        networkError: false,
      });
    } catch {
      Alert.alert(
        'Suggestion Failed',
        'Could not generate a suggested username. Please try again or type one manually.',
      );
    } finally {
      setIsSuggesting(false);
    }
  };

  const isEmailTakenError = (error: any) => {
    const msg = error?.message?.toLowerCase() ?? '';
    return msg.includes('already registered') || msg.includes('already exists');
  };

  const getReadableErrorMessage = (error: any) => {
    const msg = error?.message?.toLowerCase() ?? '';
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
    await discardUnverifiedSignup(cleanEmail).catch(() => undefined);
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

    // With email confirmation on, Supabase hides existing accounts behind a
    // fake success: a user with no identities and no error.
    const isEmailTaken = error ? isEmailTakenError(error) : data.user?.identities?.length === 0;

    if (isEmailTaken) {
      setTakenEmail(cleanEmail);
      emailInputRef.current?.focus();
      return;
    }

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

  // --- Field Errors ---
  const emailError =
    takenEmail !== null && cleanEmail === takenEmail
      ? 'That email is already being used. Try logging in instead.'
      : (touched.email || hasSubmitted) && !isEmailValid
        ? 'Please enter a valid email address.'
        : undefined;

  const passwordError =
    (touched.password || hasSubmitted) && !isPasswordValid
      ? 'Must be at least 8 characters with letters and numbers.'
      : undefined;

  const fullNameError =
    (touched.fullName || hasSubmitted) && !cleanFullName
      ? 'Please enter your full name.'
      : undefined;

  const usernameError = useMemo(() => {
    if (!(touched.username || hasSubmitted)) return undefined;
    if (usernameStatus === 'taken') return 'Username is already taken.';
    if (usernameStatus === 'invalid')
      return '3-20 letters, numbers, . or _. Must start with a letter.';
    if (usernameStatus === 'error') return 'Could not verify username. Check connection.';
    return undefined;
  }, [touched.username, hasSubmitted, usernameStatus]);

  const renderUsernameRightIcon = () => {
    if (isSuggesting) {
      return (
        <View style={styles.iconButton} accessibilityLabel="Generating suggested username">
          <ActivityIndicator size="small" color={colors.content.onBase.secondary} />
        </View>
      );
    }
    if (usernameStatus === 'checking') {
      return (
        <View style={styles.iconButton}>
          <ActivityIndicator size="small" color={colors.content.onBase.secondary} />
        </View>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <View style={styles.iconButton} accessibilityLabel="Username available">
          <Ionicons
            name="checkmark-circle"
            size={iconSize.md}
            color={colors.border.success.primary}
          />
        </View>
      );
    }
    if (username.length > 0) {
      return (
        <TouchableOpacity
          onPress={() => setUsername('')}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Clear username"
          accessibilityRole="button"
        >
          <Ionicons
            name="close-outline"
            size={iconSize.md}
            color={colors.content.onBase.secondary}
          />
        </TouchableOpacity>
      );
    }
    return null;
  };

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
          <BackButton fallbackRoute="/(auth)/login" style={styles.backButton} />

          <Text variant="title" style={styles.title}>
            Get started
          </Text>

          <View style={styles.form}>
            {/* Email */}
            <Input
              ref={emailInputRef}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              onBlur={() => markTouched('email')}
              icon="mail-outline"
              error={emailError}
              rightIcon={
                email.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setEmail('')}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Clear email"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="close-outline"
                      size={iconSize.md}
                      color={colors.content.onBase.secondary}
                    />
                  </TouchableOpacity>
                ) : null
              }
            />

            {/* Password */}
            <Input
              ref={passwordInputRef}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              onBlur={() => markTouched('password')}
              icon="key-outline"
              error={passwordError}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.iconButton}
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

            {/* Full Name */}
            <Input
              ref={nameInputRef}
              placeholder="Full name"
              value={fullName}
              autoCorrect={false}
              autoCapitalize="words"
              textContentType="name"
              onChangeText={setFullName}
              onBlur={() => markTouched('fullName')}
              icon="person-outline"
              error={fullNameError}
              rightIcon={
                fullName.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setFullName('')}
                    style={styles.iconButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Clear full name"
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name="close-outline"
                      size={iconSize.md}
                      color={colors.content.onBase.secondary}
                    />
                  </TouchableOpacity>
                ) : null
              }
            />

            {/* Username */}
            <View style={styles.usernameGroup}>
              <Input
                ref={usernameInputRef}
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                value={username}
                onChangeText={setUsername}
                onBlur={() => markTouched('username')}
                icon="at-outline"
                error={usernameError}
                rightIcon={renderUsernameRightIcon()}
              />
              <TouchableOpacity
                onPress={handleSuggestUsername}
                disabled={isSuggesting}
                style={styles.suggestButton}
                accessibilityLabel="Suggest username"
                accessibilityRole="button"
              >
                <Ionicons
                  name="sparkles-outline"
                  size={iconSize.sm}
                  color={colors.surface.saseBlue.primary}
                />
                <Text variant="bodySmStrong" style={styles.suggestButtonText}>
                  {isSuggesting ? 'Generating...' : 'Suggest username'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              onPress={handleSignup}
              loading={loading}
              accessibilityLabel="Create account"
            >
              Create account
            </Button>
            <Text variant="bodySm" style={styles.legalNotice}>
              By creating an account, you agree to the{' '}
              <Text
                variant="bodySmStrong"
                accessibilityRole="link"
                onPress={() => openLegalLink(legalLinks.terms)}
                style={styles.legalLink}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                variant="bodySmStrong"
                accessibilityRole="link"
                onPress={() => openLegalLink(legalLinks.privacy)}
                style={styles.legalLink}
              >
                Privacy Policy
              </Text>
              .
            </Text>
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
    iconButton: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    usernameGroup: {
      gap: space['150'],
    },
    suggestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
      alignSelf: 'flex-start',
      paddingVertical: space['050'],
      paddingHorizontal: space['300'],
    },
    suggestButtonText: {
      color: colors.surface.saseBlue.primary,
    },
    buttonContainer: {
      marginTop: space['200'],
      gap: space['300'],
    },
    legalNotice: {
      color: colors.content.onBase.secondary,
      textAlign: 'center',
    },
    legalLink: {
      color: colors.content.onBase.primary,
      textDecorationLine: 'underline',
    },
  });
