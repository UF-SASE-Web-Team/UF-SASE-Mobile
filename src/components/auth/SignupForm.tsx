import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useSignupForm } from '@/hooks/useSignupForm';
import { iconSize, space, type Colors } from '@/theme';

type SignupFormProps = ReturnType<typeof useSignupForm>;

export function SignupForm({
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
  cleanFullName,
  isEmailValid,
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
}: SignupFormProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const emailError = useMemo(() => {
    if (takenEmail && cleanEmail === takenEmail) {
      return 'An account with this email already exists.';
    }
    if (!(touched.email || hasSubmitted)) return undefined;
    if (!cleanEmail) return 'Email is required.';
    if (!isEmailValid) return 'Enter a valid email address.';
    return undefined;
  }, [cleanEmail, isEmailValid, touched.email, hasSubmitted, takenEmail]);

  const passwordError = useMemo(() => {
    if (!(touched.password || hasSubmitted)) return undefined;
    if (!password) return 'Password is required.';
    if (!isPasswordValid) return 'Must be 8+ characters with at least 1 letter and 1 number.';
    return undefined;
  }, [password, isPasswordValid, touched.password, hasSubmitted]);

  const fullNameError =
    (touched.fullName || hasSubmitted) && !cleanFullName ? 'Full name is required.' : undefined;

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
    <>
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
          onChangeText={(val) => {
            setEmail(val);
            if (takenEmail) setTakenEmail(null);
          }}
          onBlur={() => markTouched('email')}
          icon="mail-outline"
          error={emailError}
          rightIcon={
            email.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setEmail('');
                  if (takenEmail) setTakenEmail(null);
                }}
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

      <View style={styles.buttonContainer}>
        <Button
          variant="primary"
          onPress={handleSignup}
          loading={loading}
          accessibilityLabel="Create account"
        >
          Create account
        </Button>
      </View>
    </>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    form: {
      gap: space['400'],
      marginBottom: space['400'],
    },
    usernameGroup: {
      gap: space['200'],
    },
    suggestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['150'],
      alignSelf: 'flex-start',
      paddingVertical: space['100'],
      paddingHorizontal: space['200'],
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderRadius: 16,
    },
    suggestButtonText: {
      color: colors.content.onSaseBlueSubtle.primary,
    },
    iconButton: {
      padding: space['100'],
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonContainer: {
      marginTop: space['200'],
    },
  });
