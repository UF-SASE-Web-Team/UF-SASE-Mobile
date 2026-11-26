import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { HappeningNowCard } from '@/components/events/HappeningNowCard';
import { ThemeProvider } from '@/context/ThemeContext';
import { EventWithRsvp } from '@/types/events';

type HappeningNowCardProps = React.ComponentProps<typeof HappeningNowCard>;

async function renderCard(props: HappeningNowCardProps) {
  return await render(
    <ThemeProvider>
      <HappeningNowCard {...props} />
    </ThemeProvider>,
  );
}

describe('HappeningNowCard', () => {
  afterEach(async () => {
    await cleanup();
  });

  const now = Date.now();
  const mockEvent: EventWithRsvp = {
    id: 'event-now-1',
    title: 'Active GBM',
    description: 'Current active meeting',
    type: 'gbm',
    starts_at: new Date(now - 1800000).toISOString(),
    ends_at: new Date(now + 3600000).toISOString(),
    checkin_opens_at: new Date(now - 3600000).toISOString(),
    checkin_closes_at: new Date(now + 3600000).toISOString(),
    location_name: 'Reitz Union',
    address: 'Gainesville, FL',
    lat: null,
    lng: null,
    points_value: 5,
    flyer_url: null,
    created_at: new Date().toISOString(),
    program_id: null,
    rsvp: null,
    is_rsvped: true,
    has_attended: false,
  };

  it('renders Happening Now header, title, and Check-in button when not checked in', async () => {
    const onCheckInPress = jest.fn();
    const onPress = jest.fn();
    const user = userEvent.setup();

    await renderCard({
      event: mockEvent,
      hasCheckedIn: false,
      onCheckInPress,
      onPress,
    });

    expect(screen.getByText('Happening Now')).toBeTruthy();
    expect(screen.getByText('Active GBM')).toBeTruthy();
    expect(screen.getByLabelText('Check-in')).toBeTruthy();
    expect(screen.queryByTestId('happening-now-checked-in-badge')).toBeNull();

    await user.press(screen.getByLabelText('Check-in'));
    expect(onCheckInPress).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders Checked in badge in header and removes Check-in button when checked in', async () => {
    const onCheckInPress = jest.fn();
    const onPress = jest.fn();
    const user = userEvent.setup();

    await renderCard({
      event: mockEvent,
      hasCheckedIn: true,
      onCheckInPress,
      onPress,
    });

    expect(screen.getByText('Happening Now')).toBeTruthy();
    expect(screen.getByTestId('happening-now-checked-in-badge')).toBeTruthy();
    expect(screen.getByText('Checked in')).toBeTruthy();
    expect(screen.queryByLabelText('Check-in')).toBeNull();

    await user.press(screen.getByLabelText('Happening now: Active GBM'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onCheckInPress).not.toHaveBeenCalled();
  });
});
