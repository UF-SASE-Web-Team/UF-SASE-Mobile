import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SaseFlask } from '@/components/ui/SaseFlask';
import { SaseLogo } from '@/components/ui/SaseLogo';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { iconSize, radius, space, type Colors } from '@/theme';

interface HomeHeaderProps {
  totalPoints: number | null;
  avatarSource: any;
  profileName?: string | null;
  onAvatarError: () => void;
}

export function HomeHeader({
  totalPoints,
  avatarSource,
  profileName,
  onAvatarError,
}: HomeHeaderProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const logoColor = isDark ? colors.surface.saseBlue.primary : colors.surface.saseBlue.secondary;

  return (
    <View style={styles.header}>
      <View
        style={styles.logoRow}
        accessible
        accessibilityRole="image"
        accessibilityLabel="UF SASE Logo"
        testID="home-sase-logo"
      >
        <SaseFlask
          width={26}
          height={36}
          fill={logoColor}
          color={logoColor}
          testID="home-sase-flask"
        />
        <SaseLogo
          width={132}
          height={30}
          fill={logoColor}
          color={logoColor}
          testID="home-sase-brand"
        />
      </View>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityLabel={
            totalPoints === null
              ? 'Points unavailable. View points log'
              : `${totalPoints} points. View points log`
          }
          accessibilityRole="button"
          testID="home-points-badge"
          onPress={() => router.push('/points')}
          style={({ pressed }) => [styles.pointsBadge, pressed && styles.profileButtonPressed]}
        >
          <Ionicons
            name="star"
            size={iconSize.sm}
            color={colors.content.onSaseBlueSubtle.primary}
          />
          <Text style={styles.pointsBadgeText}>{totalPoints ?? '–'}</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Profile"
          accessibilityRole="button"
          testID="home-profile-button"
          onPress={() => router.push('/profile')}
          style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
        >
          <Image
            source={avatarSource}
            style={styles.profileAvatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessibilityLabel={
              profileName ? `${profileName}'s profile picture` : 'Profile picture'
            }
            testID="home-profile-image"
            onError={onAvatarError}
          />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
      paddingBottom: space['300'],
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['250'],
    },
    pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      paddingHorizontal: space['250'],
      paddingVertical: space['150'],
      borderRadius: radius.full,
    },
    pointsBadgeText: {
      color: colors.content.onSaseBlueSubtle.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    profileButton: {
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    profileButtonPressed: {
      opacity: 0.7,
    },
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
    },
  });
