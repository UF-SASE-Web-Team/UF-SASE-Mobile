import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackButton } from '@/components/ui/BackButton';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { FAQ_CATEGORIES, type FaqCategory } from '@/data/freshmanFaqs';
import { GRAPHICS } from '@/lib/assets';
import { type Colors, radius, space } from '@/theme';

export interface FaqHeaderProps {
  activeCategory: FaqCategory;
  onSelectCategory: (category: FaqCategory) => void;
  categoryTitle: string;
}

export function FaqHeader({ activeCategory, onSelectCategory, categoryTitle }: FaqHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.headerArea}>
      {/* Top Bar with Standardized Back Button */}
      <View style={styles.topBar}>
        <BackButton fallbackRoute="/(tabs)/resources" />
      </View>

      {/* Display Title Container with Decorative Rings anchored behind the last 'S' in FAQS */}
      <View style={styles.titleContainer}>
        <View style={styles.titleWrapper}>
          <Image
            source={GRAPHICS.rings}
            style={styles.decorativeRings}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessibilityRole="none"
            importantForAccessibility="no"
            accessibilityElementsHidden
          />
          <Text variant="display" style={styles.pageTitle}>
            Freshmen FAQS
          </Text>
        </View>
      </View>

      {/* Segmented Category Tab Bar */}
      <View style={styles.segmentBar} accessibilityRole="tablist">
        {FAQ_CATEGORIES.map((cat) => {
          const isSelected = cat.key === activeCategory;
          return (
            <Pressable
              key={cat.key}
              style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
              onPress={() => onSelectCategory(cat.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={cat.label}
            >
              <Ionicons
                name={cat.icon}
                size={22}
                color={
                  isSelected ? colors.surface.saseBlue.primary : colors.content.onBase.secondary
                }
              />
            </Pressable>
          );
        })}
      </View>

      {/* Category Title Heading */}
      <View style={styles.categoryTitleContainer}>
        <Text variant="title">{categoryTitle}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    headerArea: {
      marginBottom: space['400'],
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: space['200'],
      paddingBottom: space['200'],
    },
    titleWrapper: {
      position: 'relative',
      alignSelf: 'center',
    },
    pageTitle: {
      color: colors.surface.saseBlue.primary,
      textAlign: 'center',
    },
    decorativeRings: {
      position: 'absolute',
      width: 95,
      height: 85,
      right: -55,
      top: -40,
      zIndex: 1,
    },
    segmentBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.md,
      padding: space['100'],
      gap: space['100'],
      marginTop: space['200'],
    },
    segmentTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space['250'],
      borderRadius: radius.md,
    },
    segmentTabActive: {
      backgroundColor: colors.surface.base.primary,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    categoryTitleContainer: {
      marginTop: space['400'],
      marginBottom: space['100'],
    },
  });
