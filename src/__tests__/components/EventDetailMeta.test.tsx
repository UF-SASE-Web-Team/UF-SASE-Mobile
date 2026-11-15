import React from 'react';
import { render, screen, cleanup, userEvent } from '@testing-library/react-native';
import { EventDetailMeta, EventDetailMetaProps } from '@/components/events/EventDetailMeta';
import { ThemeProvider } from '@/context/ThemeContext';
import * as linksModule from '@/lib/links';

jest.mock('@/lib/links', () => ({
  ...jest.requireActual('@/lib/links'),
  openMapLocation: jest.fn(),
}));

async function renderMeta(props: Partial<EventDetailMetaProps> = {}) {
  const defaultProps: EventDetailMetaProps = {
    formattedDate: 'Wednesday, Oct 23',
    formattedTimeWithDoors: '6:30 PM - 8:00 PM',
    locationName: 'NPB 1001',
    ...props,
  };

  return render(
    <ThemeProvider>
      <EventDetailMeta {...defaultProps} />
    </ThemeProvider>,
  );
}

describe('EventDetailMeta', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  it('renders date, time, and location information', async () => {
    await renderMeta({
      formattedDate: 'Wednesday, Oct 23',
      formattedTimeWithDoors: '6:30 PM',
      locationName: 'NPB 1001',
    });

    expect(screen.getByText('Wednesday, Oct 23')).toBeTruthy();
    expect(screen.getByText('6:30 PM')).toBeTruthy();
    expect(screen.getByText('NPB 1001')).toBeTruthy();
  });

  it('renders static non-clickable location when address does not exist', async () => {
    await renderMeta({
      locationName: 'TBD',
      address: null,
    });

    expect(screen.getByTestId('event-detail-location-static')).toBeTruthy();
    expect(screen.queryByTestId('event-detail-location-pressable')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders clickable link when address is provided', async () => {
    const user = userEvent.setup();
    const onLocationPress = jest.fn();

    await renderMeta({
      locationName: 'NPB 1001',
      address: 'Gainesville, FL',
      onLocationPress,
    });

    const link = screen.getByRole('link', { name: /Location: NPB 1001/i });
    expect(link).toBeTruthy();
    expect(screen.getByTestId('event-detail-location-pressable')).toBeTruthy();

    await user.press(link);
    expect(onLocationPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to openMapLocation when onLocationPress is not provided', async () => {
    const user = userEvent.setup();

    await renderMeta({
      locationName: 'NPB 1001',
      address: 'Gainesville, FL',
    });

    const link = screen.getByRole('link', { name: /Location: NPB 1001/i });
    await user.press(link);

    expect(linksModule.openMapLocation).toHaveBeenCalledWith('Gainesville, FL');
  });

  it('falls back to address text when locationName is not provided', async () => {
    await renderMeta({
      locationName: null,
      address: '4501 SW 20th Ave, Gainesville, FL',
    });

    expect(screen.getByText('4501 SW 20th Ave, Gainesville, FL')).toBeTruthy();
    expect(screen.getByTestId('event-detail-location-pressable')).toBeTruthy();
  });
});
