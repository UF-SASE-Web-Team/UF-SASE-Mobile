import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import type { Profile } from '@/types/profiles';
import { openExternalLink, normalizeUrl } from '@/lib/links';
import { normalizeLinkedInUrl, formatLinkedInDisplay } from '@/lib/linkedin';
import { posthog } from '@/lib/posthog';
import { useTheme, useThemedStyles, type Colors, iconSize, radius, space } from '@/theme';

export function ProfileCard({
  children,
  editing = false,
  style,
}: {
  children: ReactNode;
  editing?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const content = <View style={[styles.card, style]}>{children}</View>;
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

  const handleCopyDiscord = async (handle: string) => {
    const trimmed = handle.trim();
    if (!trimmed) return;
    try {
      await Clipboard.setStringAsync(trimmed);
      posthog?.capture('discord_handle_copied', { handle: trimmed });
    } catch {
      // Fallback
    }
  };

  const handleOpenInstagram = (handle: string) => {
    const trimmed = handle.trim();
    if (!trimmed) return;
    const clean = trimmed.replace(/^@/, '');
    const url =
      clean.startsWith('http://') || clean.startsWith('https://')
        ? clean
        : `https://www.instagram.com/${clean}`;
    openExternalLink(url, 'Instagram');
  };

  const handleOpenLinkedIn = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;
    const url = normalizeLinkedInUrl(trimmed) || normalizeUrl(trimmed);
    openExternalLink(url, 'LinkedIn');
  };

  const renderAcademicRow = (field: (typeof academicFields)[number]) => {
    const rawVal = profile[field.key];
    const val = [rawVal].flat().filter(Boolean).join(', ') || 'Not set';
    return (
      <View key={field.key} style={styles.row}>
        <Ionicons
          name={field.icon}
          size={iconSize.sm}
          color={colors.content.onBase.secondary}
          style={styles.fieldIcon}
        />
        <Text variant="body" style={styles.label}>
          {field.label}:
        </Text>
        <View style={styles.valuePill}>
          <Text variant="body" style={styles.value} selectable>
            {val}
          </Text>
        </View>
      </View>
    );
  };

  const renderSocialRow = (field: (typeof socialFields)[number]) => {
    const rawVal = profile[field.key];
    const val = typeof rawVal === 'string' ? rawVal.trim() : '';

    if (!val) {
      return (
        <View key={field.key} style={[styles.row, styles.socialRow]}>
          <Ionicons
            name={field.icon}
            size={iconSize.sm}
            color={colors.content.onBase.secondary}
            style={styles.fieldIcon}
          />
          <Text variant="body" style={styles.label}>
            {field.label}:
          </Text>
          <View style={styles.valuePill}>
            <Text variant="body" style={styles.value}>
              Not set
            </Text>
          </View>
        </View>
      );
    }

    let onPress: () => void;
    let accessibilityRole: 'button' | 'link';
    let accessibilityLabel: string;
    let accessibilityHint: string;
    let displayText: string;
    let rightIcon: keyof typeof Ionicons.glyphMap;

    if (field.key === 'discord_handle') {
      onPress = () => handleCopyDiscord(val);
      accessibilityRole = 'button';
      accessibilityLabel = `Copy Discord handle ${val}`;
      accessibilityHint = 'Copies Discord handle to clipboard';
      displayText = val;
      rightIcon = 'copy-outline';
    } else if (field.key === 'instagram_handle') {
      onPress = () => handleOpenInstagram(val);
      accessibilityRole = 'link';
      accessibilityLabel = `Open Instagram profile ${val}`;
      accessibilityHint = 'Opens Instagram in browser or app';
      displayText = val;
      rightIcon = 'open-outline';
    } else {
      onPress = () => handleOpenLinkedIn(val);
      accessibilityRole = 'link';
      accessibilityLabel = 'Open LinkedIn profile';
      accessibilityHint = 'Opens LinkedIn in browser or app';
      displayText = formatLinkedInDisplay(val);
      rightIcon = 'open-outline';
    }

    return (
      <Pressable
        key={field.key}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        hitSlop={space['100']}
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          styles.socialRow,
          styles.interactiveRow,
          pressed && styles.pressed,
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
        <View style={[styles.valuePill, styles.actionPill]}>
          <Text
            variant="body"
            style={[styles.value, styles.actionValue]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayText}
          </Text>
          <Ionicons name={rightIcon} size={iconSize.sm} color={colors.content.onBase.secondary} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.details}>
      <ProfileCard>{academicFields.map(renderAcademicRow)}</ProfileCard>
      {profile.bio ? (
        <ProfileCard>
          <Text variant="body" style={styles.bio} selectable>
            {profile.bio}
          </Text>
        </ProfileCard>
      ) : null}
      <ProfileCard>{socialFields.map(renderSocialRow)}</ProfileCard>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    details: { gap: space['200'] },
    border: {
      padding: space['100'],
      borderRadius: radius.xl,
    },
    card: {
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      padding: space['250'],
      gap: space['200'],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: space['100'],
      gap: space['100'],
    },
    socialRow: {},
    interactiveRow: {
      borderRadius: radius.md,
    },
    fieldIcon: { marginRight: space['150'] },
    label: { width: '26%', color: colors.content.onBase.primary, lineHeight: space['500'] },
    valuePill: {
      flex: 1,
      minHeight: space['800'],
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.full,
      paddingHorizontal: space['300'],
      paddingVertical: space['100'],
      justifyContent: 'center',
    },
    actionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space['150'],
    },
    actionValue: {
      flex: 1,
    },
    pressed: {
      opacity: 0.7,
    },
    value: { color: colors.content.onBase.secondary, lineHeight: space['500'] },
    bio: {
      color: colors.content.onBase.secondary,
      lineHeight: space['500'],
      paddingVertical: space['200'],
    },
  });
