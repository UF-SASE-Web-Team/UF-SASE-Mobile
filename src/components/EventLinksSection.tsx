import React from 'react';
import { Alert, Linking, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, borderWidth, iconSize, radius, space } from '@/theme';
import { EventLink } from '@/types/events';

export interface EventLinksSectionProps {
  links?: EventLink[] | null;
  title?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Normalizes URL strings ensuring valid protocol schemes for Linking.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) || trimmed.startsWith('mailto:')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Chooses an appropriate Ionicons icon based on URL keywords and title.
 */
export function getLinkIcon(url: string, title?: string): keyof typeof Ionicons.glyphMap {
  const text = `${url} ${title || ''}`.toLowerCase();

  if (text.includes('discord.gg') || text.includes('discord.com')) {
    return 'logo-discord';
  }
  if (text.includes('github.com')) {
    return 'logo-github';
  }
  if (text.includes('instagram.com')) {
    return 'logo-instagram';
  }
  if (text.includes('linkedin.com')) {
    return 'logo-linkedin';
  }
  if (text.includes('youtube.com') || text.includes('youtu.be')) {
    return 'logo-youtube';
  }
  if (
    text.includes('zoom.us') ||
    text.includes('meet.google.com') ||
    text.includes('teams.microsoft.com')
  ) {
    return 'videocam-outline';
  }
  if (
    text.includes('docs.google.com') ||
    text.includes('drive.google.com') ||
    text.includes('forms.gle') ||
    text.includes('sheet') ||
    text.includes('form') ||
    text.includes('doc') ||
    text.includes('slide')
  ) {
    return 'document-text-outline';
  }
  if (
    text.includes('maps.google.com') ||
    text.includes('goo.gl/maps') ||
    text.includes('waze.com')
  ) {
    return 'map-outline';
  }

  return 'link-outline';
}

export function EventLinksSection({
  links,
  title = 'Links',
  style,
  testID,
}: EventLinksSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (!links || links.length === 0) {
    return null;
  }

  const handlePress = async (rawUrl: string) => {
    const url = normalizeUrl(rawUrl);
    if (!url) {
      Alert.alert('Invalid link', 'No URL provided.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', 'Could not open this URL.');
      }
    } catch (err: any) {
      Alert.alert('Link error', err.message || 'Failed to open link.');
    }
  };

  return (
    <View style={[styles.section, style]} testID={testID}>
      <Text variant="bodyStrong" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.linksContainer}>
        {links.map((link) => {
          const iconName = getLinkIcon(link.url, link.title);

          return (
            <Pressable
              key={link.id}
              style={({ pressed }) => [styles.linkCard, pressed && styles.linkCardPressed]}
              onPress={() => handlePress(link.url)}
              accessibilityRole="link"
              accessibilityLabel={link.title}
            >
              <View style={styles.linkLeft}>
                <Ionicons name={iconName} size={iconSize.sm} color={colors.surface.saseBlue.primary} />
                <Text variant="bodySmStrong" numberOfLines={1} style={styles.linkTitle}>
                  {link.title}
                </Text>
              </View>
              <Ionicons name="open-outline" size={iconSize.sm} color={colors.content.onBase.secondary} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    section: {
      gap: space['200'],
    },
    sectionTitle: {
      marginBottom: space['050'],
    },
    linksContainer: {
      gap: space['200'],
    },
    linkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      paddingHorizontal: space['300'],
      paddingVertical: space['250'],
    },
    linkCardPressed: {
      opacity: 0.75,
    },
    linkLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
      flex: 1,
      marginRight: space['200'],
    },
    linkTitle: {
      flex: 1,
    },
  });
