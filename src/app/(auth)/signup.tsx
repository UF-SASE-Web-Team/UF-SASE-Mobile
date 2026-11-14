import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { SignupForm } from '@/components/auth/SignupForm';
import { BackButton } from '@/components/ui/BackButton';
import { Text } from '@/components/ui/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { useSignupForm } from '@/hooks/useSignupForm';
import { space, type Colors } from '@/theme';

export default function SignupScreen() {
  const styles = useThemedStyles(createStyles);
  const formState = useSignupForm();

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

          <SignupForm {...formState} />

          <AuthLegalFooter />
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
      paddingBottom: space['800'],
    },
    backButton: {
      marginBottom: space['400'],
      alignSelf: 'flex-start',
    },
    title: {
      marginBottom: space['600'],
    },
  });
