import React from 'react';
import { Linking } from 'react-native';
import {
  render,
  screen,
  userEvent,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react-native';
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

      // Check-in container and gradient fade are displayed
      expect(screen.getByTestId('bottom-check-in-container')).toBeTruthy();
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

      // Switch to Code mode
      await user.press(screen.getByText('Code'));

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

    it('renders POC contact cards under Contacts section', async () => {
      const eventWithPocs = {
        ...baseEvent,
        program: {
          id: 'prog-1',
          name: 'Mentorship',
          program_members: [
            {
              id: 'poc-1',
              user_id: 'u1',
              display_name: 'Alice',
              is_poc: true,
              profile: {
                id: 'u1',
                full_name: 'Alice Smith',
                avatar_url: 'https://example.com/alice.png',
              },
            },
            {
              id: 'poc-2',
              user_id: 'u2',
              display_name: 'Bob',
              is_poc: true,
              profile: {
                id: 'u2',
                full_name: 'Bob Jones',
                avatar_url: null,
              },
            },
            {
              id: 'non-poc',
              user_id: 'u3',
              display_name: 'Charlie',
              is_poc: false,
              profile: null,
            },
          ],
        },
      };

      (eventsService.getEvent as jest.Mock).mockResolvedValue(eventWithPocs);

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      expect(screen.getByText('Contacts')).toBeTruthy();
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
      expect(screen.queryByText('Charlie')).toBeNull();
    });
  });

  describe('About section expand/collapse', () => {
    it('does not display toggle button when description is short', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue(baseEvent);

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      expect(screen.getByText('About')).toBeTruthy();
      expect(screen.getByText('To infinity and GBM 2!')).toBeTruthy();
      expect(screen.queryByTestId('event-about-toggle-button')).toBeNull();
      expect(screen.queryByText('Show more')).toBeNull();
    });

    it('displays toggle button with 5 lines default when description has many lines', async () => {
      const longDescription = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7';
      const eventWithLongDesc = {
        ...baseEvent,
        description: longDescription,
      };
      (eventsService.getEvent as jest.Mock).mockResolvedValue(eventWithLongDesc);
      const user = userEvent.setup();

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      const aboutText = screen.getByTestId('event-about-text');
      expect(aboutText.props.numberOfLines).toBe(5);

      const toggleButton = screen.getByTestId('event-about-toggle-button');
      expect(screen.getByText('Show more')).toBeTruthy();

      // Tap "Show more" -> expands full text
      await user.press(toggleButton);

      expect(screen.getByText('Show less')).toBeTruthy();
      expect(aboutText.props.numberOfLines).toBeUndefined();

      // Tap "Show less" -> collapses back to 5 lines
      await user.press(toggleButton);

      expect(screen.getByText('Show more')).toBeTruthy();
      expect(aboutText.props.numberOfLines).toBe(5);
    });

    it('expands text when layout event indicates more than 5 lines', async () => {
      const moderateDescription =
        'A moderately long description that wraps across multiple lines on screen.';
      const eventWithModerateDesc = {
        ...baseEvent,
        description: moderateDescription,
      };
      (eventsService.getEvent as jest.Mock).mockResolvedValue(eventWithModerateDesc);
      const user = userEvent.setup();

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      const aboutText = screen.getByTestId('event-about-text');
      expect(screen.queryByTestId('event-about-toggle-button')).toBeNull();

      // Simulate onTextLayout with 6 lines
      fireEvent(aboutText, 'textLayout', {
        nativeEvent: {
          lines: [{}, {}, {}, {}, {}, {}],
        },
      });

      expect(await screen.findByTestId('event-about-toggle-button')).toBeTruthy();
      expect(screen.getByText('Show more')).toBeTruthy();
      expect(aboutText.props.numberOfLines).toBe(5);

      await user.press(screen.getByTestId('event-about-toggle-button'));
      expect(screen.getByText('Show less')).toBeTruthy();
      expect(aboutText.props.numberOfLines).toBeUndefined();
    });
  });

  describe('Backdrop display', () => {
    it('renders blurred flyer image when flyer_url is present', async () => {
      const flyerUrl = 'https://example.com/flyer.jpg';
      (eventsService.getEvent as jest.Mock).mockResolvedValue({
        ...baseEvent,
        flyer_url: flyerUrl,
      });

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      const backdropImage = screen.getByTestId('event-backdrop-image');
      expect(backdropImage).toBeTruthy();
      expect(backdropImage.props.source).toEqual([{ uri: flyerUrl }]);
      expect(screen.queryByTestId('event-backdrop-gradient')).toBeNull();
    });

    it('renders linear gradient background when flyer_url is not present', async () => {
      (eventsService.getEvent as jest.Mock).mockResolvedValue({
        ...baseEvent,
        flyer_url: null,
      });

      await renderScreen();
      await screen.findByText('GBM 2: SASE Story');

      expect(screen.getByTestId('event-backdrop-gradient')).toBeTruthy();
      expect(screen.queryByTestId('event-backdrop-image')).toBeNull();
    });
  });
});
