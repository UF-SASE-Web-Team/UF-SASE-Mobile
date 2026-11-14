import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApplicationProgramCard } from '@/components/programs/ProgramCards';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { space } from '@/theme';
import { ProgramWithPoCs } from '@/types/programs';

interface HomeApplicationsSectionProps {
  programs: ProgramWithPoCs[];
  onProgramPress: (program: ProgramWithPoCs) => void;
}

export function HomeApplicationsSection({
  programs,
  onProgramPress,
}: HomeApplicationsSectionProps) {
  const router = useRouter();

  if (programs.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Open Applications"
        onSeeAll={() => router.push('/programs')}
        seeAllLabel="See all programs"
      />
      <FlatList
        data={programs}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={styles.horizontalListOuter}
        contentContainerStyle={styles.programsList}
        renderItem={({ item }) => (
          <ApplicationProgramCard program={item} onPress={onProgramPress} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: space['200'],
  },
  horizontalListOuter: {
    marginHorizontal: -space['400'],
  },
  programsList: {
    paddingHorizontal: space['400'],
    gap: space['300'],
  },
});
