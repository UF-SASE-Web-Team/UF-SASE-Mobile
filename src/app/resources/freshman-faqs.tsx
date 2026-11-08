import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { type Colors, radius, space } from '@/theme';

export type FaqCategory = 'academic' | 'professional' | 'community' | 'general';

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export interface FaqCategoryConfig {
  key: FaqCategory;
  label: string;
  icon: 'school-outline' | 'briefcase-outline' | 'people-outline' | 'help-circle-outline';
}

export const FAQ_CATEGORIES: FaqCategoryConfig[] = [
  { key: 'academic', label: 'Academic', icon: 'school-outline' },
  { key: 'professional', label: 'Professional', icon: 'briefcase-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'general', label: 'General', icon: 'help-circle-outline' },
];

export const FRESHMAN_FAQS: FaqItem[] = [
  // Academic
  {
    id: 'acad-1',
    category: 'academic',
    question: 'How do I find study groups for STEM classes?',
    answer:
      'SASE hosts regular Study Hours throughout the semester and maintains the Class Connector sheet where you can connect with peers taking the same engineering, science, and math courses.',
  },
  {
    id: 'acad-2',
    category: 'academic',
    question: 'Where is the SASE Pi Room / Marston study room?',
    answer:
      'The Pi Room is located in the Marston Science Library. SASE members can reserve it for study sessions and group projects using the Pi Room Booking link in Resources.',
  },
  {
    id: 'acad-3',
    category: 'academic',
    question: 'How can I get involved in undergraduate research?',
    answer:
      'UF SASE provides a Research Guide with tips on cold emailing professors, finding lab openings across Herbert Wertheim College of Engineering, and applying for research programs like CUR.',
  },
  {
    id: 'acad-4',
    category: 'academic',
    question: 'What are Design Teams and how do I join?',
    answer:
      'Design Teams are hands-on student engineering project teams (e.g. Solar Gators, Swamp Launch, GRiP). Check our Design Team List resource for recruitment cycles and meeting times.',
  },

  // Professional
  {
    id: 'prof-1',
    category: 'professional',
    question: 'What is the SASE Resume Template?',
    answer:
      'Our resume template is curated by upperclassmen and industry mentors, specifically tailored for engineering and tech students applying to internships and Career Showcase.',
  },
  {
    id: 'prof-2',
    category: 'professional',
    question: 'How can I prepare for the UF Career Showcase?',
    answer:
      'SASE hosts resume review sessions, elevator pitch workshops, and mock interview prep before Career Showcase. Be sure to check the Events tab for upcoming sessions.',
  },
  {
    id: 'prof-3',
    category: 'professional',
    question: 'How do I connect with SASE alumni?',
    answer:
      'We connect students with alumni working across top tech and engineering companies through our Alumni Panel events, mentorship program, and our LinkedIn network.',
  },
  {
    id: 'prof-4',
    category: 'professional',
    question: 'What should I track in the Experience Tracker?',
    answer:
      'Use the Experience Tracker to log technical projects, hackathons, volunteer work, and skills so you can easily reference them when applying for jobs and writing cover letters.',
  },

  // Community
  {
    id: 'comm-1',
    category: 'community',
    question: 'What is the SASE Mentorship Program?',
    answer:
      'Our Big/Little Mentorship Program pairs freshmen and new members with experienced upperclassmen to help guide you through academics, campus life, and career goals.',
  },
  {
    id: 'comm-2',
    category: 'community',
    question: 'How often are General Body Meetings (GBMs)?',
    answer:
      'GBMs are held bi-weekly on campus! They feature guest speakers, fun team activities, announcements for upcoming events, and free food.',
  },
  {
    id: 'comm-3',
    category: 'community',
    question: 'What sports or intramurals does SASE participate in?',
    answer:
      'SASE fields intramural teams each semester for volleyball, soccer, basketball, and flag football. All members of any skill level are welcome to join!',
  },
  {
    id: 'comm-4',
    category: 'community',
    question: 'How do I join SASE committees?',
    answer:
      'Committee applications open at the start of each semester for roles in marketing, web development, event planning, and fundraising. Details are shared at GBMs and on Discord.',
  },

  // General
  {
    id: 'gen-1',
    category: 'general',
    question: 'How do I become an active UF SASE member?',
    answer:
      'Attend GBMs, socials, and workshops, and check in via the SASE Mobile app to earn attendance points towards active membership perks and end-of-semester banquet recognition.',
  },
  {
    id: 'gen-2',
    category: 'general',
    question: 'Where can I find the SASE calendar and social links?',
    answer:
      'All links including our Google Calendar, Discord server, Instagram, and Linktree are available right in the Resources tab of this app.',
  },
  {
    id: 'gen-3',
    category: 'general',
    question: 'Who do I contact if I have questions?',
    answer:
      'You can reach out to board officers during Board Office Hours, message officers on Discord, or DM @ufsase on Instagram.',
  },
];

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
              <Text variant="bodySm" color={colors.content.onBase.secondary}>
                {item.answer}
              </Text>
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
