import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PointsInfoModal } from '@/components/points/PointsInfoModal';
import { PointsItem } from '@/components/points/PointsItem';
import { PointsProgressCard } from '@/components/points/PointsProgressCard';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { usePointsLog } from '@/hooks/usePointsLog';
import { space, type Colors } from '@/theme';
import { EventType } from '@/types/events';

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gbm: 'GBM',
  career: 'Pro Dev',
  social: 'Social',
  service: 'Service',
  sports: 'Sports',
  team: 'Team',
  other: 'Other',
};

export default function PointsLogPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const { entries, loading, refreshing, error, showInfo, setShowInfo, totalPoints, handleRefresh } =
    usePointsLog();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle} accessibilityRole="header">
          Points Log
        </Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
        ListHeaderComponent={
          <PointsProgressCard
            totalPoints={totalPoints}
            error={error}
            entriesCount={entries.length}
            onOpenInfo={() => setShowInfo(true)}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.surface.saseBlue.primary} />
          ) : (
            <EmptyState
              icon={error ? 'cloud-offline-outline' : 'star-outline'}
              tone={error ? 'orange' : 'yellow'}
              message={error ?? 'No check-ins yet. Check in at an event to earn points!'}
              actionLabel={error ? undefined : 'Browse events'}
              onAction={error ? undefined : () => router.push('/events')}
            />
          )
        }
        renderItem={({ item }) => (
          <PointsItem
            title={item.eventTitle}
            date={item.eventStartsAt}
            category={EVENT_TYPE_LABELS[item.eventType]}
          />
        )}
      />

      <PointsInfoModal visible={showInfo} onClose={() => setShowInfo(false)} />
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      paddingHorizontal: 20,
      paddingTop: space['300'],
      paddingBottom: space['400'],
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.content.onBase.primary,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: space['800'],
    },
    separator: {
      height: 1,
      backgroundColor: colors.border.base.subtle,
      marginVertical: space['200'],
    },
  });
