import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@/context/ThemeContext';
import { radius, space, type Colors } from '@/theme';
import { EventRow } from '@/types/events';

type HomeEventCardProps = {
  event: EventRow;
  onPress: (event: EventRow) => void;
};

export function HomeEventCard({ event, onPress }: HomeEventCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={() => onPress(event)}
      accessibilityRole="button"
      accessibilityLabel={event.title}
      testID={`home-event-card-${event.id}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image
        source={event.flyer_url ? { uri: event.flyer_url } : undefined}
        style={styles.image}
        contentFit="cover"
      />

      <View style={styles.bottom}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={14} color="#fff" />
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
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    pressed: {
      opacity: 0.8,
    },
    image: {
      width: '100%',
      height: 120,
    },
    bottom: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: space['200'],
      gap: space['100'],
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '600',
      color: colors.surface.saseBlue.secondary,
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
