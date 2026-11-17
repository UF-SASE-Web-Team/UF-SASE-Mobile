import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getProfileAvatarSource } from '@/lib/profileAvatars';
import { type Colors, borderWidth, radius, space } from '@/theme';
import type { LeaderboardEntry } from '@/types/points';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

const PODIUM_SIZE = 3;

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { rank, fullName, username, avatarUrl, points, isMe, userId } = entry;
  const onPodium = rank <= PODIUM_SIZE;
  const name = isMe ? `${fullName} (You)` : fullName;
  const pointsLabel = `${points} ${points === 1 ? 'point' : 'points'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rank ${rank}, ${name}, ${pointsLabel}`}
      accessibilityHint="Opens their profile"
      onPress={() => router.push(isMe ? '/profile' : (`/profile/${userId}` as any))}
      style={({ pressed }) => [styles.row, isMe && styles.rowMe, pressed && styles.pressed]}
      testID={isMe ? 'leaderboard-row-me' : 'leaderboard-row'}
    >
      <View style={[styles.rank, onPodium && styles.rankPodium]}>
        <Text
          variant="bodyStrong"
          color={
            onPodium ? colors.content.onAccentSubtle.tertiary : colors.content.onBase.secondary
          }
        >
          {rank}
        </Text>
      </View>

      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image
            source={getProfileAvatarSource(avatarUrl)}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text variant="bodySmStrong" color={colors.content.onSaseBlue.secondary}>
              {(fullName[0] || '?').toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {name}
        </Text>
        {username ? (
          <Text variant="bodySm" color={colors.content.onBase.secondary} numberOfLines={1}>
            @{username}
          </Text>
        ) : null}
      </View>

      <Text variant="bodyStrong" color={colors.content.onBase.brand}>
        {points}
        <Text variant="bodySm" color={colors.content.onBase.secondary}>
          {' '}
          pts
        </Text>
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingVertical: space['300'],
      paddingHorizontal: space['400'],
      borderRadius: radius.xl,
      backgroundColor: colors.surface.base.secondary,
    },
    rowMe: {
      borderWidth: borderWidth.sm,
      backgroundColor: colors.surface.saseBlueSubtle.primary,
      borderColor: colors.border.saseBlue.primary,
    },
    pressed: {
      opacity: 0.7,
    },
    rank: {
      width: space['800'],
      height: space['800'],
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankPodium: {
      backgroundColor: colors.surface.accentSubtle.tertiary,
    },
    avatar: {
      width: space['1000'],
      height: space['1000'],
      borderRadius: radius.full,
      overflow: 'hidden',
      backgroundColor: colors.surface.base.primary,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.saseBlue.primary,
    },
    info: {
      flex: 1,
      gap: space['050'],
    },
  });
