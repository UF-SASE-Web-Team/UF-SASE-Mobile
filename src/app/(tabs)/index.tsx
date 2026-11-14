import React from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCheckInModal } from '@/components/events/EventCheckInModal';
import { HomeApplicationsSection } from '@/components/home/HomeApplicationsSection';
import { HomeHappeningNowSection } from '@/components/home/HomeHappeningNowSection';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeNextEventSection } from '@/components/home/HomeNextEventSection';
import { HomeUpcomingEventsSection } from '@/components/home/HomeUpcomingEventsSection';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { space, type Colors } from '@/theme';

export default function HomePage() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    profile,
    activeEvents,
    upcomingEvents,
    nextEvent,
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
  } = useHomeFeed();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HomeHeader
        totalPoints={totalPoints}
        avatarSource={avatarSource}
        profileName={profile?.full_name}
        onAvatarError={() => setFailedAvatarUrl(profile?.avatar_url ?? '__fallback__')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
      >
        <HomeHappeningNowSection
          events={activeEvents}
          onCheckInPress={handleCheckInPress}
          onCardPress={handleCardPress}
        />

        <HomeNextEventSection
          event={nextEvent}
          onPress={handleCardPress}
          onRsvpPress={handleRsvpPress}
        />

        <HomeUpcomingEventsSection
          events={upcomingEvents}
          loading={loading}
          error={error}
          onCardPress={handleCardPress}
        />

        <HomeApplicationsSection
          programs={openApplicationPrograms}
          onProgramPress={handleProgramPress}
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
            handleRefresh();
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
    scrollContent: {
      paddingHorizontal: space['400'],
      paddingBottom: space['800'],
      gap: space['400'],
    },
  });
