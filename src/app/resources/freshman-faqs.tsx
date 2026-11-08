import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { FAQ_CATEGORIES, FRESHMAN_FAQS, type FaqCategory, type FaqItem } from '@/data/freshmanFaqs';
import { type Colors, radius, space } from '@/theme';

export default function FreshmanFaqsPage() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [activeCategory, setActiveCategory] = useState<FaqCategory>('academic');
  // First academic question expanded initially, matching the design
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['acad-1']));

  const activeCategoryConfig = useMemo(
    () => FAQ_CATEGORIES.find((c) => c.key === activeCategory) || FAQ_CATEGORIES[0],
    [activeCategory],
  );

  const filteredFaqs = useMemo(
    () => FRESHMAN_FAQS.filter((faq) => faq.category === activeCategory),
    [activeCategory],
  );

  const toggleFaq = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderFaqCard = ({ item }: { item: FaqItem }) => {
    const isExpanded = expandedIds.has(item.id);

    return (
      <View style={styles.cardWrapper}>
        {isExpanded && <View style={styles.offsetShadow} />}
        <Pressable
          style={styles.card}
          onPress={() => toggleFaq(item.id)}
          accessibilityRole="button"
          accessibilityLabel={item.question}
          accessibilityState={{ expanded: isExpanded }}
        >
          <View style={styles.questionContainer}>
            <View style={styles.questionRow}>
              <Text variant="bodySmStrong" style={styles.questionText}>
                {item.question}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={styles.chevronColor.color}
              />
            </View>
          </View>

          {isExpanded && (
            <View style={styles.answerContainer}>
              {typeof item.answer === 'string' ? (
                <Text variant="bodySm" color={colors.content.onBase.secondary}>
                  {item.answer}
                </Text>
              ) : (
                item.answer
              )}
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={filteredFaqs}
        keyExtractor={(item) => item.id}
        renderItem={renderFaqCard}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            {/* Top Bar with Standardized Back Button */}
            <View style={styles.topBar}>
              <BackButton fallbackRoute="/(tabs)/resources" />
            </View>

            {/* Display Title Container with Decorative Rings anchored behind the last 'S' in FAQS */}
            <View style={styles.titleContainer}>
              <View style={styles.titleWrapper}>
                <Image
                  source={require('@/assets/rings.png')}
                  style={styles.decorativeRings}
                  resizeMode="contain"
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
                    onPress={() => setActiveCategory(cat.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={cat.label}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={22}
                      color={isSelected ? styles.activeTabIcon.color : styles.inactiveTabIcon.color}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Category Title Heading */}
            <View style={styles.categoryTitleContainer}>
              <Text variant="title">{activeCategoryConfig.label}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" color={styles.inactiveTabIcon.color}>
              No FAQs available in this category.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    scrollContent: {
      paddingHorizontal: space['400'],
      paddingBottom: space['800'],
    },
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
    activeTabIcon: {
      color: colors.surface.saseBlue.primary,
    },
    inactiveTabIcon: {
      color: colors.content.onBase.secondary,
    },
    categoryTitleContainer: {
      marginTop: space['400'],
      marginBottom: space['100'],
    },
    itemSeparator: {
      height: space['500'],
    },
    cardWrapper: {
      position: 'relative',
    },
    offsetShadow: {
      position: 'absolute',
      top: 6,
      left: 6,
      right: -6,
      bottom: -6,
      borderRadius: radius.lg,
      backgroundColor: colors.surface.saseBlue.primary,
      zIndex: 0,
    },
    card: {
      backgroundColor: colors.surface.base.tertiary,
      borderRadius: radius.lg,
      overflow: 'hidden',
      zIndex: 1,
    },
    questionContainer: {
      backgroundColor: colors.surface.base.tertiary,
      padding: space['400'],
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space['200'],
    },
    questionText: {
      flex: 1,
    },
    answerContainer: {
      backgroundColor: colors.surface.base.secondary,
      padding: space['400'],
    },
    chevronColor: {
      color: colors.content.onBase.primary,
    },
    emptyContainer: {
      paddingVertical: space['800'],
      alignItems: 'center',
    },
  });
