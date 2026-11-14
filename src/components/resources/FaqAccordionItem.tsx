import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { type FaqItem } from '@/data/freshmanFaqs';
import { type Colors, radius, space } from '@/theme';

export interface FaqAccordionItemProps {
  item: FaqItem;
  isExpanded: boolean;
  onToggle: () => void;
}

export function FaqAccordionItem({ item, isExpanded, onToggle }: FaqAccordionItemProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.cardWrapper}>
      {isExpanded && <View style={styles.offsetShadow} />}
      <Pressable
        style={styles.card}
        onPress={onToggle}
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
              color={colors.content.onBase.primary}
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
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
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
  });
