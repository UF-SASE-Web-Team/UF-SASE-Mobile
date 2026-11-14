import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AccentIcon, type AccentTone } from '@/components/ui/AccentIcon';
import { SaseFlask } from '@/components/ui/SaseFlask';
import { Text } from '@/components/ui/Text';
import { useThemedStyles, useTheme } from '@/context/ThemeContext';
import { type Colors, iconSize, space } from '@/theme';
import { ResourceSection } from '@/types/resources';

type SectionIcon = {
  icon: React.ComponentProps<typeof AccentIcon>['icon'] | 'sase';
  tone: AccentTone;
};

// Accent icon shown before each section title, keyed by section key
const SECTION_ICONS: Record<string, SectionIcon> = {
  top: { icon: 'star-outline', tone: 'yellow' },
  sase: { icon: 'sase', tone: 'blue' },
  academic: { icon: 'school-outline', tone: 'orange' },
  professional: { icon: 'briefcase-outline', tone: 'green' },
  other: { icon: 'compass-outline', tone: 'pink' },
};

// SASE flask artwork is 626x858; keep that ratio at the standard icon height
const FLASK_WIDTH = Math.round((iconSize.md * 626) / 858);

export interface ResourceSectionHeaderProps {
  section: ResourceSection;
  isExpanded: boolean;
  onToggle: (sectionKey: string) => void;
}

export function ResourceSectionHeader({
  section,
  isExpanded,
  onToggle,
}: ResourceSectionHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const sectionIcon = SECTION_ICONS[section.key];

  const sectionTitle = (
    <View style={styles.sectionTitle}>
      {sectionIcon?.icon === 'sase' ? (
        <SaseFlask
          width={FLASK_WIDTH}
          height={iconSize.md}
          fill={colors.content.onBase.brand}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : sectionIcon ? (
        <AccentIcon icon={sectionIcon.icon} tone={sectionIcon.tone} size="md" />
      ) : null}
      <Text variant="title" style={styles.sectionTitleText} numberOfLines={1}>
        {section.title}
      </Text>
    </View>
  );

  if (section.collapsible) {
    return (
      <Pressable
        style={styles.collapsibleSectionHeader}
        onPress={() => onToggle(section.key)}
        accessibilityRole="button"
        accessibilityLabel={`Toggle ${section.title}`}
        accessibilityState={{ expanded: isExpanded }}
      >
        {sectionTitle}
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={iconSize.md}
          color={colors.content.onBase.brand}
        />
      </Pressable>
    );
  }

  return <View style={styles.staticSectionHeader}>{sectionTitle}</View>;
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    staticSectionHeader: {
      marginBottom: space['300'],
    },
    collapsibleSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: space['200'],
      paddingVertical: space['150'],
      marginBottom: space['300'],
    },
    sectionTitle: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    sectionTitleText: {
      flex: 1,
    },
  });
