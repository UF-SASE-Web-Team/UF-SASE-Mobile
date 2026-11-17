import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/ui/BackButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { getProfileAvatarSource } from '@/lib/profileAvatars';
import { getLeaderboard, type LeaderboardMember } from '@/services/points';
import { borderWidth, fonts, iconSize, radius, space, type Colors } from '@/theme';

type SemesterTab = 'fall_2026' | 'all_time';

const LEADERBOARD_TABS: SegmentedControlOption<SemesterTab>[] = [
  {
    value: 'fall_2026',
    label: 'Fall 2026',
    icon: 'calendar-clear-outline',
    accessibilityLabel: 'Fall 2026 leaderboard',
  },
  {
    value: 'all_time',
    label: 'All-Time',
    icon: 'infinite-outline',
    accessibilityLabel: 'All-Time leaderboard',
  },
];

const SEMESTER_TERM_IDS: Record<SemesterTab, string | null> = {
  fall_2026: 'fall-2026',
  all_time: null,
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [semester, setSemester] = useState<SemesterTab>('fall_2026');
  const [members, setMembers] = useState<LeaderboardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  const termId = SEMESTER_TERM_IDS[semester];

  useEffect(() => {
    let isMounted = true;

    getLeaderboard(termId)
      .then((data) => {
        if (!isMounted) return;
        setMembers(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.warn('Error fetching leaderboard:', err?.message || err);
        setError(getFriendlyErrorMessage(err, "Couldn't load leaderboard."));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [termId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getLeaderboard(termId);
      setMembers(data);
      setError(null);
    } catch (err: any) {
      console.warn('Error refreshing leaderboard:', err?.message || err);
      setError(getFriendlyErrorMessage(err, "Couldn't load leaderboard."));
    } finally {
      setRefreshing(false);
    }
  };

  const handleTabChange = (tab: SemesterTab) => {
    if (tab === semester) return;
    setLoading(true);
    setSemester(tab);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.toolbar}>
          <View style={styles.headerSide}>
            <BackButton />
          </View>

          <View style={styles.headerCenter} pointerEvents="none">
            <Text variant="bodyStrong" style={styles.headerTitle} accessibilityRole="header">
              Leaderboard
            </Text>
          </View>

          <View style={[styles.headerSide, styles.headerRight]} />
        </View>
      </View>

      {loading && members.length === 0 ? (
        <LoadingState accessibilityLabel="Loading leaderboard" />
      ) : error && members.length === 0 ? (
        <ErrorState
          error={error}
          title="Couldn't load leaderboard"
          onRetry={handleRefresh}
          isRetrying={refreshing}
        />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.userId || String(item.rank)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + space['600'] },
          ]}
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
              {/* Segmented Control */}
              <SegmentedControl
                options={LEADERBOARD_TABS}
                value={semester}
                onChange={handleTabChange}
                testID="leaderboard-tabs"
              />

              <View style={styles.sectionHeaderRow}>
                <Text variant="bodySmStrong" color={colors.content.onBase.secondary}>
                  Rankings
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="trophy-outline"
              tone="blue"
              message={
                semester === 'fall_2026'
                  ? 'No points earned for Fall 2026 yet.'
                  : 'No points earned yet.'
              }
            />
          }
          renderItem={({ item, index }) => {
            const initial = (item.name[0] || 'M').toUpperCase();
            const isFirst = index === 0;
            const isLast = index === members.length - 1;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.rankingRow,
                  isFirst && styles.firstRankingRow,
                  isLast && styles.lastRankingRow,
                  !isLast && styles.dividerRankingRow,
                  pressed && styles.rankingRowPressed,
                ]}
                testID={`leaderboard-row-${item.rank}`}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, rank ${item.rank}, ${item.points} points. View profile`}
                onPress={() => {
                  if (item.userId) {
                    router.push(`/profile/${item.userId}` as any);
                  }
                }}
              >
                <View style={styles.rankBadge}>
                  <Text variant="bodyStrong" style={styles.rankText}>
                    #{item.rank}
                  </Text>
                </View>

                <View style={styles.avatarWrapper}>
                  {item.avatarUrl ? (
                    <Image
                      source={getProfileAvatarSource(item.avatarUrl)}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      accessibilityLabel={`${item.name}'s profile picture`}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text variant="bodySmStrong" color={colors.content.onMedia.primary}>
                        {initial}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.memberInfo}>
                  <Text variant="bodyStrong" style={styles.memberName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>

                <View style={styles.pointsContainer}>
                  <Ionicons name="star" size={iconSize.sm} color={colors.content.onBase.brand} />
                  <Text variant="bodyStrong" style={styles.pointsText}>
                    {item.points}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
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
      fontSize: 17,
    },
    listContent: {
      paddingHorizontal: space['400'],
    },
    listHeader: {
      gap: space['200'],
      marginBottom: space['200'],
    },
    sectionHeaderRow: {
      paddingTop: space['200'],
      paddingBottom: space['100'],
    },
    rankingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.base.secondary,
      paddingVertical: space['250'],
      paddingHorizontal: space['400'],
      borderLeftWidth: borderWidth.sm,
      borderRightWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      gap: space['300'],
    },
    firstRankingRow: {
      borderTopWidth: borderWidth.sm,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    lastRankingRow: {
      borderBottomWidth: borderWidth.sm,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    dividerRankingRow: {
      borderBottomWidth: borderWidth.sm,
      borderBottomColor: colors.border.base.subtle,
    },
    rankingRowPressed: {
      opacity: 0.75,
    },
    rankBadge: {
      minWidth: 32,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    rankText: {
      color: colors.content.onBase.primary,
      fontFamily: fonts.sans.bold,
    },
    avatarWrapper: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: colors.surface.base.primary,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.saseBlue.primary,
    },
    memberInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    memberName: {
      color: colors.content.onBase.primary,
      textAlign: 'left',
    },
    pointsContainer: {
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: space['100'],
    },
    pointsText: {
      color: colors.content.onBase.primary,
    },
  });
