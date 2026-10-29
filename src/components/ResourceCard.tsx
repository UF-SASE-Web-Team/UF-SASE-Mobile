import React from 'react';
import { ImageBackground, Linking, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Database } from '@/types/supabase';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space, radius, fonts } from '@/theme';

export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ResourceCategory = Database['public']['Enums']['resource_category'];

export interface ResourceCardProps {
  resource: ResourceRow;
  width?: number;
  onPress?: (resource: ResourceRow) => void;
}

export function ResourceCard({ resource, width, onPress }: ResourceCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleOpenPress = async () => {
    if (onPress) {
      onPress(resource);
      return;
    }

    if (resource.url) {
      const supported = await Linking.canOpenURL(resource.url);
      if (supported) {
        await Linking.openURL(resource.url);
      }
    }
  };

  return (
    <Pressable style={[styles.card, width ? { width } : null]} onPress={handleOpenPress}>
      <ImageBackground
        source={resource.image_url ? { uri: resource.image_url } : undefined}
        style={styles.imageHeader}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {resource.name}
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.cardFooter}>
        <View style={styles.openButton}>
          <Text style={styles.openButtonText}>Open</Text>
          <Ionicons
            name="open-outline"
            size={14}
            color={colors.content.onBase.primary}
            style={styles.buttonIcon}
          />
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 164,
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    imageHeader: {
      height: 125,
      backgroundColor: colors.surface.base.tertiary,
      padding: space['200'],
      justifyContent: 'flex-end',
    },
    titleContainer: {
      backgroundColor: colors.surface.base.primary,
      borderRadius: radius.sm,
      paddingHorizontal: space['150'],
      paddingVertical: space['050'],
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    cardTitle: {
      fontFamily: fonts.sans.bold,
      fontSize: 14,
      lineHeight: 18,
      color: colors.content.onBase.primary,
    },
    cardFooter: {
      paddingHorizontal: space['200'],
      paddingVertical: space['200'],
    },
    openButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.base.tertiary,
      paddingVertical: space['200'],
      borderRadius: radius.lg,
      gap: space['150'],
    },
    openButtonText: {
      fontFamily: fonts.sans.semibold,
      fontSize: 14,
      color: colors.content.onBase.primary,
    },
    buttonIcon: {
      marginLeft: space['050'],
    },
  });
