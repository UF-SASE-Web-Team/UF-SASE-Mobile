import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, radius, space, type Colors } from '@/theme';

interface PointsInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

const EARNING_CATEGORIES = [
  {
    category: 'Digital Engagement',
    examples: ['Create SASE Account', 'Report verified bug', 'Write a blog on the SASE Website'],
  },
  {
    category: 'Attendance',
    examples: [
      'GBM',
      'Workshops / ProDev',
      'Socials',
      'Volunteering',
      'STEM Connect / SERC Conference',
      'Team Meeting',
    ],
  },
  {
    category: 'Club Commitment',
    examples: ['Mentor - Mentee', 'Program Member', 'Carpooling'],
  },
];

export function PointsInfoModal({ visible, onClose }: PointsInfoModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ModalSheet title="Points Info" visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Core Distinction Callout */}
        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text variant="bodyStrong" color={colors.content.onBase.primary}>
              1. Spendable Points
            </Text>
          </View>
          <Text variant="body" color={colors.content.onBase.secondary}>
            Points are a running total earned through events, digital engagement, and club
            commitment. Points will be spendable through the SASE Marketplace (coming Spring 2027)
            for merchandise.
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text variant="bodyStrong" color={colors.content.onBase.primary}>
              2. Attendance & Free Shirt
            </Text>
          </View>
          <Text variant="body" color={colors.content.onBase.secondary}>
            Check-ins tracks the number of SASE events you attend each semester. Attending{' '}
            <Text variant="bodyStrong" color={colors.content.onBase.primary}>
              4 events before GBM 4
            </Text>{' '}
            earns you the free SASE semester shirt!
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <View style={styles.ruleHeader}>
            <Text variant="bodyStrong" color={colors.content.onBase.primary}>
              3. Ways to Earn Points
            </Text>
          </View>
          <View style={styles.categoryList}>
            {EARNING_CATEGORIES.map((section) => (
              <View key={section.category} style={styles.categoryGroup}>
                <Text variant="bodySmStrong" color={colors.content.onBase.primary}>
                  {section.category}
                </Text>
                <View style={styles.exampleList}>
                  {section.examples.map((example) => (
                    <View key={example} style={styles.bulletRow}>
                      <Text
                        variant="bodySm"
                        color={colors.content.onBase.secondary}
                        style={styles.bullet}
                      >
                        •
                      </Text>
                      <Text
                        variant="bodySm"
                        color={colors.content.onBase.secondary}
                        style={styles.bulletText}
                      >
                        {example}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <Button
          variant="secondary"
          size="md"
          onPress={onClose}
          accessibilityLabel="Back to Points"
          testID="points-info-close"
          style={styles.button}
        >
          Got It
        </Button>
      </ScrollView>
    </ModalSheet>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    content: {
      gap: space['300'],
      paddingTop: space['200'],
      paddingBottom: 0,
    },
    ruleCard: {
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.lg,
      padding: space['400'],
      gap: space['150'],
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    ruleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryList: {
      gap: space['300'],
      paddingTop: space['100'],
    },
    categoryGroup: {
      gap: space['100'],
    },
    exampleList: {
      gap: space['100'],
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space['150'],
    },
    bullet: {
      lineHeight: 20,
    },
    bulletText: {
      flex: 1,
      lineHeight: 20,
    },
    button: {
      marginTop: 0,
    },
  });
