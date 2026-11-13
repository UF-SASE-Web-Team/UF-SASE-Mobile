import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { EventTag } from '@/components/EventTag';
import { useTheme, useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';
import { EventRow } from '@/types/events';

type HomeEventCardProps = {
  event: EventRow;
  onPress: (event: EventRow) => void;
};

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
      {/* Inner view clips the image to the rounded corners so the outer shadow isn't cut off */}
      <View style={styles.cardInner}>
        {showFlyer ? (
          <Image
            source={{ uri: event.flyer_url ?? '' }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder} testID={`home-event-card-placeholder-${event.id}`}>
            <Ionicons name="calendar-outline" size={32} color={colors.content.onBase.primary} />
          </View>
        )}
        <View style={styles.bottom}>
          <View style={styles.info}>
            <EventTag type={event.type} />
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
          </View>
          <View style={styles.arrow}>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      width: 140,
      borderRadius: 20,
      backgroundColor: colors.surface.base.secondary,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    cardInner: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.8,
    },
    image: {
      width: '100%',
      height: 120,
    },
    imagePlaceholder: {
      width: '100%',
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.base.primary,
    },
    bottom: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: space['200'],
      gap: space['100'],
    },
    info: {
      flex: 1,
      gap: space['100'],
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.content.onBase.primary,
    },
    arrow: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.surface.saseBlue.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
