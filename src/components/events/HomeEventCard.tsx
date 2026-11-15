import { EventTag } from '@/components/events/EventTag';
import { PosterCard } from '@/components/ui/PosterCard';
import { useTheme } from '@/context/ThemeContext';
import { getRelativeEventOverline } from '@/lib/dates';
import { EventRow } from '@/types/events';

type HomeEventCardProps = {
  event: EventRow;
  onPress: (event: EventRow) => void;
};

/**
 * Image-first event card for the home screen row.
 * Uses PosterCard for full-bleed flyer, dark scrim, category tag on the top-left,
 * and relative time overline above the title.
 */
export function HomeEventCard({ event, onPress }: HomeEventCardProps) {
  const { colors } = useTheme();
  const overline = getRelativeEventOverline(event.starts_at);

  return (
    <PosterCard
      title={event.title}
      overline={overline?.text}
      overlineColor={
        overline?.isToday ? colors.content.accent.primary : colors.content.onMedia.primary
      }
      imageUrl={event.flyer_url}
      fallbackIcon="calendar-outline"
      topLeftBadge={<EventTag type={event.type} variant="onMedia" />}
      onPress={() => onPress(event)}
      testID={`home-event-card-${event.id}`}
      placeholderTestID={`home-event-card-placeholder-${event.id}`}
    />
  );
}
