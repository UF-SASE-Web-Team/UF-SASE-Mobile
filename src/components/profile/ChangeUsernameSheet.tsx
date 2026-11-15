import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ProfileModalSlot } from '@/components/profile/ProfileScreen';
import { useAuth } from '@/context/AuthContext';
import { getProfileError, useProfile } from '@/context/ProfileContext';
import { supabase } from '@/lib/supabase';
import { updateUsername } from '@/services/profiles';
import { type Colors, iconSize, space, useTheme, useThemedStyles } from '@/theme';

const USERNAME_REGEX = /^[a-z][a-z0-9]*(?:[._][a-z0-9]+)*$/;

export interface ChangeUsernameSheetProps {
  visible: boolean;
  onClose: () => void;
  currentUsername?: string;
  userId?: string;
}

export function ChangeUsernameSheet({
  visible,
  onClose,
  currentUsername,
  userId,
}: ChangeUsernameSheetProps) {
  const { profile, reload } = useProfile();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const activeUsername = currentUsername ?? profile?.username ?? '';
  const activeUserId = userId ?? user?.id ?? '';

  const [username, setUsername] = useState(activeUsername);
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
  const [saving, setSaving] = useState(false);

  const cleanUsername = username.trim().toLowerCase();
  const cleanCurrent = activeUsername.trim().toLowerCase();
  const isCurrent = Boolean(cleanUsername && cleanUsername === cleanCurrent);

  const isUsernameFormatValid = useMemo(() => {
    return (
      cleanUsername.length >= 3 && cleanUsername.length <= 20 && USERNAME_REGEX.test(cleanUsername)
    );
  }, [cleanUsername]);

  const usernameStatus:
    'idle' | 'current' | 'invalid' | 'checking' | 'available' | 'taken' | 'error' = useMemo(() => {
    if (!cleanUsername) return 'idle';
    if (isCurrent) return 'current';
    if (!isUsernameFormatValid) return 'invalid';
    if (isRequestInFlight || serverCheck.evaluatedUsername !== cleanUsername) {
      return 'checking';
    }
    if (serverCheck.networkError) return 'error';
    if (serverCheck.isAvailable === true) return 'available';
    if (serverCheck.isAvailable === false) return 'taken';
    return 'idle';
  }, [cleanUsername, isCurrent, isUsernameFormatValid, isRequestInFlight, serverCheck]);

  useEffect(() => {
    if (!cleanUsername || isCurrent || !isUsernameFormatValid) return;
    if (serverCheck.evaluatedUsername === cleanUsername && !serverCheck.networkError) {
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
    isCurrent,
    isUsernameFormatValid,
    serverCheck.evaluatedUsername,
    serverCheck.networkError,
  ]);

  const handleSave = async () => {
    if (usernameStatus !== 'available' || saving || !activeUserId) return;
    setSaving(true);
    try {
      await updateUsername(activeUserId, cleanUsername);
      reload();
      onClose();
      Alert.alert('Username updated successfully.');
    } catch (cause) {
      Alert.alert('Could not update username', getProfileError(cause, 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const renderRightIcon = () => {
    if (usernameStatus === 'checking') {
      return (
        <View style={styles.iconButton} accessibilityLabel="Checking username availability">
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
    if (username.length > 0 && !saving) {
      return (
        <Pressable
          onPress={() => setUsername('')}
          style={styles.iconButton}
          hitSlop={space['200']}
          accessibilityLabel="Clear username"
          accessibilityRole="button"
        >
          <Ionicons
            name="close-outline"
            size={iconSize.md}
            color={colors.content.onBase.secondary}
          />
        </Pressable>
      );
    }
    return null;
  };

  if (!visible) return null;

  const errorMessage =
    usernameStatus === 'taken'
      ? 'Username is already taken.'
      : usernameStatus === 'invalid' && cleanUsername.length > 0
        ? '3-20 letters, numbers, . or _. Must start with a letter.'
        : usernameStatus === 'error'
          ? 'Could not verify username. Check connection.'
          : undefined;

  return (
    <ProfileModalSlot>
      <ModalSheet
        title="Change Username"
        visible={visible}
        onClose={onClose}
        busy={saving}
        testID="change-username-sheet"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inputGroup}>
            <Input
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              value={username}
              onChangeText={setUsername}
              icon="at-outline"
              error={errorMessage}
              rightIcon={renderRightIcon()}
              editable={!saving}
            />
            <View style={styles.statusContainer}>
              {usernameStatus === 'current' && (
                <Text variant="bodySm" style={styles.hintText}>
                  This is your current username
                </Text>
              )}
              {usernameStatus === 'checking' && (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={colors.content.onBase.secondary} />
                  <Text variant="bodySm" style={styles.checkingText}>
                    Checking availability...
                  </Text>
                </View>
              )}
              {usernameStatus === 'available' && (
                <View style={styles.statusRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={iconSize.md}
                    color={colors.border.success.primary}
                  />
                  <Text variant="bodySm" style={styles.successText}>
                    Username is available
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={usernameStatus !== 'available' || saving}
            loading={saving}
            accessibilityLabel="Save Username"
          >
            {saving ? 'Saving...' : 'Save Username'}
          </Button>
        </ScrollView>
      </ModalSheet>
    </ProfileModalSlot>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    content: {
      paddingVertical: space['400'],
      gap: space['400'],
    },
    inputGroup: {
      gap: space['150'],
    },
    statusContainer: {
      minHeight: space['500'],
      justifyContent: 'center',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['150'],
      paddingHorizontal: space['400'],
    },
    hintText: {
      color: colors.content.onBase.secondary,
      paddingHorizontal: space['400'],
    },
    checkingText: {
      color: colors.content.onBase.secondary,
    },
    successText: {
      color: colors.border.success.primary,
    },
    iconButton: {
      paddingHorizontal: space['100'],
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
