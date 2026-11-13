import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { ReportMemberSheet } from '@/components/profile/ReportMemberSheet';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { getProfileError } from '@/context/ProfileContext';
import { blockMember, isMemberBlocked, unblockMember } from '@/services/moderation';
import { getProfile } from '@/services/profiles';
import { useTheme, useThemedStyles, space } from '@/theme';
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

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    // A failed block lookup should not hide an otherwise loadable profile.
    const blockStatus = isOwnProfile
      ? Promise.resolve(false)
      : isMemberBlocked(id).catch(() => false);

    Promise.all([getProfile(id), blockStatus])
      .then(([data, isBlocked]) => {
        if (!isMounted) return;
        setProfile(data);
        setBlocked(isBlocked);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Error loading profile:', err?.message || err);
        setError(err?.message || 'Could not load profile.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isOwnProfile]);

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
        <View style={styles.centered} testID="public-profile-error">
          <Text variant="title">Profile unavailable</Text>
          <Text variant="body" color={colors.content.onBase.secondary}>
            No profile ID provided.
          </Text>
          <BackButton fallbackRoute="/(tabs)" />
        </View>
      </ProfileScreen>
    );
  }

  if (loading) {
    return (
      <ProfileScreen>
        <View style={styles.centered} testID="public-profile-loading">
          <ActivityIndicator size="large" color={colors.surface.saseBlue.primary} />
        </View>
      </ProfileScreen>
    );
  }

  if (error || !profile) {
    return (
      <ProfileScreen>
        <View style={styles.centered} testID="public-profile-error">
          <Text variant="title">Profile unavailable</Text>
          <Text variant="body" color={colors.content.onBase.secondary}>
            {error || 'This user profile could not be found.'}
          </Text>
          <BackButton fallbackRoute="/(tabs)" />
        </View>
      </ProfileScreen>
    );
  }

  const moderationFooter = (
    <View style={styles.actions}>
      {blocked && (
        <ProfileButton
          title={blockBusy ? 'Unblocking...' : 'Unblock Member'}
          onPress={() => setBlock(false)}
          variant="secondary"
          loading={blockBusy}
        />
      )}
      <ProfileButton
        title="Report Member"
        onPress={() => setReporting(true)}
        variant="ghost"
        disabled={blockBusy}
      />
      {!blocked && (
        <ProfileButton
          title={blockBusy ? 'Blocking...' : 'Block Member'}
          onPress={confirmBlock}
          variant="ghost"
          loading={blockBusy}
        />
      )}
    </View>
  );

  return (
    <ProfileScreen
      onEdit={isOwnProfile ? () => router.push('/profile/edit') : undefined}
      footer={
        isOwnProfile ? (
          <ProfileButton
            title="Account Settings"
            onPress={() => router.push('/profile/settings')}
          />
        ) : (
          moderationFooter
        )
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

const createStyles = () =>
  StyleSheet.create({
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: space['300'],
      paddingVertical: space['1200'],
    },
    centeredText: { textAlign: 'center' },
    actions: { gap: space['100'] },
  });
