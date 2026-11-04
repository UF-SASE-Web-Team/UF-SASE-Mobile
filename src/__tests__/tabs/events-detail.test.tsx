import React from 'react';
import { Linking } from 'react-native';
import { render, screen, userEvent, cleanup, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EventDetailScreen from '@/app/events/[id]';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import * as eventsService from '@/services/events';

jest.mock('@/services/events');

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <EventDetailScreen />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('EventDetailScreen', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'event-1' });
  });

  afterEach(async () => {
    await cleanup();
  });

  const baseEvent: any = {
    id: 'event-1',
    title: 'GBM 2: SASE Story',
    description: 'To infinity and GBM 2!',
    type: 'gbm',
    starts_at: new Date(Date.now() + 3600 * 1000 * 48).toISOString(), // 2 days in future
    ends_at: new Date(Date.now() + 3600 * 1000 * 50).toISOString(),
    location_name: 'NPB 1001',
    address: 'Gainesville, FL',
    points_value: 1,
    checkin_code: '123456',
    checkin_opens_at: null,
    checkin_closes_at: null,
    created_at: new Date().toISOString(),
    program_id: null,
    is_rsvped: false,
    has_attended: false,
  };

  it('renders loading indicator initially', async () => {
    (eventsService.getEvent as jest.Mock).mockReturnValue(new Promise(() => {}));

    await renderScreen();

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error state when event is not found', async () => {
    (eventsService.getEvent as jest.Mock).mockResolvedValue(null);

    await renderScreen();

    expect(await screen.findByText('Event not found.')).toBeTruthy();
    expect(screen.getByText('Go Back')).toBeTruthy();
  });

  describe('Before check-in opens', () => {
    it('shows RSVP button and does not show bottom check-in button', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue(baseEvent);

      await renderScreen();

      expect(await screen.findByText('GBM 2: SASE Story')).toBeTruthy();
      expect(screen.getByText('NPB 1001')).toBeTruthy();
      expect(screen.getByText('About')).toBeTruthy();
      expect(screen.getByText('To infinity and GBM 2!')).toBeTruthy();

      // Top-right RSVP button visible
      expect(screen.getByText('RSVP')).toBeTruthy();

      // Bottom check-in button NOT visible
      expect(screen.queryByText('Check-in')).toBeNull();
    });

    it('toggles RSVP status when RSVP button is clicked', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue(baseEvent);
      (eventsService.toggleEventRsvp as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();

      await renderScreen();

      const rsvpButton = await screen.findByText('RSVP');
      await user.press(rsvpButton);

      expect(eventsService.toggleEventRsvp).toHaveBeenCalledWith('event-1');
      expect(await screen.findByText('Going')).toBeTruthy();
    });
  });

  describe('When check-in is open', () => {
    const openCheckInEvent = {
      ...baseEvent,
      starts_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(), // started 1 hour ago
      ends_at: new Date(Date.now() + 3600 * 1000 * 1).toISOString(), // ends in 1 hour
      checkin_opens_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      checkin_closes_at: new Date(Date.now() + 3600 * 1000 * 1).toISOString(),
      is_rsvped: true,
      has_attended: false,
    };

    it('hides RSVP button and displays bottom Check-in button', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue(openCheckInEvent);

      await renderScreen();

      await screen.findByText('GBM 2: SASE Story');

      // Top-right RSVP button should have disappeared
      expect(screen.queryByText('RSVP')).toBeNull();
      expect(screen.queryByText('Going')).toBeNull();

      // Bottom Check-in button is displayed
      expect(screen.getByText('Check-in')).toBeTruthy();

      // Check-in container is transparent and contains gradient fade
      const bottomContainer = screen.getByTestId('bottom-check-in-container');
      expect(bottomContainer).toBeTruthy();
      expect(bottomContainer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: 'transparent',
          }),
        ]),
      );
      expect(screen.getByTestId('bottom-fade-gradient')).toBeTruthy();
    });

    it('opens check-in modal when bottom Check-in button is pressed and completes check-in', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue(openCheckInEvent);
      (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
      const user = userEvent.setup();

      await renderScreen();

      const checkInBtn = await screen.findByText('Check-in');
      await user.press(checkInBtn);

      // Modal appears
      expect(await screen.findByText('Event Check-in')).toBeTruthy();

      // Enter 6 digit code
      const input = screen.getByDisplayValue('');
      await user.type(input, '123456');

      await waitFor(() => {
        expect(eventsService.checkInToEvent).toHaveBeenCalledWith('event-1', '123456');
      });

      // After checked in: Top right shows "Checked in", bottom Check-in button is gone
      expect(await screen.findByText('Checked in')).toBeTruthy();
      expect(screen.queryByText('Check-in')).toBeNull();
    });
  });

  describe('When already checked in', () => {
    const checkedInEvent = {
      ...baseEvent,
      starts_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      ends_at: new Date(Date.now() + 3600 * 1000 * 1).toISOString(),
      is_rsvped: true,
      has_attended: true,
    };

    it('shows Checked in badge at top right and no bottom check-in button', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue(checkedInEvent);

      await renderScreen();

      await screen.findByText('GBM 2: SASE Story');

      // Top-right Checked in badge
      expect(screen.getByText('Checked in')).toBeTruthy();
      expect(screen.getByLabelText('Checked in')).toBeTruthy();

      // RSVP and bottom check-in button are not present
      expect(screen.queryByText('RSVP')).toBeNull();
      expect(screen.queryByText('Going')).toBeNull();
      expect(screen.queryByText('Check-in')).toBeNull();
    });
  });

  describe('Links section', () => {
    it('does not render Links section when event has no links', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue({
        ...baseEvent,
        links: [],
      });

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      expect(screen.queryByText('Links')).toBeNull();
    });

    it('renders Links section and opens link on tap', async () => {
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);

      const eventWithLinks = {
        ...baseEvent,
        links: [{ id: 'link-1', title: 'Carpool Sheet', url: 'https://docs.google.com/carpool' }],
      };
      (eventsService.getEvent as jest.Mock).mockResolvedValue(eventWithLinks);
      const user = userEvent.setup();

      await renderScreen();

      expect(await screen.findByText('Links')).toBeTruthy();
      const linkCard = screen.getByText('Carpool Sheet');
      expect(linkCard).toBeTruthy();

      await user.press(linkCard);
      expect(openURLSpy).toHaveBeenCalledWith('https://docs.google.com/carpool');
    });
  });

  describe('Back navigation', () => {
    it('calls router.back when router.canGoBack returns true', async () => {
      const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: jest.fn(() => true),
      };
      (useRouter as jest.Mock).mockReturnValue(mockRouter);
      (eventsService.getEvent as jest.Mock).mockResolvedValue(baseEvent);
      const user = userEvent.setup();

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      const backButton = screen.getByLabelText('Go back');
      await user.press(backButton);

      expect(mockRouter.canGoBack).toHaveBeenCalled();
      expect(mockRouter.back).toHaveBeenCalled();
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('calls router.replace with /events when router.canGoBack returns false (deep link)', async () => {
      const mockRouter = {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        canGoBack: jest.fn(() => false),
      };
      (useRouter as jest.Mock).mockReturnValue(mockRouter);
      (eventsService.getEvent as jest.Mock).mockResolvedValue(baseEvent);
      const user = userEvent.setup();

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      const backButton = screen.getByLabelText('Go back');
      await user.press(backButton);

      expect(mockRouter.canGoBack).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/events');
      expect(mockRouter.back).not.toHaveBeenCalled();
    });
  });
});
