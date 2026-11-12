import { useMemo, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { EventCheckInModal } from '@/components/EventCheckInModal';
import { HappeningNowCard } from '@/components/HappeningNowCard';
import { HomeEventCard } from '@/components/HomeEventCard';
import { SaseFlask, SaseLogo } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { useProfile } from '@/context/ProfileContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getProfileAvatarSource, profileAvatars } from '@/lib/profileAvatars';
import { getPointsLog } from '@/services/points';
import { borderWidth, radius, space, type Colors } from '@/theme';
import { EventRow, EventWithRsvp } from '@/types/events';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { profile } = useProfile();
  const { events, activeEvents, loading, error, refreshing, refreshEvents, markEventAttended } =
    useEvents();
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.starts_at) > now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [selectedCheckInEvent, setSelectedCheckInEvent] = useState<EventRow | null>(null);

  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getPointsLog(user.id)
      .then((entries) => {
        if (!isMounted) return;
        setTotalPoints(entries.reduce((sum, e) => sum + e.pointsValue, 0));
      })
      .catch(() => {
        if (!isMounted) return;
        setTotalPoints(null);
      });

    return () => {
      isMounted = false;
    };
  }, [user, activeEvents]);

  const imageFailed = failedAvatarUrl === (profile?.avatar_url ?? '__fallback__');

  const logoColor = isDark ? colors.surface.saseBlue.primary : colors.surface.saseBlue.secondary;

  const avatarSource = imageFailed
    ? profileAvatars[0].source
    : getProfileAvatarSource(profile?.avatar_url);

  const handleCardPress = (event: EventRow) => {
    router.push(`/events/${event.id}` as any);
  };

  const handleCheckInPress = (event: EventRow) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to check in to events.');
      return;
    }
    if ((event as EventWithRsvp).has_attended) {
      Alert.alert('Already checked in', 'You have already checked in to this event.');
      return;
    }
    setSelectedCheckInEvent(event);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View
          style={styles.logoRow}
          accessible
          accessibilityRole="image"
          accessibilityLabel="UF SASE Logo"
          testID="home-sase-logo"
        >
          <SaseFlask
            width={26}
            height={36}
            fill={logoColor}
            color={logoColor}
            testID="home-sase-flask"
          />
          <SaseLogo
            width={132}
            height={30}
            fill={logoColor}
            color={logoColor}
            testID="home-sase-brand"
          />
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel={
              totalPoints === null
                ? 'Points unavailable. View points log'
                : `${totalPoints} points. View points log`
            }
            accessibilityRole="button"
            testID="home-points-badge"
            onPress={() => router.push('/points')}
            style={({ pressed }) => [styles.pointsBadge, pressed && styles.profileButtonPressed]}
          >
            <Ionicons name="star" size={16} color={colors.content.onBase.primary} />
            <Text style={styles.pointsBadgeText}>{totalPoints ?? '–'}</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Profile"
            accessibilityRole="button"
            testID="home-profile-button"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
          >
            <Image
              source={avatarSource}
              style={styles.profileAvatar}
              contentFit="cover"
              accessibilityLabel={
                profile?.full_name ? `${profile.full_name}'s profile picture` : 'Profile picture'
              }
              testID="home-profile-image"
              onError={() => setFailedAvatarUrl(profile?.avatar_url ?? '__fallback__')}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEvents}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
      >
        {/* Happening Now Banner(s) */}
        {activeEvents.length > 0 && (
          <View style={styles.happeningNowContainer}>
            {activeEvents.map((event) => (
              <HappeningNowCard
                key={event.id}
                event={event}
                hasCheckedIn={event.has_attended}
                onCheckInPress={handleCheckInPress}
                onPress={handleCardPress}
              />
            ))}
          </View>
        )}

        {/* Events */}
        <Text style={styles.sectionTitle}>Events</Text>
        <FlatList
          data={upcomingEvents}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          style={styles.eventsListOuter}
          contentContainerStyle={styles.eventsList}
          renderItem={({ item }) => <HomeEventCard event={item} onPress={handleCardPress} />}
        />
      </ScrollView>

      {selectedCheckInEvent && (
        <EventCheckInModal
          visible={Boolean(selectedCheckInEvent)}
          onClose={() => setSelectedCheckInEvent(null)}
          eventId={selectedCheckInEvent.id}
          eventTitle={selectedCheckInEvent.title}
          pointsValue={selectedCheckInEvent.points_value}
          onSuccess={() => {
            const eventId = selectedCheckInEvent.id;
            markEventAttended(eventId);
            setSelectedCheckInEvent(null);
            refreshEvents();
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['400'],
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['300'],
    },
    pointsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
      height: 32,
      paddingHorizontal: space['300'],
      borderRadius: 30,
      backgroundColor: colors.surface.base.secondary,
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    pointsBadgeText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.content.onBase.primary,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      overflow: 'hidden',
      backgroundColor: colors.surface.base.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
    },
    profileButtonPressed: {
      opacity: 0.7,
    },
    profileAvatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
    },
    scrollContent: {
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
      paddingBottom: space['1000'],
    },
    happeningNowContainer: {
      gap: space['400'],
      marginBottom: space['400'],
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.content.onBase.primary,
      marginBottom: space['200'],
    },
    eventsMessage: {
      fontSize: 14,
      color: colors.content.onBase.primary,
      marginBottom: space['400'],
    },
    eventsListOuter: {
      marginHorizontal: -space['400'],
    },
    eventsList: {
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
      gap: space['300'],
    },
  });
