import React from 'react';
import { ImageBackground, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Database } from '@/types/supabase';

export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ResourceCategory = Database['public']['Enums']['resource_category'];

export interface ResourceCardProps {
  resource: ResourceRow;
  width?: number;
  onPress?: (resource: ResourceRow) => void;
}

export function ResourceCard({ resource, width, onPress }: ResourceCardProps) {
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
        imageStyle={styles.imageStyle}
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
          <Ionicons name="open-outline" size={14} color="#111" style={styles.buttonIcon} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 164,
    backgroundColor: '#DCDCDC',
    borderRadius: 20,
    overflow: 'hidden',
  },
  imageHeader: {
    height: 125,
    backgroundColor: '#B0B0B0',
    padding: 10,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  titleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111',
    lineHeight: 17,
  },
  cardFooter: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BDBDBD',
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  buttonIcon: {
    marginLeft: 2,
  },
});
