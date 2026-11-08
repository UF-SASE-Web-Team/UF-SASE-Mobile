import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MenuView } from '@expo/ui/community/menu';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import { ProfileScreen, ProfileLoadingState } from '@/components/profile/ProfileScreen';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { ProfileSheet } from '@/components/profile/ProfileSheet';
import { PasswordResetSheet } from '@/components/profile/PasswordResetSheet';
import { useAuth } from '@/context/AuthContext';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { deleteAccount, sendPasswordResetEmail } from '@/services/profiles';
import {
  useTheme,
  useThemedStyles,
  type Colors,
  type ThemeMode,
  fonts,
  iconSize,
  radius,
  space,
} from '@/theme';

const themes: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Settings' },
];

export default function AccountSettingsPage() {
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const { mode, setMode, colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const [busy, setBusy] = useState<'reset' | 'logout' | 'delete' | null>(null);
  const [sheet, setSheet] = useState<'privacy' | 'password' | null>(null);
  const [accountDeleted, setAccountDeleted] = useState(false);

  const logOut = async () => {
    setBusy('logout');
    try {
      await signOut();
    } catch (cause) {
      Alert.alert('Log out failed', getProfileError(cause, 'Please try again.'));
    } finally {
      setBusy(null);
    }
  };
  const confirmLogOut = () =>
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: logOut },
    ]);
  const removeAccount = async () => {
    setBusy('delete');
    try {
      if (!accountDeleted) {
        await deleteAccount();
        setAccountDeleted(true);
      }
      await signOut();
    } catch (cause) {
      Alert.alert('Account deletion failed', getProfileError(cause, 'Please try again.'));
    } finally {
      setBusy(null);
    }
  };
  const confirmDelete = () =>
    Alert.alert(
      'Delete Account',
      'Your account and profile data will be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: removeAccount },
      ],
    );
  const resetEmail = async () => {
    if (!user?.email) {
      Alert.alert('Email unavailable', 'No email address is linked to this account.');
      return;
    }
    setBusy('reset');
    try {
      await sendPasswordResetEmail(user.email);
      setSheet('password');
    } catch (cause) {
      Alert.alert('Could not send reset email', getProfileError(cause, 'Please try again.'));
    } finally {
      setBusy(null);
    }
  };
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };
  if (!profile) return <ProfileLoadingState />;

  return (
    <ProfileScreen
      onBack={goBack}
      footer={
        <View style={styles.actions}>
          <ProfileButton
            title={busy === 'reset' ? 'Sending Reset Email...' : 'Reset Email'}
            onPress={resetEmail}
            variant="secondary"
            loading={busy === 'reset'}
            disabled={!!busy || accountDeleted}
          />
          <ProfileButton
            title={busy === 'logout' ? 'Logging Out...' : 'Log Out'}
            onPress={confirmLogOut}
            loading={busy === 'logout'}
            disabled={!!busy}
          />
          <ProfileButton
            title={busy === 'delete' ? 'Deleting Account...' : 'Delete Account'}
            onPress={confirmDelete}
            variant="danger"
            loading={busy === 'delete'}
            disabled={!!busy}
          />
        </View>
      }
    >
      <ProfileHero profile={profile} />
      <View style={styles.settings}>
        <View style={styles.themeRow}>
          <Text variant="title" style={styles.brandText}>
            App Theme
          </Text>
          <View pointerEvents={busy ? 'none' : 'auto'} style={styles.themeMenu}>
            <MenuView
              testID="profile-theme-menu"
              title="App Theme"
              colorScheme={mode === 'system' ? undefined : mode}
              actions={themes.map((theme) => ({
                id: theme.value,
                title: theme.label,
                state: mode === theme.value ? 'on' : 'off',
                attributes: { disabled: !!busy },
              }))}
              onPressAction={({ nativeEvent }) => {
                const selected = themes.find((theme) => theme.value === nativeEvent.event);
                if (selected && !busy) setMode(selected.value);
              }}
            >
              <View
                accessible
                accessibilityRole="button"
                accessibilityLabel="App Theme"
                accessibilityValue={{ text: themes.find((theme) => theme.value === mode)?.label }}
                accessibilityState={{ disabled: !!busy }}
                style={styles.themeValue}
              >
                <Text variant="bodySmStrong" style={styles.brandText}>
                  {themes.find((theme) => theme.value === mode)?.label}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={iconSize.sm}
                  color={colors.content.onBase.primary}
                />
              </View>
            </MenuView>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Privacy Policy Information"
          onPress={() => setSheet('privacy')}
          disabled={!!busy}
          style={({ pressed }) => [styles.privacyButton, pressed && styles.pressed]}
        >
          <Text variant="title" style={[styles.brandText, styles.centerText]}>
            Privacy Policy Information
          </Text>
        </Pressable>
      </View>
      <ProfileSheet
        title="Privacy Policy Information"
        visible={sheet === 'privacy'}
        onClose={() => setSheet(null)}
      >
        <Text variant="body" style={styles.privacyNotice}>
          The UF SASE privacy policy is pending setup. Please check back later.
        </Text>
      </ProfileSheet>
      {sheet === 'password' && user?.email && (
        <PasswordResetSheet email={user.email} onClose={() => setSheet(null)} />
      )}
    </ProfileScreen>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    settings: {
      flex: 1,
      justifyContent: 'space-around',
      gap: space['1200'],
      paddingTop: space['200'],
    },
    themeRow: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space['200'],
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      paddingHorizontal: space['600'],
      paddingVertical: space['200'],
      shadowColor: colors.surface.media.scrim,
      shadowOffset: { width: 0, height: space['050'] },
      shadowOpacity: 0.2,
      shadowRadius: space['100'],
      elevation: space['050'],
    },
    brandText: {
      color: colors.content.onBase.primary,
      fontFamily: fonts.sans.medium,
      flexShrink: 1,
    },
    themeMenu: { flexShrink: 1 },
    themeValue: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.full,
      paddingHorizontal: space['300'],
      paddingVertical: space['100'],
      gap: space['100'],
      flexShrink: 1,
    },
    privacyButton: {
      minHeight: 148,
      backgroundColor: colors.surface.base.quaternary,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space['600'],
      shadowColor: colors.surface.media.scrim,
      shadowOffset: { width: 0, height: space['050'] },
      shadowOpacity: 0.2,
      shadowRadius: space['100'],
      elevation: space['050'],
    },
    centerText: { textAlign: 'center' },
    actions: { gap: space['250'] },
    pressed: { opacity: 0.7 },
    privacyNotice: { paddingBottom: space['600'] },
  });
