import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { HomeEventCard } from '@/components/HomeEventCard';
import { ThemeProvider } from '@/context/ThemeContext';
import { EventRow } from '@/types/events';

type HomeEventCardProps = React.ComponentProps<typeof HomeEventCard>;

function renderHomeEventCard(props: HomeEventCardProps) {
  return render(
    <ThemeProvider>
      <HomeEventCard {...props} />
    </ThemeProvider>,
  );
}

describe('HomeEventCard', () => {
  afterEach(async () => {
    await cleanup();
  });

  const baseEvent: EventRow = {
    id: 'test-event-1',
    title: 'General Body Meeting 1',
    description: 'Welcome meeting',
    flyer_url: null,
    type: 'gbm',
    starts_at: new Date(Date.now() + 3600 * 1000 * 24).toISOString(), // tomorrow
    ends_at: new Date(Date.now() + 3600 * 1000 * 26).toISOString(),
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
    rsvp: null,
  };

  it('shows the event title', async () => {
    await renderHomeEventCard({ event: baseEvent, onPress: jest.fn() });

    expect(screen.getByText('General Body Meeting 1')).toBeTruthy();
  });

  it('shows the event type tag', async () => {
    await renderHomeEventCard({ event: baseEvent, onPress: jest.fn() });

    expect(screen.getByLabelText('Category: GBM')).toBeTruthy();
  });

  it('shows no type tag for events of type "other"', async () => {
    await renderHomeEventCard({ event: { ...baseEvent, type: 'other' }, onPress: jest.fn() });

    expect(screen.queryByLabelText(/^Category:/)).toBeNull();
  });

  it('shows a placeholder when the event has no flyer', async () => {
    await renderHomeEventCard({ event: baseEvent, onPress: jest.fn() });

    expect(screen.getByTestId('home-event-card-placeholder-test-event-1')).toBeTruthy();
  });

  it('does not show the placeholder when the event has a flyer', async () => {
    await renderHomeEventCard({
      event: { ...baseEvent, flyer_url: 'https://example.com/flyer.png' },
      onPress: jest.fn(),
    });

    expect(screen.queryByTestId('home-event-card-placeholder-test-event-1')).toBeNull();
  });

  it('calls onPress with the event when the card is pressed', async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();

    await renderHomeEventCard({ event: baseEvent, onPress: handlePress });

    await user.press(screen.getByRole('button', { name: 'General Body Meeting 1' }));
    expect(handlePress).toHaveBeenCalledWith(baseEvent);
  });
});
