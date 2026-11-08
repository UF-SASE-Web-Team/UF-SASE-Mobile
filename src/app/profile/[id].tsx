import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackButton } from '@/components/BackButton';
import { ProfileButton } from '@/components/profile/ProfileButton';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ProfileScreen } from '@/components/profile/ProfileScreen';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
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

  const isOwnProfile = Boolean(user?.id && id && user.id === id);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    getProfile(id)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
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
  }, [id]);

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

  return (
    <ProfileScreen
      onEdit={isOwnProfile ? () => router.push('/profile/edit') : undefined}
      footer={
        isOwnProfile ? (
          <ProfileButton
            title="Account Settings"
            onPress={() => router.push('/profile/settings')}
          />
        ) : undefined
      }
    >
      <ProfileHero profile={profile} />
      <ProfileDetails profile={profile} />
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
  });
