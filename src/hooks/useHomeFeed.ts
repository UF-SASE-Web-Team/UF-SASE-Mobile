import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { useProfile } from '@/context/ProfileContext';
import { getProfileAvatarSource, profileAvatars } from '@/lib/profileAvatars';
import { getPointsLog } from '@/services/points';
import { getOpenApplicationPrograms, getPrograms } from '@/services/programs';
import { EventRow, EventWithRsvp } from '@/types/events';
import { ProgramWithPoCs } from '@/types/programs';

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

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.starts_at) > now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  // The soonest upcoming event the user has RSVPed to
  const nextEvent = useMemo(
    () => upcomingEvents.find((e) => e.is_rsvped) ?? null,
    [upcomingEvents],
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

    try {
      await toggleRsvp(event.id);
    } catch (err: any) {
      Alert.alert('RSVP Error', err.message || 'Could not update RSVP status.');
    }
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
