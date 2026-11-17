import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LeaderboardRow } from '@/components/points/LeaderboardRow';
import { PointsInfoModal } from '@/components/points/PointsInfoModal';
import { PointsItem } from '@/components/points/PointsItem';
import { PointsProgressCard } from '@/components/points/PointsProgressCard';
import { SemesterStandingCard } from '@/components/points/SemesterStandingCard';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePointsLog } from '@/hooks/usePointsLog';
import { borderWidth, iconSize, radius, space, type Colors } from '@/theme';
import type { LeaderboardEntry } from '@/types/points';

type PointsTab = 'log' | 'leaderboard';

const TABS = [
  { label: 'My Points', value: 'log' },
  { label: 'Leaderboard', value: 'leaderboard' },
] as const;

/** True when the caller's own row is appended below the top list rather than part of it. */
function isDetachedRow(entries: LeaderboardEntry[], index: number) {
  const prev = entries[index - 1];
  return Boolean(prev) && entries[index].isMe && entries[index].rank > prev.rank + 1;
}

export default function PointsLogPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [tab, setTab] = useState<PointsTab>('log');

  const points = usePointsLog();
  const leaderboard = useLeaderboard(tab === 'leaderboard');

  const header = (
    <View style={styles.listHeader}>
      <PointsProgressCard
        totalPoints={points.totalPoints}
        error={tab === 'log' ? points.error : leaderboard.error}
        hasData={tab === 'log' ? points.entries.length > 0 : leaderboard.entries.length > 0}
      />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} testID="points-tabs" />
      {tab === 'leaderboard' && (
        <View style={styles.standing}>
          <SemesterStandingCard summary={points.summary} />
        </View>
      )}
    </View>
  );

  const renderRefresh = (refreshing: boolean, onRefresh: () => void) => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.surface.saseBlue.primary}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <BackButton />
        <Text variant="title" style={styles.headerTitle} accessibilityRole="header">
          Points
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How points work"
          testID="points-info-button"
          onPress={() => points.setShowInfo(true)}
          hitSlop={space['100']}
          style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
        >
          <Ionicons
            name="information-circle-outline"
            size={iconSize.md}
            color={colors.content.onBase.primary}
          />
        </Pressable>
      </View>

      {tab === 'log' ? (
        <FlatList
          key="log"
          data={points.entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.rowGap} />}
          refreshControl={renderRefresh(points.refreshing, points.handleRefresh)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            points.loading ? (
              <ActivityIndicator color={colors.surface.saseBlue.primary} />
            ) : (
              <EmptyState
                icon={points.error ? 'cloud-offline-outline' : 'star-outline'}
                tone={points.error ? 'orange' : 'yellow'}
                message={points.error ?? 'No check-ins yet. Check in at an event to earn points!'}
                actionLabel={points.error ? undefined : 'Browse events'}
                onAction={points.error ? undefined : () => router.push('/events')}
              />
            )
          }
          renderItem={({ item }) => (
            <PointsItem
              title={item.eventTitle}
              date={item.eventStartsAt}
              eventType={item.eventType}
              points={item.pointsValue}
            />
          )}
        />
      ) : (
        <FlatList
          key="leaderboard"
          data={leaderboard.entries}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.rowGap} />}
          refreshControl={renderRefresh(leaderboard.refreshing, leaderboard.handleRefresh)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            leaderboard.loading ? (
              <ActivityIndicator color={colors.surface.saseBlue.primary} />
            ) : (
              <EmptyState
                icon={leaderboard.error ? 'cloud-offline-outline' : 'trophy-outline'}
                tone={leaderboard.error ? 'orange' : 'yellow'}
                message={
                  leaderboard.error ??
                  'No one has earned points this semester yet. Check in at an event to take the lead!'
                }
              />
            )
          }
          renderItem={({ item, index }) => (
            <View>
              {isDetachedRow(leaderboard.entries, index) && (
                <Text
                  variant="bodyStrong"
                  color={colors.content.onBase.secondary}
                  style={styles.ellipsis}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  ⋯
                </Text>
              )}
              <LeaderboardRow entry={item} />
            </View>
          )}
        />
      )}

      <PointsInfoModal visible={points.showInfo} onClose={() => points.setShowInfo(false)} />
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
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['400'],
    },
    headerTitle: {
      flex: 1,
      color: colors.content.onBase.primary,
    },
    // Matches BackButton so the header reads as a balanced pair of circles.
    infoButton: {
      width: space['1000'],
      height: space['1000'],
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
      marginBottom: space['400'],
    },
    standing: {
      marginTop: space['400'],
    },
    listContent: {
      paddingHorizontal: space['400'],
      paddingBottom: space['800'],
    },
    rowGap: {
      height: space['200'],
    },
    ellipsis: {
      textAlign: 'center',
      paddingBottom: space['200'],
    },
  });
