import React from 'react';
import { Pressable, StyleSheet, TextLayoutEvent, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { iconSize, space, type Colors } from '@/theme';

interface EventAboutSectionProps {
  description?: string | null;
  isExpanded: boolean;
  shouldShowExpandButton: boolean;
  onToggleExpand: () => void;
  onTextLayout: (e: TextLayoutEvent) => void;
}

export function EventAboutSection({
  description,
  isExpanded,
  shouldShowExpandButton,
  onToggleExpand,
  onTextLayout,
}: EventAboutSectionProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Text variant="bodyStrong" style={styles.sectionTitle}>
        About
      </Text>
      <Text
        testID="event-about-text"
        variant="body"
        color={colors.content.onBase.secondary}
        style={styles.aboutText}
        numberOfLines={isExpanded ? undefined : 5}
        onTextLayout={onTextLayout}
      >
        {description || 'No description provided.'}
      </Text>
      {Boolean(description) && !shouldShowExpandButton && (
        <Text
          variant="body"
          style={[styles.aboutText, styles.hiddenAboutMeasure]}
          onTextLayout={onTextLayout}
          aria-hidden
        >
          {description}
        </Text>
      )}
      {shouldShowExpandButton && (
        <Pressable
          testID="event-about-toggle-button"
          onPress={onToggleExpand}
          style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Show less' : 'Show more'}
        >
          <Text
            variant="bodySmStrong"
            color={colors.content.onBase.brand}
            style={styles.expandButtonText}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={iconSize.sm}
            color={colors.content.onBase.brand}
          />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    section: {
      marginTop: space['300'],
      gap: space['150'],
    },
    sectionTitle: {
      marginBottom: space['050'],
    },
    aboutText: {
      lineHeight: 22,
    },
    hiddenAboutMeasure: {
      position: 'absolute',
      opacity: 0,
      left: 0,
      right: 0,
      zIndex: -1,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['050'],
      alignSelf: 'flex-start',
      marginTop: space['050'],
      paddingVertical: space['050'],
    },
    expandButtonPressed: {
      opacity: 0.6,
    },
    expandButtonText: {
      color: colors.content.onBase.brand,
    },
  });
