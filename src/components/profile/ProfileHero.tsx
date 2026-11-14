import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import {
  getProfileAvatarSource,
  isProfileAvatarPreset,
  profileAvatars,
} from '@/lib/profileAvatars';
import type { ProfileWithPrograms } from '@/types/profiles';
import {
  useThemedStyles,
  useTheme,
  type Colors,
  borderWidth,
  iconSize,
  radius,
  space,
} from '@/theme';

interface ProfileHeroProps {
  profile: ProfileWithPrograms;
  onEditAvatar?: () => void;
}

export function ProfileHero({ profile, onEditAvatar }: ProfileHeroProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>();
  const imageFailed = failedAvatarUrl === profile.avatar_url;
  const isPreset = imageFailed || !profile.avatar_url || isProfileAvatarPreset(profile.avatar_url);
  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
  return (
    <View style={styles.hero}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarRing}>
          <Image
            source={
              imageFailed ? profileAvatars[0].source : getProfileAvatarSource(profile.avatar_url)
            }
            style={isPreset ? styles.avatar : styles.avatarCover}
            contentFit={isPreset ? 'contain' : 'cover'}
            cachePolicy="memory-disk"
            accessibilityLabel={`${profile.full_name}'s profile picture`}
            onError={() => setFailedAvatarUrl(profile.avatar_url)}
          />
        </View>
        {onEditAvatar && (
          <Pressable
            accessibilityLabel="Change profile picture"
            accessibilityRole="button"
            onPress={onEditAvatar}
            hitSlop={space['100']}
            style={({ pressed }) => [styles.editAvatar, pressed && styles.pressed]}
          >
            <Ionicons name="pencil" size={iconSize.md} color={colors.content.onBase.primary} />
          </Pressable>
        )}
      </View>
      <Text variant="body" style={styles.role}>
        {roleLabel}
      </Text>
      <Text variant="bodySm" style={styles.programs}>
        {profile.programNames.length ? profile.programNames.join(' | ') : 'UF SASE'}
      </Text>
      <Text variant="body" style={styles.username}>
        @{profile.username}
      </Text>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    hero: { alignItems: 'center', paddingBottom: space['200'], marginTop: -space['200'] },
    avatarContainer: { width: 140, height: 140 },
    avatarRing: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.strong,
      backgroundColor: colors.surface.base.primary,
      overflow: 'hidden',
    },
    avatar: { width: 123, height: 123 },
    avatarCover: { width: '100%', height: '100%' },
    editAvatar: {
      position: 'absolute',
      top: -space['100'],
      right: -space['100'],
      width: iconSize.lg,
      height: iconSize.lg,
      borderRadius: radius.full,
      backgroundColor: colors.surface.base.quaternary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    role: {
      color: colors.content.onBase.primary,
      marginTop: space['200'],
      textAlign: 'center',
      lineHeight: space['500'],
    },
    programs: {
      color: colors.content.onBase.primary,
      marginTop: space['200'],
      textAlign: 'center',
    },
    username: {
      color: colors.content.onBase.primary,
      marginTop: space['200'],
      textAlign: 'center',
      lineHeight: space['500'],
    },
    pressed: { opacity: 0.7 },
  });
