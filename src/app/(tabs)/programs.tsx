import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApplicationProgramCard, StandardProgramCard } from '@/components/programs/ProgramCards';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useProgramsFeed } from '@/hooks/useProgramsFeed';
import { type Colors, space } from '@/theme';

export default function ProgramsPage() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    programs,
    openApplicationPrograms,
    categorySections,
    loading,
    refreshing,
    error,
    handleRefresh,
    handleCardPress,
  } = useProgramsFeed();

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
        <Text variant="body" color={colors.content.onDanger.primary}>
          Failed to load programs: {error}
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
        {/* Top Header */}
        <View style={styles.header}>
          <Text variant="display">Programs</Text>
        </View>

        {/* Row 0: Open Applications (Duplicated & Sorted by Closest Deadline) */}
        {openApplicationPrograms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionHeader title="Open Applications" icon="create-outline" tone="blue" />
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={openApplicationPrograms}
              keyExtractor={(item) => `app-${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ApplicationProgramCard program={item} onPress={handleCardPress} />
              )}
            />
          </View>
        )}

        {/* Rows 1-3: Category Rows */}
        {categorySections.map((section) => (
          <View key={section.key} style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionHeader title={section.title} icon={section.icon} tone={section.tone} />
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={section.programs}
              keyExtractor={(item) => `${section.key}-${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <StandardProgramCard program={item} onPress={handleCardPress} />
              )}
            />
          </View>
        ))}

        {programs.length === 0 && <EmptyState icon="people-outline" message="No programs found." />}
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
      paddingTop: space['300'],
      paddingBottom: space['1000'],
    },
    header: {
      paddingHorizontal: space['400'],
      marginBottom: space['400'],
    },
    section: {
      marginBottom: space['600'],
    },
    sectionHeader: {
      paddingHorizontal: space['400'],
      marginBottom: space['100'],
    },
    horizontalList: {
      paddingLeft: space['400'],
      paddingRight: space['100'],
    },
  });
