import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import type { Profile } from '@/types/profiles';
import { useTheme, useThemedStyles, type Colors, iconSize, radius, space } from '@/theme';

export function ProfileCard({
  children,
  editing = false,
}: {
  children: ReactNode;
  editing?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const content = <View style={styles.card}>{children}</View>;
  return editing ? (
    <View style={styles.border}>{content}</View>
  ) : (
    <LinearGradient
      colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
      start={{ x: 0, y: 0.8 }}
      end={{ x: 1, y: 0.2 }}
      style={styles.border}
    >
      {content}
    </LinearGradient>
  );
}

export const academicFields = [
  { key: 'full_name', label: 'Full Name', icon: 'person-outline' },
  { key: 'majors', label: 'Major', icon: 'school-outline' },
  { key: 'minors', label: 'Minor', icon: 'book-outline' },
  { key: 'grad_time', label: 'Grad Year', icon: 'calendar-outline' },
] as const;

export const socialFields = [
  { key: 'discord_handle', label: 'Discord', icon: 'logo-discord' },
  { key: 'instagram_handle', label: 'Instagram', icon: 'logo-instagram' },
  { key: 'linkedin_url', label: 'LinkedIn', icon: 'logo-linkedin' },
] as const;

export function ProfileDetails({ profile }: { profile: Profile }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const renderRow = (field: (typeof academicFields)[number] | (typeof socialFields)[number]) => (
    <View
      key={field.key}
      style={[
        styles.row,
        (field.key === 'discord_handle' ||
          field.key === 'instagram_handle' ||
          field.key === 'linkedin_url') &&
          styles.socialRow,
      ]}
    >
      <Ionicons
        name={field.icon}
        size={iconSize.sm}
        color={colors.content.onBase.secondary}
        style={styles.fieldIcon}
      />
      <Text variant="body" style={styles.label}>
        {field.label}:
      </Text>
      <View style={[styles.valuePill, field.key === 'linkedin_url' && styles.linkedinPill]}>
        <Text variant="body" style={styles.value} selectable>
          {[profile[field.key]].flat().join(', ') || 'Not set'}
        </Text>
      </View>
    </View>
  );
  return (
    <View style={styles.details}>
      <ProfileCard>{academicFields.map(renderRow)}</ProfileCard>
      <ProfileCard>{socialFields.map(renderRow)}</ProfileCard>
      {profile.bio ? (
        <ProfileCard>
          <Text variant="body" style={styles.bio} selectable>
            {profile.bio}
          </Text>
        </ProfileCard>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    details: { gap: space['200'] },
    border: {
      padding: 5,
      borderRadius: 35,
    },
    card: {
      backgroundColor: colors.surface.base.secondary,
      borderRadius: 30,
      padding: space['250'],
      gap: space['200'],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 42,
      gap: space['100'],
    },
    socialRow: { minHeight: 38 },
    fieldIcon: { marginRight: space['150'] },
    label: { width: '26%', color: colors.content.onBase.primary, lineHeight: space['500'] },
    valuePill: {
      flex: 1,
      minHeight: 32,
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      paddingHorizontal: space['200'],
      paddingVertical: space['100'],
      justifyContent: 'center',
    },
    value: { color: colors.content.onBase.secondary, lineHeight: space['500'] },
    linkedinPill: { paddingTop: space['200'] },
    bio: {
      color: colors.content.onBase.secondary,
      lineHeight: space['500'],
      minHeight: 100,
      paddingTop: space['100'],
    },
  });
