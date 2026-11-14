import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MenuView } from '@expo/ui/community/menu';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { ProfileScreen, ProfileLoadingState } from '@/components/profile/ProfileScreen';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { PasswordResetSheet } from '@/components/profile/PasswordResetSheet';
import { useAuth } from '@/context/AuthContext';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { legalLinks } from '@/lib/links';
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
  borderWidth,
} from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const legalRows: { label: string; url: string; icon: IconName }[] = [
  { label: 'Privacy Policy', url: legalLinks.privacy, icon: 'shield-checkmark-outline' },
  { label: 'Terms of Service', url: legalLinks.terms, icon: 'document-text-outline' },
];

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
  const [sheet, setSheet] = useState<'password' | null>(null);
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
  const openLegalLink = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', `Please visit ${url} in your browser.`),
    );
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
            variant="danger"
            loading={busy === 'logout'}
            disabled={!!busy}
          />
          <ProfileButton
            title={busy === 'delete' ? 'Deleting Account...' : 'Delete Account'}
            onPress={confirmDelete}
            variant="ghost"
            loading={busy === 'delete'}
            disabled={!!busy}
          />
        </View>
      }
    >
      <ProfileHero profile={profile} />
      <View style={styles.settings}>
        <View style={styles.row}>
          <Ionicons
            name="color-palette-outline"
            size={iconSize.md}
            color={colors.content.onBase.secondary}
          />
          <Text variant="body" style={styles.rowLabel}>
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
                <Text variant="bodySmStrong" style={styles.rowValue}>
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
        {legalRows.map((row) => (
          <View key={row.label}>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={row.label}
              onPress={() => openLegalLink(row.url)}
              disabled={!!busy}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <Ionicons
                name={row.icon}
                size={iconSize.md}
                color={colors.content.onBase.secondary}
              />
              <Text variant="body" style={styles.rowLabel}>
                {row.label}
              </Text>
              <Ionicons
                name="open-outline"
                size={iconSize.sm}
                color={colors.content.onBase.secondary}
              />
            </Pressable>
          </View>
        ))}
      </View>
      {sheet === 'password' && user?.email && (
        <PasswordResetSheet email={user.email} onClose={() => setSheet(null)} />
      )}
    </ProfileScreen>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    // One grouped card holding the settings rows
    settings: {
      marginTop: space['600'],
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      overflow: 'hidden',
    },
    row: {
      minHeight: space['1200'],
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingHorizontal: space['400'],
      paddingVertical: space['250'],
    },
    rowLabel: {
      fontFamily: fonts.sans.medium,
      flex: 1,
    },
    rowValue: { flexShrink: 1 },
    divider: {
      height: borderWidth.sm,
      marginLeft: space['400'] + iconSize.md + space['300'],
      backgroundColor: colors.border.base.subtle,
    },
    themeMenu: { flexShrink: 1 },
    themeValue: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      paddingHorizontal: space['300'],
      paddingVertical: space['100'],
      gap: space['100'],
      flexShrink: 1,
    },
    actions: { gap: space['250'] },
    pressed: { opacity: 0.7 },
  });
