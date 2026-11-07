import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { EventCard, EventCardProps } from '@/components/EventCard';
import { ThemeProvider } from '@/context/ThemeContext';
import { EventWithRsvp } from '@/types/events';

function renderEventCard(props: EventCardProps) {
  return render(
    <ThemeProvider>
      <EventCard {...props} />
    </ThemeProvider>,
  );
}

describe('EventCard', () => {
  afterEach(async () => {
    await cleanup();
  });

  const baseEvent: EventWithRsvp = {
    id: 'test-event-1',
    title: 'General Body Meeting 1',
    description: 'Welcome meeting',
    flyer_url: null,
    type: 'gbm',
    starts_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // 1 day ago
    ends_at: new Date(Date.now() - 3600 * 1000 * 22).toISOString(), // 22 hours ago
    location_name: 'Turlington Hall',
    address: 'Gainesville, FL',
    lat: null,
    lng: null,
    points_value: 3,
    checkin_code: '123456',
    checkin_opens_at: null,
    checkin_closes_at: null,
    created_at: new Date().toISOString(),
    program_id: null,
    flyer_url: null,
  };

  describe('Past events', () => {
    it('shows +{point_value} when the event was attended via prop', async () => {
      await renderEventCard({ event: baseEvent, hasAttended: true });

      expect(screen.getByText('+3')).toBeTruthy();
      expect(screen.getByLabelText('+3 points')).toBeTruthy();
      expect(screen.queryByText('RSVP')).toBeNull();
      expect(screen.queryByText('Going')).toBeNull();
    });

    it('shows +{point_value} when the event was attended via event.has_attended', async () => {
      const attendedEvent: EventWithRsvp = {
        ...baseEvent,
        has_attended: true,
      };

      await renderEventCard({ event: attendedEvent });

      expect(screen.getByText('+3')).toBeTruthy();
      expect(screen.getByLabelText('+3 points')).toBeTruthy();
    });

    it('does NOT show +{point_value} when the event was not attended', async () => {
      await renderEventCard({ event: baseEvent, hasAttended: false });

      expect(screen.queryByText('+3')).toBeNull();
      expect(screen.queryByLabelText('+3 points')).toBeNull();
      expect(screen.queryByText('RSVP')).toBeNull();
      expect(screen.queryByText('Going')).toBeNull();
    });

    it('does NOT show +{point_value} by default when attendance is omitted', async () => {
      await renderEventCard({ event: baseEvent });

      expect(screen.queryByText('+3')).toBeNull();
      expect(screen.queryByLabelText('+3 points')).toBeNull();
    });
  });

  describe('Upcoming events', () => {
    const upcomingEvent: EventWithRsvp = {
      ...baseEvent,
      starts_at: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // tomorrow
      ends_at: new Date(Date.now() + 3600 * 1000 * 26).toISOString(),
    };

    it('shows RSVP button when not rsvped', async () => {
      await renderEventCard({ event: upcomingEvent, isRsvped: false });

      expect(screen.getByText('RSVP')).toBeTruthy();
      expect(screen.queryByText('+3')).toBeNull();
    });

    it('shows Going button when rsvped', async () => {
      await renderEventCard({ event: upcomingEvent, isRsvped: true });

      expect(screen.getByText('Going')).toBeTruthy();
      expect(screen.queryByText('+3')).toBeNull();
    });

    it('calls onRsvpPress when RSVP button is clicked', async () => {
      const handleRsvpPress = jest.fn();
      const user = userEvent.setup();

      await renderEventCard({
        event: upcomingEvent,
        isRsvped: false,
        onRsvpPress: handleRsvpPress,
      });

      await user.press(screen.getByText('RSVP'));
      expect(handleRsvpPress).toHaveBeenCalledWith(upcomingEvent);
    });
  });

  describe('Interactions', () => {
    it('calls onPress when the card is pressed', async () => {
      const handlePress = jest.fn();
      const user = userEvent.setup();

      await renderEventCard({ event: baseEvent, onPress: handlePress });

      await user.press(screen.getByRole('button', { name: new RegExp(baseEvent.title) }));
      expect(handlePress).toHaveBeenCalledWith(baseEvent);
    });
  });
});
