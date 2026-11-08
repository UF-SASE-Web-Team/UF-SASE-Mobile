import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ResourceCard } from '@/components/ResourceCard';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getResources } from '@/services/resources';
import { type Colors, fonts, space } from '@/theme';
import {
  ResourceRow,
  ResourceSection,
  getResourceDisplayName,
  getTopResourceOrder,
  isInternalResource,
  isTopResource,
} from '@/types/resources';

function chunkPairs<T>(items: T[]): { id: string; items: T[] }[] {
  const pairs: { id: string; items: T[] }[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const chunk = items.slice(i, i + 2);
    pairs.push({
      id: chunk.map((it: any) => it.id || it.name).join('-'),
      items: chunk,
    });
  }
  return pairs;
}

export default function ResourcesPage() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [resources, setResources] = useState<ResourceRow[]>([]);
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

  const fetchResources = async () => {
    try {
      const data = await getResources();
      setResources(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching resources:', err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getResources()
      .then((data) => {
        if (!isMounted) return;
        setResources(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching resources:', err.message);
        setError(err.message);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchResources();
    setRefreshing(false);
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleCardPress = async (resource: ResourceRow) => {
    if (isInternalResource(resource)) {
      // In-app navigation for internal resources (denoted by right chevron)
      const targetRoute = (resource as any).internal_route || '/resources/freshman-faqs';
      try {
        router.push(targetRoute as any);
      } catch {
        console.log('Internal route not yet implemented:', targetRoute);
      }
      return;
    }

    if (!resource.url) return;
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

  // Organize resources into sections
  const sections: ResourceSection[] = useMemo(() => {
    // 1. Top resources
    const topItems = resources
      .filter((r) => isTopResource(r))
      .sort((a, b) => getTopResourceOrder(a) - getTopResourceOrder(b));

    // Remaining non-top resources
    const nonTopItems = resources.filter((r) => !isTopResource(r));

    // 2. SASE resources
    const saseItems = nonTopItems
      .filter((r) => r.category === 'sase')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    // 3. Academic resources
    const academicItems = nonTopItems
      .filter((r) => r.category === 'academic')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    // 4. Professional resources
    const professionalItems = nonTopItems
      .filter((r) => r.category === 'professional')
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    // 5. Fallback for other resources (e.g. general resources not in Top)
    const otherItems = nonTopItems
      .filter(
        (r) => !r.category || !['sase', 'academic', 'professional'].includes(r.category as string),
      )
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const result: ResourceSection[] = [
      {
        key: 'top',
        title: 'Top Resources',
        collapsible: false,
        data: chunkPairs(topItems),
      },
      {
        key: 'sase',
        title: 'SASE Resources',
        collapsible: true,
        data: openSections.sase ? chunkPairs(saseItems) : [],
      },
      {
        key: 'academic',
        title: 'Academic',
        collapsible: true,
        data: openSections.academic ? chunkPairs(academicItems) : [],
      },
      {
        key: 'professional',
        title: 'Professional',
        collapsible: true,
        data: openSections.professional ? chunkPairs(professionalItems) : [],
      },
    ];

    if (otherItems.length > 0) {
      result.push({
        key: 'other',
        title: 'Other Resources',
        collapsible: true,
        data: openSections.other ? chunkPairs(otherItems) : [],
      });
    }

    return result;
  }, [resources, openSections]);

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
      <SectionList<any, ResourceSection>
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text variant="display">Resources</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const isExpanded = Boolean(openSections[section.key]);

          if (!section.collapsible) {
            return (
              <View style={styles.staticSectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            );
          }

          return (
            <Pressable
              style={styles.collapsibleSectionHeader}
              onPress={() => toggleSection(section.key)}
              accessibilityRole="button"
              accessibilityLabel={`Toggle ${section.title}`}
              accessibilityState={{ expanded: isExpanded }}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={styles.chevronColor.color}
              />
            </Pressable>
          );
        }}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            {item.items.map((resource: ResourceRow) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                displayName={getResourceDisplayName(resource.name)}
                isInternal={isInternalResource(resource)}
                width={cardWidth}
                onPress={handleCardPress}
              />
            ))}
          </View>
        )}
        renderSectionFooter={({ section }) => (
          <View
            style={
              section.data.length > 0 ? styles.sectionFooterExpanded : styles.sectionFooterCollapsed
            }
          />
        )}
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
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
    },
    scrollContent: {
      paddingBottom: space['800'],
    },
    headerContainer: {
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
      marginBottom: space['400'],
    },
    staticSectionHeader: {
      paddingHorizontal: space['400'],
      marginBottom: space['300'],
    },
    collapsibleSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space['400'],
      paddingVertical: space['150'],
      marginBottom: space['300'],
    },
    sectionTitle: {
      fontFamily: fonts.sans.bold,
      fontSize: 20,
      lineHeight: 24,
      color: colors.surface.saseBlue.secondary,
    },
    chevronColor: {
      color: colors.surface.saseBlue.secondary,
    },
    cardRow: {
      flexDirection: 'row',
      paddingHorizontal: space['400'],
      gap: space['300'],
      marginBottom: space['300'],
    },
    sectionFooterExpanded: {
      marginBottom: space['300'],
    },
    sectionFooterCollapsed: {
      marginBottom: space['100'],
    },
    errorText: {
      textAlign: 'center',
      padding: space['400'],
    },
  });
