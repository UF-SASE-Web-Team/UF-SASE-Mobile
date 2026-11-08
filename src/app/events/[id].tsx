import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextLayoutEventData,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BackButton } from '@/components/BackButton';
import { EventCheckInModal } from '@/components/EventCheckInModal';
import { EventContactsSection } from '@/components/EventContactsSection';
import { EventLinksSection } from '@/components/EventLinksSection';
import { EventTag } from '@/components/EventTag';
import { Text } from '@/components/Text';
import { useAuth } from '@/context/AuthContext';
import { useOptionalEvents } from '@/context/EventsContext';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { getEvent, toggleEventRsvp } from '@/services/events';
import { type Colors, borderWidth, radius, space, iconSize } from '@/theme';
import { EventWithDetails } from '@/types/events';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const eventsContext = useOptionalEvents();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRsvped, setIsRsvped] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const [isCheckInModalVisible, setIsCheckInModalVisible] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [isTextLong, setIsTextLong] = useState(false);

  const handleAboutTextLayout = useCallback((e: NativeSyntheticEvent<TextLayoutEventData>) => {
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
    } catch (err: any) {
      setIsRsvped(previousStatus);
      Alert.alert('RSVP Error', err.message || 'Could not update RSVP status.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Backdrop Linear Gradient */}
        <LinearGradient
          colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.backdropGradient}
        />

        {/* Floating Back Button */}
        <BackButton
          variant="onMedia"
          fallbackRoute="/events"
          style={[styles.floatingBackButton, { top: insets.top + space['200'] }]}
        />

        <View
          style={[
            styles.cardContainer,
            styles.loadingCardContainer,
            { marginTop: insets.top + 80 },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={colors.surface.saseBlue.primary}
            accessibilityRole="progressbar"
            testID="loading-indicator"
          />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="body" color={colors.content.onDanger.primary}>
          {error || 'Event not found.'}
        </Text>
        <Pressable style={styles.errorBackButton} onPress={handleBack} accessibilityRole="button">
          <Text variant="bodyStrong">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const now = new Date();
  const startDate = new Date(event.starts_at);
  const endDate = new Date(event.ends_at);
  const isValidStartDate = !Number.isNaN(startDate.getTime());
  const isValidEndDate = !Number.isNaN(endDate.getTime());

  const checkinOpensAt = new Date(event.checkin_opens_at ?? event.starts_at);
  const checkinClosesAt = new Date(event.checkin_closes_at ?? event.ends_at);
  const isCheckinStarted = !Number.isNaN(checkinOpensAt.getTime()) && now >= checkinOpensAt;
  const isCheckinOpen =
    isCheckinStarted && !Number.isNaN(checkinClosesAt.getTime()) && now <= checkinClosesAt;

  // The bottom check-in button appears once check-in starts, until check-in closes or user has checked in
  const isBottomButtonVisible = isCheckinOpen && !hasCheckedIn;

  // Date formatted: e.g. "Monday, October 5"
  const formattedDate = isValidStartDate
    ? startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // Time formatted: e.g. "Doors 7:45 PM, 8:00 PM – 9:00 PM"
  const startTime = isValidStartDate
    ? startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const endTime = isValidEndDate
    ? endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  const timeRange = startTime && endTime ? `${startTime} – ${endTime}` : startTime;

  const hasEarlyDoors = Boolean(
    event.checkin_opens_at && new Date(event.checkin_opens_at).getTime() < startDate.getTime(),
  );
  const doorsOpenTime = hasEarlyDoors
    ? new Date(event.checkin_opens_at!).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
  const formattedTimeWithDoors = doorsOpenTime ? `Doors ${doorsOpenTime}, ${timeRange}` : timeRange;

  return (
    <View style={styles.container}>
      {/* Backdrop Linear Gradient */}
      <LinearGradient
        colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdropGradient}
      />

      {/* Floating Back Button */}
      <BackButton
        variant="onMedia"
        fallbackRoute="/events"
        style={[styles.floatingBackButton, { top: insets.top + space['200'] }]}
      />

      {/* Content ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.cardContainer,
            {
              paddingBottom: isBottomButtonVisible ? 110 : space['800'],
            },
          ]}
        >
          {/* Header Row: Title & Action (RSVP / Checked In) */}
          <View style={styles.headerRow}>
            <Text variant="title" style={styles.title} numberOfLines={3}>
              {event.title}
            </Text>

            {hasCheckedIn ? (
              <View style={styles.checkedInBadge} accessibilityLabel="Checked in">
                <Ionicons
                  name="checkmark"
                  size={iconSize.md}
                  color={colors.content.onSuccess.primary}
                />
                <Text variant="bodySmStrong" color={colors.content.onSuccess.primary}>
                  Checked in
                </Text>
              </View>
            ) : isCheckinStarted ? null : (
              <Pressable
                style={({ pressed }) => [
                  styles.rsvpButton,
                  isRsvped && styles.rsvpButtonActive,
                  pressed && styles.rsvpButtonPressed,
                ]}
                onPress={handleRsvpPress}
                accessibilityRole="button"
                accessibilityLabel={isRsvped ? 'Cancel RSVP' : 'RSVP to event'}
              >
                <Text variant="bodyStrong" color={colors.content.onBase.primary} numberOfLines={1}>
                  {isRsvped ? 'Going' : 'RSVP'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Event Type Tag */}
          {event.type && event.type !== 'other' && (
            <View style={styles.tagRow}>
              <EventTag type={event.type} />
            </View>
          )}

          {/* Info Rows */}
          <View style={styles.infoList}>
            {Boolean(formattedDate) && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={iconSize.md}
                  color={colors.content.onBase.secondary}
                />
                <Text variant="body" color={colors.content.onBase.primary}>
                  {formattedDate}
                </Text>
              </View>
            )}

            {Boolean(formattedTimeWithDoors) && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="time-outline"
                  size={iconSize.md}
                  color={colors.content.onBase.secondary}
                />
                <Text variant="body" color={colors.content.onBase.primary}>
                  {formattedTimeWithDoors}
                </Text>
              </View>
            )}

            {Boolean(event.location_name) && (
              <View style={styles.metaRow}>
                <Ionicons
                  name="location-outline"
                  size={iconSize.md}
                  color={colors.content.onBase.secondary}
                />
                <Text variant="body" color={colors.content.onBase.primary}>
                  {event.location_name}
                </Text>
              </View>
            )}
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text variant="bodyStrong" style={styles.sectionTitle}>
              About
            </Text>
            <Text
              testID="event-about-text"
              variant="body"
              color={colors.content.onBase.secondary}
              style={styles.aboutText}
              numberOfLines={isAboutExpanded ? undefined : 5}
              onTextLayout={handleAboutTextLayout}
            >
              {event.description || 'No description provided.'}
            </Text>
            {Boolean(event.description) && !shouldShowExpandButton && (
              <Text
                variant="body"
                style={[styles.aboutText, styles.hiddenAboutMeasure]}
                onTextLayout={handleAboutTextLayout}
                aria-hidden
              >
                {event.description}
              </Text>
            )}
            {shouldShowExpandButton && (
              <Pressable
                testID="event-about-toggle-button"
                onPress={() => setIsAboutExpanded((prev) => !prev)}
                style={({ pressed }) => [
                  styles.expandButton,
                  pressed && styles.expandButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={isAboutExpanded ? 'Show less' : 'Show more'}
              >
                <Text
                  variant="bodySmStrong"
                  color={colors.surface.saseBlue.primary}
                  style={styles.expandButtonText}
                >
                  {isAboutExpanded ? 'Show less' : 'Show more'}
                </Text>
                <Ionicons
                  name={isAboutExpanded ? 'chevron-up' : 'chevron-down'}
                  size={iconSize.sm}
                  color={colors.surface.saseBlue.primary}
                />
              </Pressable>
            )}
          </View>

          {/* Links Section */}
          <EventLinksSection links={event.links} />

          {/* Contacts Section */}
          <EventContactsSection program={event.program} />
        </View>
      </ScrollView>

      {/* Floating Bottom Check-in Button */}
      {isBottomButtonVisible && (
        <View
          testID="bottom-check-in-container"
          style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, space['300']) }]}
          pointerEvents="box-none"
        >
          {/* Gradient fade to white for scrolling content underneath */}
          <LinearGradient
            testID="bottom-fade-gradient"
            colors={[
              `${colors.surface.base.primary}00`,
              `${colors.surface.base.primary}b3`,
              `${colors.surface.base.primary}f2`,
              colors.surface.base.primary,
            ]}
            locations={[0, 0.35, 0.7, 1]}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          <Pressable
            style={({ pressed }) => [styles.checkInButton, pressed && styles.checkInButtonPressed]}
            onPress={() => setIsCheckInModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Check-in"
          >
            <Ionicons
              name="barcode-outline"
              size={iconSize.md}
              color={colors.content.onSaseBlue.secondary}
            />
            <Text variant="bodyStrong" color={colors.content.onSaseBlue.secondary}>
              Check-in
            </Text>
          </Pressable>
        </View>
      )}

      {/* Check-in Modal */}
      {isCheckInModalVisible && (
        <EventCheckInModal
          visible={isCheckInModalVisible}
          onClose={() => setIsCheckInModalVisible(false)}
          eventId={event.id}
          eventTitle={event.title}
          pointsValue={event.points_value}
          onSuccess={() => {
            setHasCheckedIn(true);
            eventsContext?.markEventAttended(event.id);
          }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
      padding: space['400'],
      gap: space['300'],
    },
    errorBackButton: {
      paddingHorizontal: space['400'],
      paddingVertical: space['200'],
      backgroundColor: colors.surface.base.secondary,
      borderRadius: radius.md,
    },
    backdropGradient: {
      position: 'absolute',
      top: -200,
      left: 0,
      right: 0,
      height: 600,
    },
    floatingBackButton: {
      position: 'absolute',
      left: space['400'],
      zIndex: 10,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    cardContainer: {
      flex: 1,
      backgroundColor: colors.surface.base.primary,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: space['500'],
      paddingTop: space['400'],
      gap: space['300'],
    },
    loadingCardContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space['200'],
      marginTop: space['200'],
    },
    title: {
      flex: 1,
    },
    rsvpButton: {
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      borderRadius: radius.md,
      backgroundColor: colors.surface.base.secondary,
      paddingHorizontal: space['150'],
      paddingVertical: space['150'],
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 72,
    },
    rsvpButtonActive: {
      backgroundColor: colors.surface.success.primary,
      borderColor: colors.surface.success.primary,
    },
    rsvpButtonPressed: {
      opacity: 0.75,
    },
    checkedInBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['100'],
      backgroundColor: colors.surface.success.primary,
      borderRadius: radius.md,
      paddingHorizontal: space['250'],
      paddingVertical: space['150'],
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoList: {
      gap: space['200'],
      marginTop: space['100'],
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['200'],
    },
    section: {
      marginTop: space['300'],
      gap: space['150'],
    },
    sectionTitle: {
      marginBottom: space['050'],
    },
    aboutText: {
      lineHeight: 22,
    },
    hiddenAboutMeasure: {
      position: 'absolute',
      opacity: 0,
      left: 0,
      right: 0,
      zIndex: -1,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space['050'],
      alignSelf: 'flex-start',
      marginTop: space['050'],
      paddingVertical: space['050'],
    },
    expandButtonPressed: {
      opacity: 0.6,
    },
    expandButtonText: {
      color: colors.surface.saseBlue.primary,
    },
    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      paddingHorizontal: space['400'],
      paddingTop: space['200'],
    },
    bottomGradient: {
      position: 'absolute',
      top: -30,
      left: 0,
      right: 0,
      bottom: 0,
    },
    checkInButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space['200'],
      backgroundColor: colors.surface.saseBlue.secondary,
      borderRadius: radius.md,
      paddingVertical: space['300'],
    },
    checkInButtonPressed: {
      opacity: 0.85,
    },
  });
