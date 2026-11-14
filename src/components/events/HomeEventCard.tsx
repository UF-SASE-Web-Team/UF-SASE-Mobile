import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { EventTag } from '@/components/events/EventTag';
import { Text } from '@/components/ui/Text';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { borderWidth, iconSize, radius, space, type Colors } from '@/theme';
import { EventRow } from '@/types/events';

type HomeEventCardProps = {
  event: EventRow;
  onPress: (event: EventRow) => void;
};

/**
 * Image-first event card for the home screen row. Mirrors StandardProgramCard:
 * full-bleed flyer, bottom scrim, and the title overlaid on the image.
 */
export function HomeEventCard({ event, onPress }: HomeEventCardProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  // Show the flyer only if the event has one and it loaded; otherwise show a placeholder
  const showFlyer = Boolean(event.flyer_url) && !imageFailed;

  return (
    <Pressable
      onPress={() => onPress(event)}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      testID={`home-event-card-${event.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {showFlyer ? (
        <Image
          source={{ uri: event.flyer_url ?? '' }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.imagePlaceholder} testID={`home-event-card-placeholder-${event.id}`}>
          <LinearGradient
            colors={[colors.surface.saseBlue.secondary, colors.surface.saseBlue.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name="calendar-outline"
            size={iconSize.lg}
            color={colors.content.onMedia.primary}
          />
        </View>
      )}

      {/* Bottom fade keeps the title readable over any flyer */}
      <LinearGradient
        colors={['transparent', colors.surface.media.scrim]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <EventTag type={event.type} variant="onMedia" style={styles.tag} />

      <View style={styles.titleWrapper}>
        <Text variant="bodyStrong" color={colors.content.onMedia.primary} numberOfLines={2}>
          {event.title}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 168,
      height: 218,
      borderRadius: radius.lg,
      borderWidth: borderWidth.sm,
      borderColor: colors.border.base.subtle,
      backgroundColor: colors.surface.base.secondary,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    pressed: {
      opacity: 0.85,
    },
    image: {
      ...StyleSheet.absoluteFill,
    },
    imagePlaceholder: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.base.tertiary,
    },
    bottomFade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
    },
    tag: {
      position: 'absolute',
      top: space['300'],
      left: space['300'],
    },
    titleWrapper: {
      paddingHorizontal: space['300'],
      paddingBottom: space['300'],
    },
  });
