import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { ResourceCard } from '@/components/resources/ResourceCard';
import { ResourceSectionHeader } from '@/components/resources/ResourceSectionHeader';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useResources } from '@/hooks/useResources';
import { type Colors, space } from '@/theme';
import { ResourceRow, isInternalResource } from '@/types/resources';

export default function ResourcesPage() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    sectionListData,
    loading,
    refreshing,
    error,
    openSections,
    handleRefresh,
    toggleSection,
    handleCardPress,
  } = useResources();

  // Calculate card width for 2-column layout (16px screen padding on each side, 12px gap)
  const cardWidth = Math.max(140, Math.floor((width - space['400'] * 2 - space['300']) / 2));

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
      <SectionList
        sections={sectionListData}
        keyExtractor={(item) => item.map((r) => r.id).join('-')}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="display">Resources</Text>
          </View>
        }
        ListEmptyComponent={
          sectionListData.length === 0 ? (
            <EmptyState icon="folder-open-outline" message="No resources yet. Check back soon!" />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <ResourceSectionHeader
            section={section}
            isExpanded={Boolean(openSections[section.key])}
            onToggle={toggleSection}
          />
        )}
        renderItem={({ item }: { item: ResourceRow[] }) => (
          <View style={styles.gridRow}>
            {item.map((resource) => (
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
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        renderSectionFooter={() => <View style={styles.sectionFooter} />}
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
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['800'],
    },
    header: {
      marginBottom: space['400'],
    },
    gridRow: {
      flexDirection: 'row',
      gap: space['300'],
    },
    rowSeparator: {
      height: space['300'],
    },
    sectionFooter: {
      height: space['400'],
    },
    errorText: {
      textAlign: 'center',
      padding: space['400'],
    },
  });
