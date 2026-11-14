import React from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventCard } from '@/components/events/EventCard';
import { EventCheckInModal } from '@/components/events/EventCheckInModal';
import { EventFilters } from '@/components/events/EventFilters';
import { HappeningNowCard } from '@/components/events/HappeningNowCard';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { EventSection, useEventsFeed } from '@/hooks/useEventsFeed';
import { type Colors, space } from '@/theme';
import { EventWithRsvp } from '@/types/events';

export default function EventsPage() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
    activeEvents,
    monthSections,
    loading,
    refreshing,
    error,
    timeFilter,
    typeFilter,
    isFiltered,
    selectedCheckInEvent,
    setTimeFilter,
    setTypeFilter,
    clearFilters,
    setSelectedCheckInEvent,
    handleCardPress,
    handleCheckInPress,
    handleRsvpPress,
    handleCheckInSuccess,
    refreshEvents,
  } = useEventsFeed();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={colors.surface.saseBlue.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <Text variant="body" color={colors.content.onDanger.primary}>
          Failed to load events: {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <SectionList<EventWithRsvp, EventSection>
        sections={monthSections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isRsvped={item.is_rsvped}
            hasAttended={item.has_attended}
            onPress={handleCardPress}
            onRsvpPress={handleRsvpPress}
          />
        )}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.monthHeader}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="body" color={colors.content.onBase.secondary}>
              {data.length} {data.length === 1 ? 'event' : 'events'}
            </Text>
          </View>
        )}
        renderSectionFooter={() => <View style={styles.sectionFooter} />}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Events Display Header */}
            <View style={styles.header}>
              <Text variant="display">Events</Text>
            </View>

            {/* Happening Now Banner(s) */}
            {activeEvents.map((event) => (
              <HappeningNowCard
                key={event.id}
                event={event}
                hasCheckedIn={event.has_attended}
                onCheckInPress={handleCheckInPress}
                onPress={handleCardPress}
              />
            ))}

            {/* Filter Chips */}
            <EventFilters
              timeFilter={timeFilter}
              typeFilter={typeFilter}
              onTimeFilterChange={setTimeFilter}
              onTypeFilterChange={setTypeFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            message="No events found."
            actionLabel={isFiltered ? 'Clear filters' : undefined}
            onAction={isFiltered ? clearFilters : undefined}
          />
        }
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshEvents}
            tintColor={colors.surface.saseBlue.primary}
          />
        }
        stickySectionHeadersEnabled={false}
      />

      {selectedCheckInEvent && (
        <EventCheckInModal
          visible={Boolean(selectedCheckInEvent)}
          onClose={() => setSelectedCheckInEvent(null)}
          eventId={selectedCheckInEvent.id}
          eventTitle={selectedCheckInEvent.title}
          pointsValue={selectedCheckInEvent.points_value}
          onSuccess={handleCheckInSuccess}
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
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface.base.primary,
    },
    scrollContent: {
      paddingHorizontal: space['400'],
      paddingTop: space['300'],
      paddingBottom: space['1000'],
    },
    listHeader: {
      gap: space['400'],
      marginBottom: space['400'],
    },
    header: {
      marginBottom: space['100'],
    },
    monthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: space['400'],
    },
    itemSeparator: {
      height: space['400'],
    },
    sectionFooter: {
      height: space['400'],
    },
  });
