import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { type Colors, iconSize, radius, space } from '@/theme';

const OPEN_DURATION_MS = 280;
const CLOSE_DURATION_MS = 200;
const MAX_ZOOM_SCALE = 3;

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
 * hero into an uncropped, pinch-zoomable view with a close button.
 */
export function EventFlyerViewer({
  flyerUrl,
  onClose,
  originHeight,
  originScale = 1,
}: EventFlyerViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // 0 = aligned with the hero, 1 = centered full-screen.
  const progress = useAnimatedValue(0);
  // Leftover pull-to-expand stretch, relaxed to 0 as the viewer opens.
  const stretch = useAnimatedValue(Math.max(originScale - 1, 0));
  const isClosingRef = useRef(false);

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
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, progress]);

  // The flyer sits in a full-screen box; shift it up so it starts on the hero.
  const heroOffset = originHeight / 2 - height / 2;
  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [heroOffset, 0] }),
    Animated.multiply(stretch, originHeight / 2),
  );
  const scale = Animated.add(1, stretch);

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: progress }]} />

      <Animated.View style={[styles.flyerContainer, { transform: [{ translateY }, { scale }] }]}>
        <ScrollView
          style={styles.zoomScroll}
          contentContainerStyle={{ width, height }}
          maximumZoomScale={MAX_ZOOM_SCALE}
          minimumZoomScale={1}
          bouncesZoom
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
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
        style={[styles.closeButtonContainer, { top: insets.top + space['200'], opacity: progress }]}
      >
        <Pressable
          onPress={handleClose}
          hitSlop={space['200']}
          style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Close flyer"
        >
          <Ionicons name="close" size={iconSize.md} color={colors.content.onMedia.primary} />
        </Pressable>
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
    closeButton: {
      width: space['1000'],
      height: space['1000'],
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.media.scrim,
    },
    closeButtonPressed: {
      opacity: 0.7,
    },
  });
