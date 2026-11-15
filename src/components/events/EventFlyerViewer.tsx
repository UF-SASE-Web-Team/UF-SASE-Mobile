import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  ScrollView,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '@/components/ui/CloseButton';
import { useThemedStyles } from '@/context/ThemeContext';
import { type Colors, space } from '@/theme';

const OPEN_DURATION_MS = 280;
const CLOSE_DURATION_MS = 200;
const MAX_ZOOM_SCALE = 3;
const SWIPE_DISMISS_DISTANCE = 80;
const SWIPE_DISMISS_VELOCITY = 0.3;

export interface EventFlyerViewerProps {
  flyerUrl: string;
  onClose: () => void;
  /**
   * Height of the hero the flyer expands out of. The flyer starts aligned with
   * that hero (pinned to the top of the screen) and settles in the center.
   */
  originHeight: number;
  /**
   * Scale the hero was stretched to when the viewer opened (pull-to-expand),
   * so the flyer continues from where the pull left off.
   */
  originScale?: number;
}

/**
 * Full-screen flyer viewer. Mount it to open: the flyer animates out of the
 * hero into an uncropped, pinch-zoomable view with a close button. Supports
 * swiping down or up to dismiss, or tapping the close button.
 */
export function EventFlyerViewer({
  flyerUrl,
  onClose,
  originHeight,
  originScale = 1,
}: EventFlyerViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  // 0 = aligned with the hero, 1 = centered full-screen.
  const progress = useAnimatedValue(0);
  // Leftover pull-to-expand stretch, relaxed to 0 as the viewer opens.
  const stretch = useAnimatedValue(Math.max(originScale - 1, 0));
  // Vertical swipe offset during swipe-to-dismiss.
  const panY = useAnimatedValue(0);

  const [isClosing, setIsClosing] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: OPEN_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(stretch, {
        toValue: 0,
        duration: OPEN_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress, stretch]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(panY, {
        toValue: 0,
        duration: CLOSE_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [isClosing, onClose, panY, progress]);

  const handleDismiss = useCallback(
    (targetY: number) => {
      if (isClosing) return;
      setIsClosing(true);
      Animated.timing(panY, {
        toValue: targetY,
        duration: CLOSE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => onClose());
    },
    [isClosing, onClose, panY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (isClosing || isZoomed) return false;
          if (gestureState.numberActiveTouches > 1) return false;
          return (
            Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
          );
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          if (isClosing || isZoomed) return false;
          if (gestureState.numberActiveTouches > 1) return false;
          return (
            Math.abs(gestureState.dy) > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
          );
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gestureState) => {
          panY.setValue(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          const isDismissDown =
            gestureState.dy > SWIPE_DISMISS_DISTANCE ||
            (gestureState.dy > 20 && gestureState.vy > SWIPE_DISMISS_VELOCITY);
          const isDismissUp =
            gestureState.dy < -SWIPE_DISMISS_DISTANCE ||
            (gestureState.dy < -20 && gestureState.vy < -SWIPE_DISMISS_VELOCITY);

          if (isDismissDown) {
            handleDismiss(height);
          } else if (isDismissUp) {
            handleDismiss(-height);
          } else {
            Animated.spring(panY, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(panY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        },
      }),
    [handleDismiss, height, isClosing, isZoomed, panY],
  );

  // The flyer sits in a full-screen box; shift it up so it starts on the hero.
  const heroOffset = originHeight / 2 - height / 2;
  const translateY = Animated.add(
    Animated.add(
      progress.interpolate({ inputRange: [0, 1], outputRange: [heroOffset, 0] }),
      Animated.multiply(stretch, originHeight / 2),
    ),
    panY,
  );

  // Subtle peel-away scale down as flyer is swiped
  const dragScale = panY.interpolate({
    inputRange: [-height * 0.5, 0, height * 0.5],
    outputRange: [0.85, 1, 0.85],
    extrapolate: 'clamp',
  });
  const scale = Animated.multiply(Animated.add(1, stretch), dragScale);

  // Fade out backdrop and close button proportionally while swiping
  const dragOpacity = panY.interpolate({
    inputRange: [-height * 0.5, 0, height * 0.5],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });
  const backdropOpacity = Animated.multiply(progress, dragOpacity);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

      <Animated.View
        testID="event-flyer-viewer-container"
        style={[styles.flyerContainer, { transform: [{ translateY }, { scale }] }]}
        {...panResponder.panHandlers}
      >
        <ScrollView
          style={styles.zoomScroll}
          contentContainerStyle={{ width, height }}
          maximumZoomScale={MAX_ZOOM_SCALE}
          minimumZoomScale={1}
          bouncesZoom
          centerContent
          scrollEnabled={isZoomed}
          alwaysBounceVertical={false}
          alwaysBounceHorizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const zoomScale = e.nativeEvent.zoomScale;
            if (typeof zoomScale === 'number') {
              const nextZoomed = zoomScale > 1.05;
              if (nextZoomed !== isZoomed) {
                setIsZoomed(nextZoomed);
              }
            }
          }}
          scrollEventThrottle={16}
        >
          <Image
            testID="event-flyer-viewer-image"
            source={{ uri: flyerUrl }}
            contentFit="contain"
            cachePolicy="memory-disk"
            style={{ width, height }}
            accessibilityRole="image"
            accessibilityLabel="Event flyer"
          />
        </ScrollView>
      </Animated.View>

      <Animated.View
        style={[
          styles.closeButtonContainer,
          { top: insets.top + space['200'], opacity: backdropOpacity },
        ]}
      >
        <CloseButton variant="onMedia" onClose={handleClose} accessibilityLabel="Close flyer" />
      </Animated.View>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.surface.media.backdrop,
    },
    flyerContainer: {
      ...StyleSheet.absoluteFill,
    },
    zoomScroll: {
      flex: 1,
    },
    closeButtonContainer: {
      position: 'absolute',
      left: space['400'],
    },
  });
