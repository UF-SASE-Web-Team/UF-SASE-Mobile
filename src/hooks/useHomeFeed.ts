import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { useProfile } from '@/context/ProfileContext';
import { openExternalLink } from '@/lib/links';
import { getProfileAvatarSource, profileAvatars } from '@/lib/profileAvatars';
import { getUserPointsTotal } from '@/services/points';
import { getOpenApplicationPrograms, getPrograms } from '@/services/programs';
import { EventRow, EventWithRsvp } from '@/types/events';
import { ProgramWithPoCs } from '@/types/programs';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_UPCOMING_COUNT = 6;
const MIN_WEEK_THRESHOLD = 3;

export function useHomeFeed() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const {
    events,
    activeEvents,
    loading,
    error,
    refreshing,
    refreshEvents,
    markEventAttended,
    toggleRsvp,
  } = useEvents();

  const allFutureEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.starts_at) > now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const thisWeekEvents = allFutureEvents.filter(
      (e) => new Date(e.starts_at).getTime() <= now.getTime() + SEVEN_DAYS_MS,
    );
    const selected = thisWeekEvents.length >= MIN_WEEK_THRESHOLD ? thisWeekEvents : allFutureEvents;
    return selected.slice(0, MAX_UPCOMING_COUNT);
  }, [allFutureEvents]);

  // The soonest upcoming event the user has RSVPed to
  const nextEvent = useMemo(
    () => allFutureEvents.find((e) => e.is_rsvped) ?? null,
    [allFutureEvents],
  );

  const [programs, setPrograms] = useState<ProgramWithPoCs[]>([]);
  const openApplicationPrograms = useMemo(() => getOpenApplicationPrograms(programs), [programs]);

  useEffect(() => {
    let isMounted = true;
    getPrograms()
      .then((result) => {
        if (isMounted) setPrograms(result);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [selectedCheckInEvent, setSelectedCheckInEvent] = useState<EventRow | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    getUserPointsTotal(user.id)
      .then((points) => {
        if (!isMounted) return;
        setTotalPoints(points);
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

  const handleRsvpPress = async (event: EventRow) => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to RSVP for events.');
      return;
    }

    const eventWithRsvp = events.find((e) => e.id === event.id) ?? (event as EventWithRsvp);
    const isCurrentlyRsvped = Boolean(eventWithRsvp?.is_rsvped);
    const rsvpUrl = eventWithRsvp?.rsvp_link?.url ?? (event as EventWithRsvp).rsvp_link?.url;

    const performRsvp = async () => {
      try {
        const isGoing = await toggleRsvp(event.id);
        if (isGoing && rsvpUrl) {
          await openExternalLink(rsvpUrl, `${event.title} RSVP`);
        }
      } catch (err: any) {
        Alert.alert('RSVP Error', err.message || 'Could not update RSVP status.');
      }
    };

    if (isCurrentlyRsvped) {
      await performRsvp();
      return;
    }

    if (rsvpUrl) {
      Alert.alert('Continue RSVP', 'You will be redirected to the RSVP form.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RSVP',
          onPress: () => {
            void performRsvp();
          },
        },
      ]);
      return;
    }

    await performRsvp();
  };

  const handleProgramPress = (program: ProgramWithPoCs) => {
    router.push({
      pathname: `/programs/${program.slug}`,
      params: { name: program.name },
    } as any);
  };

  const handleRefresh = () => {
    refreshEvents();
    getPrograms()
      .then(setPrograms)
      .catch(() => {});
  };

  return {
    user,
    profile,
    events,
    activeEvents,
    upcomingEvents,
    nextEvent,
    programs,
    openApplicationPrograms,
    loading,
    error,
    refreshing,
    totalPoints,
    avatarSource,
    setFailedAvatarUrl,
    selectedCheckInEvent,
    setSelectedCheckInEvent,
    markEventAttended,
    handleCardPress,
    handleCheckInPress,
    handleRsvpPress,
    handleProgramPress,
    handleRefresh,
  };
}
