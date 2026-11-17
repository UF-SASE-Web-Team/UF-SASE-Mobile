import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgramDetailsContent } from '@/components/programs/ProgramDetailsContent';
import { ProgramHeroBanner } from '@/components/programs/ProgramHeroBanner';
import { BackButton } from '@/components/ui/BackButton';
import { ContactItem } from '@/components/ui/ContactList';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { useThemedStyles } from '@/context/ThemeContext';
import { useProgramDetail } from '@/hooks/useProgramDetail';
import { space, type Colors } from '@/theme';

interface ProgramDetailScreenProps {
  onContactPress?: (contact: ContactItem) => void;
}

export default function ProgramDetailScreen({ onContactPress }: ProgramDetailScreenProps = {}) {
  const { slug, name: paramName } = useLocalSearchParams<{ slug: string; name?: string }>();
  const styles = useThemedStyles(createStyles);

  const {
    program,
    programName,
    description,
    action,
    pocContacts,
    loading,
    error,
    isRetrying,
    reloadProgram,
    openAction,
  } = useProgramDetail(slug, paramName);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <BackButton fallbackRoute="/programs" />
      </View>

      {loading ? (
        <LoadingState accessibilityLabel="Loading program details" />
      ) : error || !program ? (
        <ErrorState
          error={error}
          title="Couldn't load program"
          message={error || 'Program not found.'}
          onRetry={reloadProgram}
          isRetrying={isRetrying}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ProgramHeroBanner programName={programName} />

          <ProgramDetailsContent
            description={description}
            action={action}
            pocContacts={pocContacts}
            onOpenAction={openAction}
            onContactPress={onContactPress}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    header: {
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
    },
    scrollContent: {
      paddingBottom: space['1000'],
    },
  });
