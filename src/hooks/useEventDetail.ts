import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextLayoutEvent,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useOptionalEvents } from '@/context/EventsContext';
import { openExternalLink } from '@/lib/links';
import { getEvent, toggleEventRsvp } from '@/services/events';
import { radius } from '@/theme';
import { EventWithDetails } from '@/types/events';

// Flyers are designed as 4:5 portrait posters (e.g. 1080x1350).
const FLYER_ASPECT_RATIO = 5 / 4;
// The details sheet never starts lower than this fraction of the screen.
const MAX_SHEET_TOP_RATIO = 0.45;
// How far the flyer must be pulled down before releasing opens it full-screen.
const PULL_TO_EXPAND_DISTANCE = 64;

export function useEventDetail(id?: string) {
  const router = useRouter();
  const { user } = useAuth();
  const eventsContext = useOptionalEvents();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scrollY = useAnimatedValue(0);

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRsvped, setIsRsvped] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  // Non-null while the full-screen flyer is open; holds the pull stretch it opened from.
  const [flyerViewerOrigin, setFlyerViewerOrigin] = useState<{ scale: number } | null>(null);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [isTextLong, setIsTextLong] = useState(false);

  const handleAboutTextLayout = useCallback((e: TextLayoutEvent) => {
    if (e.nativeEvent.lines.length > 5) {
      setIsTextLong(true);
    }
  }, []);

  const hasManyNewlines = Boolean(event?.description && event.description.split('\n').length > 5);
  const isLongDescription = Boolean(event?.description && event.description.length > 250);
  const shouldShowExpandButton = isTextLong || hasManyNewlines || isLongDescription;

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    getEvent(id)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError('Event not found.');
          return;
        }
        setEvent(data);
        setIsRsvped(Boolean(data.is_rsvped));
        setHasCheckedIn(Boolean(data.has_attended));
        setIsAboutExpanded(false);
        setIsTextLong(false);
        setError(null);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Error fetching event details:', err.message);
        setError(err.message || 'Failed to load event details.');
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/events');
    }
  };

  const handleRsvpPress = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to RSVP for events.');
      return;
    }
    if (!event) return;

    const previousStatus = isRsvped;
    const nextStatus = !previousStatus;
    setIsRsvped(nextStatus);

    try {
      const serverStatus = await toggleEventRsvp(event.id);
      setIsRsvped(serverStatus);
      // Send the user to the RSVP form when they RSVP, not when they cancel.
      if (serverStatus && event.rsvp_link?.url) {
        await openExternalLink(event.rsvp_link.url);
      }
    } catch (err: any) {
      setIsRsvped(previousStatus);
      Alert.alert('RSVP Error', err.message || 'Could not update RSVP status.');
    }
  };

  const now = new Date();
  const startDate = event ? new Date(event.starts_at) : null;
  const endDate = event ? new Date(event.ends_at) : null;
  const isValidStartDate = Boolean(startDate && !Number.isNaN(startDate.getTime()));
  const isValidEndDate = Boolean(endDate && !Number.isNaN(endDate.getTime()));

  const checkinOpensAt = event ? new Date(event.checkin_opens_at ?? event.starts_at) : null;
  const checkinClosesAt = event ? new Date(event.checkin_closes_at ?? event.ends_at) : null;
  const isCheckinStarted = Boolean(
    checkinOpensAt && !Number.isNaN(checkinOpensAt.getTime()) && now >= checkinOpensAt,
  );
  const isCheckinOpen = Boolean(
    isCheckinStarted &&
    checkinClosesAt &&
    !Number.isNaN(checkinClosesAt.getTime()) &&
    now <= checkinClosesAt,
  );

  // The bottom check-in button appears once check-in starts, until check-in closes or user has checked in
  const isBottomButtonVisible = isCheckinOpen && !hasCheckedIn;

  // Date formatted: e.g. "Monday, October 5"
  const formattedDate =
    isValidStartDate && startDate
      ? startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : '';

  // Time formatted: e.g. "Doors 7:45 PM, 8:00 PM – 9:00 PM"
  const startTime =
    isValidStartDate && startDate
      ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
  const endTime =
    isValidEndDate && endDate
      ? endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
  const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;

  const hasEarlyDoors = Boolean(
    event?.checkin_opens_at &&
    startDate &&
    new Date(event.checkin_opens_at).getTime() < startDate.getTime(),
  );
  const doorsOpenTime =
    hasEarlyDoors && event?.checkin_opens_at
      ? new Date(event.checkin_opens_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';
  const formattedTimeWithDoors = doorsOpenTime ? `Doors ${doorsOpenTime}, ${timeRange}` : timeRange;

  const heroHeight = windowWidth * FLYER_ASPECT_RATIO;
  const sheetTop = Math.min(heroHeight - radius.xl, windowHeight * MAX_SHEET_TOP_RATIO);

  const flyerUrl = event?.flyer_url;

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pullDistance = -e.nativeEvent.contentOffset.y;
    if (flyerUrl && pullDistance >= PULL_TO_EXPAND_DISTANCE) {
      setFlyerViewerOrigin({ scale: 1 + pullDistance / heroHeight });
    }
  };

  return {
    event,
    loading,
    error,
    isRsvped,
    hasCheckedIn,
    isCheckinStarted,
    isBottomButtonVisible,
    formattedDate,
    formattedTimeWithDoors,
    scrollY,
    heroHeight,
    sheetTop,
    flyerViewerOrigin,
    setFlyerViewerOrigin,
    isCheckInModalVisible,
    setIsCheckInModalVisible,
    isAboutExpanded,
    setIsAboutExpanded,
    shouldShowExpandButton,
    handleAboutTextLayout,
    handleRsvpPress,
    handleCheckInSuccess: () => {
      setHasCheckedIn(true);
      if (event?.id) {
        eventsContext?.markEventAttended(event.id);
      }
    },
    handleBack,
    handleScrollEndDrag,
  };
}
