import React from 'react';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, fonts, radius, space } from '@/theme';
import { ResourceRow, isInternalUrl, resolveInternalPath } from '@/types/resources';

export interface ResourceCardProps {
  resource: ResourceRow;
  isInternal?: boolean;
  width?: number;
  onPress?: (resource: ResourceRow) => void;
  testID?: string;
}

export function ResourceCard({ resource, isInternal, width, onPress, testID }: ResourceCardProps) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const title = resource.name;
  const hasChevron = isInternal !== undefined ? isInternal : isInternalUrl(resource.url);

  const handlePress = async () => {
    if (onPress) {
      onPress(resource);
      return;
    }

    if (resource.url) {
      if (isInternalUrl(resource.url)) {
        const route = resolveInternalPath(resource.url);
        try {
          router.push(route as any);
        } catch (err: any) {
          console.warn(`Failed to navigate to route: ${route}`, err?.message);
        }
        return;
      }

      try {
        const supported = await Linking.canOpenURL(resource.url);
        if (supported) {
          await Linking.openURL(resource.url);
        } else {
          console.warn(`Cannot open URL: ${resource.url}`);
        }
      } catch (err: any) {
        console.error('Failed to open resource URL:', err.message);
      }
    }
  };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hasChevron ? 'Navigates to in-app screen' : 'Opens external link'}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : null,
        pressed && styles.pressedCard,
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        {resource.image_url ? (
          <Image
            source={{ uri: resource.image_url }}
            style={styles.iconImage}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel={`${title} icon`}
          />
        ) : (
          <Ionicons name="document-text-outline" size={22} color={styles.defaultIconColor.color} />
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {title}
      </Text>

      {hasChevron && (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={styles.chevronColor.color}
          style={styles.chevron}
        />
      )}
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.base.strong,
      paddingHorizontal: space['250'],
      paddingVertical: space['150'],
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    pressedCard: {
      opacity: 0.7,
    },
    iconContainer: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconImage: {
      width: 30,
      height: 30,
    },
    defaultIconColor: {
      color: colors.content.onBase.primary,
    },
    cardTitle: {
      flex: 1,
      fontFamily: fonts.sans.semibold,
      fontSize: 13,
      lineHeight: 16,
      color: colors.content.onBase.primary,
      marginLeft: space['200'],
      marginRight: space['050'],
    },
    chevronColor: {
      color: colors.content.onBase.primary,
    },
    chevron: {
      marginLeft: space['050'],
    },
  });
