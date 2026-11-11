import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '@/components/BackButton';
import { PointsItem } from '@/components/PointsItem';
import { useAuth } from '@/context/AuthContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getPointsLog, type PointsLogEntry } from '@/services/points';
import { space, type Colors } from '@/theme';
import { EventType } from '@/types/events';

// TODO: confirm the real free-shirt threshold with the team
const FREE_SHIRT_POINTS = 4;

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gbm: 'GBM',
  career: 'Career',
  social: 'Social',
  team: 'Team',
  other: 'Other',
};

export default function PointsLogPage() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [entries, setEntries] = useState<PointsLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    try {
      const data = await getPointsLog(user.id);
      setEntries(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching points log:', err.message);
      setError(err.message || 'Failed to load points.');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getPointsLog(user.id)
      .then((data) => {
        if (!isMounted) return;
        setEntries(data);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching points log:', err.message);
        setError(err.message || 'Failed to load points.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const totalPoints = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.pointsValue, 0),
    [entries],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        {/* Back button: returns to the previous screen (Home) */}
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
          <View style={styles.listHeader}>
            <View style={styles.totalCard}>
              <View style={styles.giftIcon}>
                <Ionicons name="gift-outline" size={40} color={colors.surface.saseBlue.secondary} />
              </View>
              <View style={styles.totalInfo}>
                <Text style={styles.totalTitle}>Total Points: {totalPoints}</Text>
                {totalPoints >= FREE_SHIRT_POINTS && (
                  <Text style={styles.totalSubtitle}>Eligible for a free shirt!</Text>
                )}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              testID="points-info-button"
              onPress={() => setShowInfo(true)}
              style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
            >
              <Text style={styles.infoButtonText}>What Are Points?</Text>
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.surface.saseBlue.primary} />
          ) : (
            <Text style={styles.emptyText}>
              {error ?? 'No check-ins yet. Check in at an event to earn points!'}
            </Text>
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

      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalText}>
              <Text style={styles.modalBold}>SASE Points</Text> are a reward system designed to
              recognize members for their involvement and participation. Members can earn points by
              attending events such as General Body Meetings (GBMs), socials, and other SASE
              activities, as well as participating in our programs.
            </Text>
            <Text style={styles.modalText}>
              As you accumulate points, you can unlock rewards, including free SASE merchandise!
              Remember to check in at every event you attend to ensure your points are recorded!
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="points-info-close"
              onPress={() => setShowInfo(false)}
              style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
            >
              <Text style={styles.infoButtonText}>Back to Attendance</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
      fontSize: 30,
      fontWeight: '700',
      color: colors.surface.saseBlue.secondary,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: space['1000'],
    },
    listHeader: {
      gap: space['400'],
      marginBottom: space['400'],
    },
    separator: {
      height: space['400'],
    },
    totalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
      padding: space['400'],
      borderRadius: 30,
      backgroundColor: colors.surface.base.secondary,
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    giftIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: '#78A6F5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalInfo: {
      flex: 1,
      gap: space['100'],
    },
    totalTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: colors.surface.saseBlue.secondary,
    },
    totalSubtitle: {
      fontSize: 14,
      color: colors.surface.saseBlue.secondary,
    },
    infoButton: {
      borderRadius: 30,
      paddingVertical: space['300'],
      alignItems: 'center',
      backgroundColor: colors.surface.saseBlue.secondary,
    },
    infoButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.8,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.surface.saseBlue.secondary,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      width: '100%',
      gap: space['300'],
      padding: space['400'],
      borderRadius: 30,
      backgroundColor: colors.surface.base.primary,
    },
    modalText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.surface.saseBlue.secondary,
    },
    modalBold: {
      fontWeight: '700',
    },
  });
