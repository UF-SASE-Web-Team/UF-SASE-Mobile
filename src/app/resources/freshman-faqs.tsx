import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { FAQ_CATEGORIES, FRESHMAN_FAQS, FaqCategory, FaqItem } from '@/data/freshmanFaqs';
import { type Colors, fonts, radius, space } from '@/theme';

export default function FreshmanFaqsPage() {
  const router = useRouter();
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
          <View style={styles.questionRow}>
            <Text style={styles.questionText}>{item.question}</Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={styles.chevronColor.color}
            />
          </View>

          {isExpanded && (
            <View style={styles.answerContainer}>
              <Text style={styles.answerText}>{item.answer}</Text>
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
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.headerArea}>
            {/* Top Bar with Circular Back Button, Title, and Decorative Rings */}
            <View style={styles.navRow}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color={styles.iconColor.color} />
              </Pressable>

              <View style={styles.titleCenter}>
                <Text variant="display" style={styles.pageTitle}>
                  Freshmen FAQS
                </Text>
              </View>

              {/* Decorative brand circles graphic in top-right */}
              <View style={styles.decorativeCircles} pointerEvents="none">
                <View style={[styles.circleRing, styles.circleRingLarge]} />
                <View style={[styles.circleRing, styles.circleRingSmall]} />
                <View style={[styles.circleRing, styles.circleRingMini]} />
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
              <Text style={styles.categoryTitle}>{activeCategoryConfig.label}</Text>
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
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: space['200'],
      position: 'relative',
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border.base.strong,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    titleCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 38, // Balance out the back button width to keep title perfectly centered
    },
    pageTitle: {
      fontFamily: fonts.display.bold,
      fontSize: 32,
      lineHeight: 38,
      color: colors.surface.saseBlue.secondary,
      textAlign: 'center',
    },
    decorativeCircles: {
      position: 'absolute',
      right: -8,
      top: -4,
      width: 80,
      height: 50,
      overflow: 'hidden',
    },
    circleRing: {
      position: 'absolute',
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: colors.surface.saseBlue.primary,
      opacity: 0.35,
    },
    circleRingLarge: {
      width: 44,
      height: 44,
      right: 14,
      top: 4,
    },
    circleRingSmall: {
      width: 28,
      height: 28,
      right: 2,
      top: 14,
    },
    circleRingMini: {
      width: 16,
      height: 16,
      right: 48,
      top: 2,
    },
    segmentBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.md,
      padding: space['100'],
      marginTop: space['300'],
      marginBottom: space['400'],
      justifyContent: 'space-between',
    },
    segmentTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space['200'],
      borderRadius: radius.sm,
    },
    segmentTabActive: {
      backgroundColor: colors.surface.base.tertiary,
    },
    categoryTitleContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space['300'],
    },
    categoryTitle: {
      fontFamily: fonts.sans.bold,
      fontSize: 20,
      lineHeight: 26,
      color: colors.surface.saseBlue.secondary,
      textAlign: 'center',
    },
    cardWrapper: {
      marginBottom: space['300'],
      position: 'relative',
    },
    offsetShadow: {
      position: 'absolute',
      top: 6,
      left: 6,
      right: -4,
      bottom: -4,
      backgroundColor: colors.surface.saseBlue.primary,
      borderRadius: radius.lg,
    },
    card: {
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      padding: space['400'],
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    questionText: {
      flex: 1,
      fontFamily: fonts.sans.semibold,
      fontSize: 14,
      lineHeight: 20,
      color: colors.content.onBase.primary,
      marginRight: space['200'],
    },
    answerContainer: {
      marginTop: space['250'],
      paddingTop: space['150'],
    },
    answerText: {
      fontFamily: fonts.sans.regular,
      fontSize: 13,
      lineHeight: 19,
      color: colors.content.onBase.primary,
    },
    emptyContainer: {
      paddingVertical: space['800'],
      alignItems: 'center',
    },
    iconColor: {
      color: colors.content.onBase.primary,
    },
    chevronColor: {
      color: colors.content.onBase.primary,
    },
    activeTabIcon: {
      color: colors.surface.saseBlue.primary,
    },
    inactiveTabIcon: {
      color: colors.content.onBase.secondary,
    },
  });
