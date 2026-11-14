import React from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventAboutSection } from '@/components/events/EventAboutSection';
import { EventBackdropHero } from '@/components/events/EventBackdropHero';
import { EventCheckInBottomBar } from '@/components/events/EventCheckInBottomBar';
import { EventCheckInModal } from '@/components/events/EventCheckInModal';
import { EventContactsSection } from '@/components/events/EventContactsSection';
import { EventDetailHeader } from '@/components/events/EventDetailHeader';
import { EventDetailMeta } from '@/components/events/EventDetailMeta';
import { EventFlyerViewer } from '@/components/events/EventFlyerViewer';
import { EventLinksSection } from '@/components/events/EventLinksSection';
import { BackButton } from '@/components/ui/BackButton';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useEventDetail } from '@/hooks/useEventDetail';
import { radius, space, type Colors } from '@/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const {
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
    handleCheckInSuccess,
    handleBack,
    handleScrollEndDrag,
  } = useEventDetail(id);

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          testID="event-backdrop-gradient"
          colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.backdropGradient, { height: heroHeight }]}
        />
        <BackButton
          variant="onMedia"
          fallbackRoute="/events"
          style={[styles.floatingBackButton, { top: insets.top + space['200'] }]}
        />
        <View style={[styles.cardContainer, styles.loadingCardContainer, { marginTop: sheetTop }]}>
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

  return (
    <View style={styles.container}>
      <EventBackdropHero
        flyerUrl={event.flyer_url}
        heroHeight={heroHeight}
        sheetTop={sheetTop}
        insetsTop={insets.top}
        scrollY={scrollY}
        flyerViewerOrigin={flyerViewerOrigin}
      />

      <BackButton
        variant="onMedia"
        fallbackRoute="/events"
        style={[styles.floatingBackButton, { top: insets.top + space['200'] }]}
      />

      <Animated.ScrollView
        testID="event-scroll-view"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {event.flyer_url ? (
          <Pressable
            style={{ height: sheetTop }}
            onPress={() => setFlyerViewerOrigin({ scale: 1 })}
            accessibilityRole="imagebutton"
            accessibilityLabel="View event flyer"
          />
        ) : (
          <View style={{ height: sheetTop }} />
        )}

        <View
          style={[
            styles.cardContainer,
            {
              paddingBottom: isBottomButtonVisible ? 110 : space['800'],
            },
          ]}
        >
          <EventDetailHeader
            title={event.title}
            type={event.type}
            rsvpEnabled={Boolean(event.rsvp)}
            isRsvped={isRsvped}
            hasCheckedIn={hasCheckedIn}
            isCheckinStarted={isCheckinStarted}
            onRsvpPress={handleRsvpPress}
          />

          <EventDetailMeta
            formattedDate={formattedDate}
            formattedTimeWithDoors={formattedTimeWithDoors}
            locationName={event.location_name}
          />

          <EventAboutSection
            description={event.description}
            isExpanded={isAboutExpanded}
            shouldShowExpandButton={shouldShowExpandButton}
            onToggleExpand={() => setIsAboutExpanded((prev) => !prev)}
            onTextLayout={handleAboutTextLayout}
          />

          <EventLinksSection links={event.links} style={styles.linksSection} />
          <EventContactsSection program={event.program} />
        </View>
      </Animated.ScrollView>

      {isBottomButtonVisible && (
        <EventCheckInBottomBar
          insetsBottom={insets.bottom}
          onPress={() => setIsCheckInModalVisible(true)}
        />
      )}

      {isCheckInModalVisible && (
        <EventCheckInModal
          visible={isCheckInModalVisible}
          onClose={() => setIsCheckInModalVisible(false)}
          eventId={event.id}
          eventTitle={event.title}
          pointsValue={event.points_value}
          onSuccess={() => {
            handleCheckInSuccess();
          }}
        />
      )}

      {flyerViewerOrigin && event.flyer_url && (
        <EventFlyerViewer
          flyerUrl={event.flyer_url}
          originHeight={heroHeight}
          originScale={flyerViewerOrigin.scale}
          onClose={() => setFlyerViewerOrigin(null)}
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
    floatingBackButton: {
      position: 'absolute',
      left: space['400'],
      zIndex: 10,
    },
    backdropGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    cardContainer: {
      backgroundColor: colors.surface.base.primary,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: space['400'],
      paddingTop: space['400'],
    },
    loadingCardContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space['400'],
    },
    errorBackButton: {
      marginTop: space['400'],
      padding: space['300'],
    },
    linksSection: {
      marginBottom: space['400'],
    },
    contactsSection: {
      marginBottom: space['400'],
    },
  });
