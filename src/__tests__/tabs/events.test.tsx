import React from 'react';
import { Alert } from 'react-native';
import { render, screen, waitFor, fireEvent, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import EventsPage from '@/app/(tabs)/events/index';
import { EventsProvider } from '@/context/EventsContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import * as eventsService from '@/services/events';

jest.mock('@/services/events');
jest.mock('@expo/ui/community/menu', () => {
  const { TouchableOpacity } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    MenuView: ({ children, onPressAction, actions }: any) => {
      const isTimeMenu = actions?.some((a: any) => a.id === 'past');
      return (
        <TouchableOpacity
          testID={isTimeMenu ? 'time-filter-menu' : 'type-filter-menu'}
          onPress={() => {
            if (isTimeMenu) {
              onPressAction({ nativeEvent: { event: 'past' } });
            }
          }}
        >
          {children}
        </TouchableOpacity>
      );
    },
  };
});

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <EventsProvider>
          <EventsPage />
        </EventsProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('EventsPage', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const now = Date.now();
  const pastEvent1 = {
    id: 'past-1',
    title: 'Older Past Event',
    type: 'gbm',
    starts_at: new Date(now - 86400000 * 60).toISOString(), // 60 days ago
    ends_at: new Date(now - 86400000 * 60 + 3600000).toISOString(),
    is_rsvped: false,
    has_attended: true,
  };
  const pastEvent2 = {
    id: 'past-2',
    title: 'Recent Past Event',
    type: 'social',
    starts_at: new Date(now - 86400000 * 5).toISOString(), // 5 days ago
    ends_at: new Date(now - 86400000 * 5 + 3600000).toISOString(),
    is_rsvped: true,
    has_attended: false,
  };
  const upcomingEvent = {
    id: 'upcoming-1',
    title: 'Future Event',
    type: 'career',
    starts_at: new Date(now + 86400000 * 5).toISOString(), // 5 days ahead
    ends_at: new Date(now + 86400000 * 5 + 3600000).toISOString(),
    is_rsvped: false,
    has_attended: false,
  };

  it('renders upcoming events by default', async () => {
    (eventsService.getEvents as jest.Mock).mockResolvedValue([
      pastEvent1,
      pastEvent2,
      upcomingEvent,
    ]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Future Event')).toBeTruthy();
    });

    expect(screen.queryByText('Older Past Event')).toBeNull();
    expect(screen.queryByText('Recent Past Event')).toBeNull();
  });

  it('reverses the order of events when time filter is "past"', async () => {
    // getEvents returns events in ascending order by starts_at
    (eventsService.getEvents as jest.Mock).mockResolvedValue([
      pastEvent1,
      pastEvent2,
      upcomingEvent,
    ]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Future Event')).toBeTruthy();
    });

    // Tap the time filter menu to select "past"
    fireEvent.press(screen.getByTestId('time-filter-menu'));

    await waitFor(() => {
      expect(screen.getByText('Recent Past Event')).toBeTruthy();
      expect(screen.getByText('Older Past Event')).toBeTruthy();
    });

    expect(screen.queryByText('Future Event')).toBeNull();

    // Verify order: Recent Past Event should come BEFORE Older Past Event
    const titles = screen.getAllByText(/Past Event/).map((node) => node.props.children);
    expect(titles).toEqual(['Recent Past Event', 'Older Past Event']);
  });

  it('opens check-in modal when Check-in button on HappeningNowCard is pressed and completes check-in', async () => {
    const happeningNowEvent = {
      id: 'now-1',
      title: 'Active Now GBM',
      type: 'gbm',
      starts_at: new Date(now - 1800000).toISOString(),
      ends_at: new Date(now + 3600000).toISOString(),
      checkin_opens_at: new Date(now - 3600000).toISOString(),
      checkin_closes_at: new Date(now + 3600000).toISOString(),
      points_value: 10,
      is_rsvped: false,
      has_attended: false,
    };

    (eventsService.getEvents as jest.Mock).mockResolvedValue([happeningNowEvent]);
    (eventsService.checkInToEvent as jest.Mock).mockResolvedValue(true);
    const user = userEvent.setup();

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Happening Now')).toBeTruthy();
      expect(screen.getAllByText('Active Now GBM').length).toBeGreaterThan(0);
    });

    const checkInBtn = screen.getByLabelText('Check-in');
    await user.press(checkInBtn);

    // Modal appears
    expect(await screen.findByText('Event Check-in')).toBeTruthy();

    // Enter 6 digit code
    const input = screen.getByDisplayValue('');
    await user.type(input, '123456');

    await waitFor(() => {
      expect(eventsService.checkInToEvent).toHaveBeenCalledWith('now-1', '123456');
    });
  });

  it('prompts user to sign in if pressing Check-in without being logged in', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const happeningNowEvent = {
      id: 'now-1',
      title: 'Active Now GBM',
      type: 'gbm',
      starts_at: new Date(now - 1800000).toISOString(),
      ends_at: new Date(now + 3600000).toISOString(),
      checkin_opens_at: new Date(now - 3600000).toISOString(),
      checkin_closes_at: new Date(now + 3600000).toISOString(),
      points_value: 10,
      is_rsvped: false,
      has_attended: false,
    };

    (eventsService.getEvents as jest.Mock).mockResolvedValue([happeningNowEvent]);
    const user = userEvent.setup();

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Happening Now')).toBeTruthy();
      expect(screen.getAllByText('Active Now GBM').length).toBeGreaterThan(0);
    });

    const checkInBtn = screen.getByLabelText('Check-in');
    await user.press(checkInBtn);

    expect(alertSpy).toHaveBeenCalledWith(
      'Sign in required',
      'Please sign in to check in to events.',
    );
  });

  it('shows Checked in badge on HappeningNowCard when user has already attended', async () => {
    const attendedEvent = {
      id: 'now-1',
      title: 'Active Now GBM',
      type: 'gbm',
      starts_at: new Date(now - 1800000).toISOString(),
      ends_at: new Date(now + 3600000).toISOString(),
      checkin_opens_at: new Date(now - 3600000).toISOString(),
      checkin_closes_at: new Date(now + 3600000).toISOString(),
      points_value: 10,
      is_rsvped: true,
      has_attended: true,
    };

    (eventsService.getEvents as jest.Mock).mockResolvedValue([attendedEvent]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Happening Now')).toBeTruthy();
      expect(screen.getByTestId('happening-now-checked-in-badge')).toBeTruthy();
    });

    expect(screen.queryByLabelText('Check-in')).toBeNull();
  });
});
