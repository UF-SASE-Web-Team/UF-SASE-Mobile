import { EventTag } from '@/components/events/EventTag';
import { PosterCard } from '@/components/ui/PosterCard';
import { EventRow } from '@/types/events';

type HomeEventCardProps = {
  event: EventRow;
  onPress: (event: EventRow) => void;
};

/**
 * Image-first event card for the home screen row.
 * Uses PosterCard for full-bleed flyer, dark scrim, and overlaid title.
 */
export function HomeEventCard({ event, onPress }: HomeEventCardProps) {
  return (
    <PosterCard
      title={event.title}
      imageUrl={event.flyer_url}
      fallbackIcon="calendar-outline"
      topLeftBadge={<EventTag type={event.type} variant="onMedia" />}
      onPress={() => onPress(event)}
      testID={`home-event-card-${event.id}`}
      placeholderTestID={`home-event-card-placeholder-${event.id}`}
    />
  );
}
