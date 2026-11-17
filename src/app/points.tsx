import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PointsInfoModal } from '@/components/points/PointsInfoModal';
import { PointsItem } from '@/components/points/PointsItem';
import { PointsProgressCard } from '@/components/points/PointsProgressCard';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { usePointsLog } from '@/hooks/usePointsLog';
import { borderWidth, iconSize, radius, space, type Colors } from '@/theme';

export default function PointsLogPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    entries,
    loading,
    refreshing,
    error,
    showInfo,
    setShowInfo,
    totalPoints,
    rank,
    handleRefresh,
  } = usePointsLog();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.toolbar}>
          <View style={styles.headerSide}>
            <BackButton />
          </View>

          <View style={styles.headerCenter} pointerEvents="none">
            <Text variant="bodyStrong" style={styles.headerTitle} accessibilityRole="header">
              Points
            </Text>
          </View>

          <View style={[styles.headerSide, styles.headerRight]}>
            <Pressable
              accessibilityLabel="How Points Work"
              accessibilityRole="button"
              testID="points-info-button"
              onPress={() => setShowInfo(true)}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <Ionicons
                name="information-circle-outline"
                size={iconSize.md}
                color={colors.content.onBase.primary}
              />
            </Pressable>

            <Pressable
              accessibilityLabel="View Leaderboard"
              accessibilityRole="button"
              testID="points-leaderboard-button"
              onPress={() => router.push('/leaderboard')}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            >
              <Ionicons
                name="trophy-outline"
                size={iconSize.md}
                color={colors.content.onBase.primary}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {loading && entries.length === 0 ? (
        <LoadingState accessibilityLabel="Loading points" />
      ) : error && entries.length === 0 ? (
        <ErrorState
          error={error}
          title="Couldn't load points"
          onRetry={handleRefresh}
          isRetrying={refreshing}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.surface.saseBlue.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <PointsProgressCard
                totalPoints={totalPoints}
                rank={rank}
                error={error}
                entriesCount={entries.length}
                onOpenInfo={() => setShowInfo(true)}
                onOpenLeaderboard={() => router.push('/leaderboard')}
              />
              <View style={styles.sectionHeaderRow}>
                <Text variant="bodySmStrong" color={colors.content.onBase.secondary}>
                  Ledger
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon="star-outline" tone="blue" message="No points yet" />
          }
          renderItem={({ item, index }) => (
            <PointsItem
              title={item.title}
              date={item.date}
              category={item.category}
              pointsValue={item.pointsValue}
              isFirst={index === 0}
              isLast={index === entries.length - 1}
            />
          )}
        />
      )}

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
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
      paddingBottom: space['300'],
    },
    toolbar: {
      height: 44,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    },
    headerSide: {
      minWidth: 44,
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
    },
    headerRight: {
      justifyContent: 'flex-end',
      gap: space['200'],
    },
    headerCenter: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.content.onBase.primary,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.base.secondary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    pressed: {
      opacity: 0.7,
    },
    listHeader: {
      gap: space['200'],
      marginBottom: space['200'],
    },
    sectionHeaderRow: {
      paddingTop: space['200'],
      paddingBottom: space['100'],
    },
    listContent: {
      paddingHorizontal: space['400'],
      paddingBottom: space['1000'],
    },
  });
