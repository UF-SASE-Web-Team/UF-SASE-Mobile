import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { discardUnverifiedSignup, suggestUsername } from '@/services/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/;
const MIN_PASSWORD_LENGTH = 8;

export function useSignupForm() {
  const router = useRouter();

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

  return {
    fullName,
    setFullName,
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    hasSubmitted,
    touched,
    markTouched,
    cleanEmail,
    cleanUsername,
    cleanFullName,
    isEmailValid,
    isUsernameFormatValid,
    isPasswordValid,
    usernameStatus,
    isSuggesting,
    takenEmail,
    setTakenEmail,
    emailInputRef,
    passwordInputRef,
    nameInputRef,
    usernameInputRef,
    handleSuggestUsername,
    handleSignup,
  };
}
