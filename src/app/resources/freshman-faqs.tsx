import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FaqAccordionItem } from '@/components/resources/FaqAccordionItem';
import { FaqHeader } from '@/components/resources/FaqHeader';
import { Text } from '@/components/ui/Text';
import { useThemedStyles } from '@/context/ThemeContext';
import { FAQ_CATEGORIES, FRESHMAN_FAQS, type FaqCategory, type FaqItem } from '@/data/freshmanFaqs';
import { type Colors, space } from '@/theme';

export default function FreshmanFaqsPage() {
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

  const renderFaqCard = ({ item }: { item: FaqItem }) => (
    <FaqAccordionItem
      item={item}
      isExpanded={expandedIds.has(item.id)}
      onToggle={() => toggleFaq(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={filteredFaqs}
        keyExtractor={(item) => item.id}
        renderItem={renderFaqCard}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <FaqHeader
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            categoryTitle={activeCategoryConfig.label}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="body" color={styles.emptyText.color}>
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
    itemSeparator: {
      height: space['500'],
    },
    emptyContainer: {
      paddingVertical: space['800'],
      alignItems: 'center',
    },
    emptyText: {
      color: colors.content.onBase.secondary,
    },
  });
