import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { ReportMemberSheet } from '@/components/profile/ReportMemberSheet';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/AuthContext';
import { getProfileError } from '@/context/ProfileContext';
import { blockMember, isMemberBlocked, unblockMember } from '@/services/moderation';
import { getProfile } from '@/services/profiles';
import {
  borderWidth,
  iconSize,
  radius,
  space,
  useTheme,
  useThemedStyles,
  type Colors,
} from '@/theme';
import type { ProfileWithPrograms } from '@/types/profiles';

export default function PublicProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [profile, setProfile] = useState<ProfileWithPrograms | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isOwnProfile = Boolean(user?.id && id && user.id === id);

  const fetchProfile = useCallback(() => {
    if (!id) return;

    // A failed block lookup should not hide an otherwise loadable profile.
    const blockStatus = isOwnProfile
      ? Promise.resolve(false)
      : isMemberBlocked(id).catch(() => false);

    Promise.all([getProfile(id), blockStatus])
      .then(([data, isBlocked]) => {
        setProfile(data);
        setBlocked(isBlocked);
        setError(null);
      })
      .catch((err) => {
        console.warn('Error loading profile:', err?.message || err);
        setError(err?.message || 'Could not load profile.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isOwnProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRetry = () => {
    setLoading(true);
    fetchProfile();
  };

  const setBlock = async (shouldBlock: boolean) => {
    if (!id) return;
    setBlockBusy(true);
    try {
      await (shouldBlock ? blockMember(id) : unblockMember(id));
      setBlocked(shouldBlock);
    } catch (cause) {
      Alert.alert(
        shouldBlock ? 'Could not block member' : 'Could not unblock member',
        getProfileError(cause, 'Please try again.'),
      );
    } finally {
      setBlockBusy(false);
    }
  };
  const confirmBlock = () =>
    Alert.alert(
      'Block Member',
      `You will no longer see ${profile?.full_name ?? 'this member'}'s profile. They will not be told.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: () => setBlock(true) },
      ],
    );

  if (!id) {
    return (
      <ProfileScreen>
        <ErrorState
          title="Profile unavailable"
          message="No profile ID provided."
          scrollable={false}
          testID="public-profile-error"
        >
          <BackButton fallbackRoute="/(tabs)" />
        </ErrorState>
      </ProfileScreen>
    );
  }

  if (loading) {
    return (
      <ProfileScreen>
        <LoadingState accessibilityLabel="Loading profile" testID="public-profile-loading" />
      </ProfileScreen>
    );
  }

  if (error || !profile) {
    return (
      <ProfileScreen>
        <ErrorState
          error={error}
          title="Profile unavailable"
          message={error || 'This user profile could not be found.'}
          onRetry={handleRetry}
          scrollable={false}
          testID="public-profile-error"
        >
          <BackButton fallbackRoute="/(tabs)" />
        </ErrorState>
      </ProfileScreen>
    );
  }

  const moderationHeader = (
    <View style={styles.headerActions}>
      <Pressable
        testID="report-member-button"
        accessibilityRole="button"
        accessibilityLabel="Report Member"
        disabled={blockBusy}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => setReporting(true)}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && !blockBusy && styles.pressed,
          blockBusy && styles.disabled,
        ]}
      >
        <Ionicons name="flag-outline" size={iconSize.md} color={colors.content.onBase.primary} />
      </Pressable>

      <Pressable
        testID="block-member-button"
        accessibilityRole="button"
        accessibilityLabel={blocked ? 'Unblock Member' : 'Block Member'}
        accessibilityState={{ disabled: blockBusy, busy: blockBusy }}
        disabled={blockBusy}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={blocked ? () => setBlock(false) : confirmBlock}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && !blockBusy && styles.pressed,
          blockBusy && styles.disabled,
        ]}
      >
        {blockBusy ? (
          <ActivityIndicator size="small" color={colors.content.onBase.primary} />
        ) : (
          <Ionicons
            name={blocked ? 'ban' : 'ban-outline'}
            size={iconSize.md}
            color={colors.content.onBase.primary}
          />
        )}
      </Pressable>
    </View>
  );

  return (
    <ProfileScreen
      onEdit={isOwnProfile ? () => router.push('/profile/edit') : undefined}
      headerRight={isOwnProfile ? undefined : moderationHeader}
      footer={
        isOwnProfile ? (
          <Button size="lg" onPress={() => router.push('/profile/settings')}>
            Settings
          </Button>
        ) : undefined
      }
    >
      {blocked ? (
        <View style={styles.centered} testID="public-profile-blocked">
          <Text variant="title">You blocked this member</Text>
          <Text variant="body" color={colors.content.onBase.secondary} style={styles.centeredText}>
            Their profile is hidden from you. Unblock them to see it again.
          </Text>
        </View>
      ) : (
        <>
          <ProfileHero profile={profile} />
          <ProfileDetails profile={profile} />
        </>
      )}
      {reporting && (
        <ReportMemberSheet
          memberId={profile.id}
          memberName={blocked ? 'this member' : profile.full_name}
          onClose={() => setReporting(false)}
          onReported={() => {
            setReporting(false);
            Alert.alert(
              'Report sent',
              'Thank you. UF SASE officers review reports within 24 hours.',
            );
          }}
        />
      )}
    </ProfileScreen>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: space['300'],
      paddingVertical: space['1200'],
    },
    centeredText: { textAlign: 'center' },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    pressed: {
      opacity: 0.7,
    },
    disabled: {
      opacity: 0.5,
    },
  });
