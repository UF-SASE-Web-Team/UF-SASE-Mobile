import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import {
  ApplicationProgramCard,
  ProgramCategory,
  ProgramWithPoCs,
  StandardProgramCard,
} from '@/components/ProgramCards';

const CATEGORY_SECTIONS: { key: ProgramCategory; title: string }[] = [
  { key: 'events_and_committees', title: 'Events and Committees' },
  { key: 'technical_and_research', title: 'Professional Development' },
  { key: 'community', title: 'Community' },
];

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramWithPoCs[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrograms = async () => {
    try {
      setError(null);

      // Left-join program_members so programs without PoCs (or viewed by anon users) still load
      const { data, error: fetchError } = await supabase
        .from('programs')
        .select(`
          id,
          parent_id,
          name,
          slug,
          category,
          display_order,
          short_description,
          description,
          image_url,
          is_active,
          application_url,
          opens_at,
          closes_at,
          created_at,
          updated_at,
          program_members (
            id,
            user_id,
            display_name,
            is_poc,
            academic_term,
            profile:profiles (
              id,
              full_name,
              avatar_url
            ),
            term:academic_terms (
              is_current
            )
          )
        `)
        .eq('is_active', true)
        .eq('program_members.is_poc', true)
        .eq('program_members.term.is_current', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedPrograms: ProgramWithPoCs[] = (data || []).map((prog: any) => {
        // Filter out any member rows where the nested current term didn't match
        const activePocs = (prog.program_members || []).filter(
          (m: any) => m.is_poc && m.term?.is_current
        );
        return {
          ...prog,
          pocs: activePocs,
        };
      });

      setPrograms(formattedPrograms);
    } catch (err: any) {
      console.error('Error fetching programs:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  // Duplicate programs that have application info filled out and are not closed,
  // ordered by closest deadline (closes_at) first.
  const openApplicationPrograms = useMemo(() => {
    const now = new Date();

    return programs
      .filter((p) => {
        const hasAppInfo = Boolean(p.application_url || p.opens_at || p.closes_at);
        if (!hasAppInfo) return false;

        const isClosed = p.closes_at ? new Date(p.closes_at) <= now : false;
        return !isClosed;
      })
      .sort((a, b) => {
        const deadlineA = a.closes_at ? new Date(a.closes_at).getTime() : Infinity;
        const deadlineB = b.closes_at ? new Date(b.closes_at).getTime() : Infinity;

        if (deadlineA !== deadlineB) {
          return deadlineA - deadlineB;
        }

        const opensA = a.opens_at ? new Date(a.opens_at).getTime() : Infinity;
        const opensB = b.opens_at ? new Date(b.opens_at).getTime() : Infinity;
        return opensA - opensB;
      });
  }, [programs]);

  const handleCardPress = (program: ProgramWithPoCs) => {
    // Navigate to program detail screen, e.g. router.push(`/programs/${program.slug}`)
    console.log('Pressed program:', program.slug);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text style={styles.errorText}>Failed to load programs: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Top Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Programs</Text>
          <View style={styles.avatarPlaceholder} />
        </View>

        {/* Row 0: Open Applications (Duplicated & Sorted by Closest Deadline) */}
        {openApplicationPrograms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Open Applications</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={openApplicationPrograms}
              keyExtractor={(item) => `app-${item.id}`}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ApplicationProgramCard
                  program={item}
                  onPress={handleCardPress}
                />
              )}
            />
          </View>
        )}

        {/* Rows 1-3: Category Rows */}
        {CATEGORY_SECTIONS.map((section) => {
          const categoryPrograms = programs.filter(
            (p) => p.category === section.key
          );

          if (categoryPrograms.length === 0) return null;

          return (
            <View key={section.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categoryPrograms}
                keyExtractor={(item) => `${section.key}-${item.id}`}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <StandardProgramCard
                    program={item}
                    onPress={handleCardPress}
                  />
                )}
              />
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D9D9D9',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
    padding: 16,
  },
});
