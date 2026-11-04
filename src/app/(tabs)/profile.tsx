import React, { useState } from 'react';
import { StyleSheet, Text, Button, Alert, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { borderWidth, radius, space } from '@/theme';

export default function ProfilePage() {
  const { signOut } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await signOut();
          } catch (error: any) {
            Alert.alert('Sign out failed', error.message ?? 'An unknown error occurred.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? All of your profile data will be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              const { error } = await supabase.rpc('delete_user_account');
              if (error) {
                Alert.alert(
                  'Account deletion failed',
                  error.message ?? 'An unknown error occurred.',
                );
                return;
              }
              await signOut();
            } catch (error: any) {
              Alert.alert('Account deletion failed', error.message ?? 'An unknown error occurred.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const themeOptions = [
    { label: 'Light', value: 'light' as const },
    { label: 'Dark', value: 'dark' as const },
    { label: 'System', value: 'system' as const },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface.base.primary }]}
      edges={['top']}
    >
      <Text style={[styles.title, { color: colors.content.onBase.primary }]}>Profile</Text>

      {/* Temporary Theme Toggle */}
      <View style={[styles.themeCard, { backgroundColor: colors.surface.base.secondary }]}>
        <Text style={[styles.themeTitle, { color: colors.content.onBase.primary }]}>
          Theme (Temporary)
        </Text>
        <Text style={[styles.themeSubtitle, { color: colors.content.onBase.secondary }]}>
          Toggle between light, dark, and system appearance.
        </Text>
        <View style={styles.themeOptionsRow}>
          {themeOptions.map((opt) => {
            const isSelected = mode === opt.value;
            return (
              <Pressable
                key={opt.value}
                testID={`theme-btn-${opt.value}`}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isSelected
                      ? colors.surface.saseBlue.primary
                      : colors.surface.base.primary,
                    borderColor: isSelected
                      ? colors.surface.saseBlue.primary
                      : colors.border.base.subtle,
                  },
                ]}
                onPress={() => setMode(opt.value)}
                accessibilityRole="button"
                accessibilityLabel={`${opt.label} theme`}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    {
                      color: isSelected
                        ? colors.content.onMedia.primary
                        : colors.content.onBase.primary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Signing out...' : 'Sign Out'}
          onPress={handleSignOut}
          disabled={loading || deleting}
        />
        <Button
          title={deleting ? 'Deleting account...' : 'Delete Account'}
          color="#dc2626"
          onPress={handleDeleteAccount}
          disabled={loading || deleting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: space['400'],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: space['400'],
  },
  themeCard: {
    padding: space['400'],
    borderRadius: radius.lg,
    gap: space['200'],
    marginBottom: space['400'],
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeSubtitle: {
    fontSize: 13,
    marginBottom: space['100'],
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: space['200'],
  },
  themeButton: {
    flex: 1,
    paddingVertical: space['250'],
    borderRadius: radius.md,
    borderWidth: borderWidth.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeButtonText: {
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: space['400'],
    gap: space['200'],
  },
});
