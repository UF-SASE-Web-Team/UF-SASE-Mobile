import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, radius, space } from '@/theme';
import { getProfileAvatarSource } from '@/lib/profileAvatars';

export interface ContactCardProps {
  name: string;
  avatarUrl?: string | null;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ContactCard({ name, avatarUrl, style, testID }: ContactCardProps) {
  const styles = useThemedStyles(createStyles);

  const initial = (name[0] || 'C').toUpperCase();

  return (
    <View
      style={[styles.card, style]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={`Contact: ${name}`}
    >
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image
            source={getProfileAvatarSource(avatarUrl)}
            style={styles.avatarImage}
            contentFit="cover"
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
