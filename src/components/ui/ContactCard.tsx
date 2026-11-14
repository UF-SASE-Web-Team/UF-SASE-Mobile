import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, radius, space } from '@/theme';
import { getProfileAvatarSource } from '@/lib/profileAvatars';

export interface ContactCardProps {
  name: string;
  avatarUrl?: string | null;
  userId?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ContactCard({ name, avatarUrl, userId, onPress, style, testID }: ContactCardProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  const initial = (name[0] || 'C').toUpperCase();
  const handlePress =
    onPress ?? (userId ? () => router.push(`/profile/${userId}` as any) : undefined);
  const isInteractive = Boolean(handlePress);

  const cardContent = (
    <>
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image
            source={getProfileAvatarSource(avatarUrl)}
            style={styles.avatarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            accessibilityLabel={`${name}'s avatar`}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text variant="bodySmStrong" color="#FFFFFF">
              {initial}
            </Text>
          </View>
        )}
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={styles.name}>
        {name}
      </Text>
    </>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`View profile: ${name}`}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View
      style={[styles.card, style]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`Contact: ${name}`}
    >
      {cardContent}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.full,
      paddingLeft: space['150'],
      paddingRight: space['400'],
      paddingVertical: space['100'],
      gap: space['200'],
    },
    pressed: {
      opacity: 0.7,
    },
    avatarWrapper: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.surface.base.primary,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.saseBlue.primary,
    },
    name: {
      color: colors.content.onBase.primary,
    },
  });
