import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { type AccentTone } from '@/components/AccentIcon';
import { ApplicationProgramCard, StandardProgramCard } from '@/components/ProgramCards';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getOpenApplicationPrograms } from '@/lib/programs';
import { getPrograms } from '@/services/programs';
import { type Colors, space } from '@/theme';
import { ProgramCategory, ProgramWithPoCs } from '@/types/programs';

const CATEGORY_SECTIONS: {
  key: ProgramCategory;
  title: string;
  icon: React.ComponentProps<typeof SectionHeader>['icon'];
  tone: AccentTone;
}[] = [
  { key: 'events_and_committees', title: 'Leadership', icon: 'ribbon-outline', tone: 'orange' },
  {
    key: 'technical_and_research',
    title: 'Professional Development',
    icon: 'briefcase-outline',
    tone: 'green',
  },
  { key: 'community', title: 'Community', icon: 'heart-outline', tone: 'pink' },
];

export default function ProgramsPage() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramWithPoCs[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getPrograms()
      .then((formattedPrograms) => {
        if (!isMounted) return;
        setPrograms(formattedPrograms);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching programs:', err.message);
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
    try {
      const formattedPrograms = await getPrograms();
      setPrograms(formattedPrograms);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching programs:', err.message);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Duplicate programs that have application info filled out and are not closed,
  // ordered by closest deadline (closes_at) first.
  const openApplicationPrograms = useMemo(() => getOpenApplicationPrograms(programs), [programs]);

  const handleCardPress = (program: ProgramWithPoCs) => {
    router.push({
      pathname: `/programs/${program.slug}`,
      params: { name: program.name },
    } as any);
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
        {CATEGORY_SECTIONS.map((section) => {
          const categoryPrograms = programs.filter((p) => p.category === section.key);

          if (categoryPrograms.length === 0) return null;

          return (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <SectionHeader title={section.title} icon={section.icon} tone={section.tone} />
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categoryPrograms}
                keyExtractor={(item) => `${section.key}-${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <StandardProgramCard program={item} onPress={handleCardPress} />
                )}
              />
            </View>
          );
        })}

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
