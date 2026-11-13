import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AccentIcon, type AccentTone } from '@/components/AccentIcon';
import { EmptyState } from '@/components/EmptyState';
import { SaseFlask } from '@/components/icons';
import { ResourceCard } from '@/components/ResourceCard';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getResourceSections } from '@/services/resources';
import { type Colors, space, iconSize } from '@/theme';
import {
  ResourceRow,
  ResourceSection,
  isInternalResource,
  isInternalUrl,
  resolveInternalPath,
} from '@/types/resources';

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

export default function ResourcesPage() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [sections, setSections] = useState<ResourceSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Default state: all collapsible sections closed
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sase: false,
    academic: false,
    professional: false,
  });

  // Calculate card width for 2-column layout (16px screen padding on each side, 12px gap)
  const cardWidth = Math.max(140, Math.floor((width - space['400'] * 2 - space['300']) / 2));

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await getResourceSections();
        if (!isMounted) return;
        setSections(data);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching resources:', err.message);
        setError(err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getResourceSections();
      setSections(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleCardPress = async (resource: ResourceRow) => {
    if (!resource.url) return;

    if (isInternalUrl(resource.url)) {
      // In-app navigation for deeplinks (denoted by right chevron)
      const targetRoute = resolveInternalPath(resource.url);
      try {
        router.push(targetRoute as any);
      } catch (err: any) {
        console.warn(`Failed to navigate to route: ${targetRoute}`, err?.message);
      }
      return;
    }

    try {
      const supported = await Linking.canOpenURL(resource.url);
      if (supported) {
        await Linking.openURL(resource.url);
      } else {
        console.warn(`Cannot open URL: ${resource.url}`);
      }
    } catch (err: any) {
      console.error('Failed to open resource URL:', err.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.surface.saseBlue.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text variant="body" color={colors.content.onDanger.primary} style={styles.errorText}>
          Failed to load resources: {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text variant="display">Resources</Text>
        </View>

        {sections.length === 0 && (
          <EmptyState icon="folder-open-outline" message="No resources yet. Check back soon!" />
        )}

        {sections.map((section) => {
          const isExpanded = Boolean(openSections[section.key]);
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

          return (
            <View key={section.key} style={styles.sectionContainer}>
              {section.collapsible ? (
                <Pressable
                  style={styles.collapsibleSectionHeader}
                  onPress={() => toggleSection(section.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle ${section.title}`}
                  accessibilityState={{ expanded: isExpanded }}
                >
                  {sectionTitle}
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={iconSize.md}
                    color={styles.chevronColor.color}
                  />
                </Pressable>
              ) : (
                <View style={styles.staticSectionHeader}>{sectionTitle}</View>
              )}

              {(!section.collapsible || isExpanded) && (
                <View style={styles.gridContainer}>
                  {section.items.map((resource: ResourceRow) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      isInternal={isInternalResource(resource)}
                      width={cardWidth}
                      onPress={handleCardPress}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
    },
    scrollContent: {
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['800'],
    },
    header: {
      marginBottom: space['400'],
    },
    sectionContainer: {
      marginBottom: space['400'],
    },
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
    chevronColor: {
      color: colors.content.onBase.brand,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['300'],
    },
    errorText: {
      textAlign: 'center',
      padding: space['400'],
    },
  });
