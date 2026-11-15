import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  renderHook,
  cleanup,
} from '@testing-library/react-native';
import { Text, Pressable } from 'react-native';
import { EventsProvider, useEvents, useOptionalEvents } from '@/context/EventsContext';
import { useAuth } from '@/context/AuthContext';
import * as eventsService from '@/services/events';

jest.mock('@/services/events');

describe('EventsContext', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };
  const now = Date.now();

  const mockEvents = [
    {
      id: 'event-1',
      title: 'GBM 1',
      starts_at: new Date(now - 1800000).toISOString(),
      ends_at: new Date(now + 3600000).toISOString(),
      checkin_opens_at: new Date(now - 3600000).toISOString(),
      checkin_closes_at: new Date(now + 3600000).toISOString(),
      is_rsvped: false,
      has_attended: false,
    },
    {
      id: 'event-2',
      title: 'Future Social',
      starts_at: new Date(now + 86400000).toISOString(),
      ends_at: new Date(now + 86400000 + 3600000).toISOString(),
      checkin_opens_at: null,
      checkin_closes_at: null,
      is_rsvped: true,
      has_attended: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (eventsService.getEvents as jest.Mock).mockResolvedValue(mockEvents);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('throws an error when useEvents is used outside of EventsProvider', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useEvents())).rejects.toThrow(
      'useEvents must be used within an EventsProvider',
    );
    spy.mockRestore();
  });

  it('returns undefined when useOptionalEvents is used outside of EventsProvider', async () => {
    const { result } = await renderHook(() => useOptionalEvents());
    expect(result.current).toBeUndefined();
  });

  it('fetches events on mount and populates activeEvents', async () => {
    const Consumer = () => {
      const { events, activeEvents, loading } = useEvents();
      return (
        <>
          <Text testID="loading">{String(loading)}</Text>
          <Text testID="events-count">{events.length}</Text>
          <Text testID="active-count">{activeEvents.length}</Text>
          <Text testID="active-id">{activeEvents[0]?.id}</Text>
        </>
      );
    };

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('events-count').props.children).toBe(2);
    expect(screen.getByTestId('active-count').props.children).toBe(1);
    expect(screen.getByTestId('active-id').props.children).toBe('event-1');
  });

  it('includes events within 30 min before starts_at and 30 min after ends_at when check-in times are null', async () => {
    const earlyEvent = {
      id: 'early-1',
      title: 'Starts in 15 mins',
      starts_at: new Date(now + 15 * 60 * 1000).toISOString(),
      ends_at: new Date(now + 75 * 60 * 1000).toISOString(),
      checkin_opens_at: null,
      checkin_closes_at: null,
      is_rsvped: false,
      has_attended: false,
    };
    const lateEvent = {
      id: 'late-1',
      title: 'Ended 15 mins ago',
      starts_at: new Date(now - 75 * 60 * 1000).toISOString(),
      ends_at: new Date(now - 15 * 60 * 1000).toISOString(),
      checkin_opens_at: null,
      checkin_closes_at: null,
      is_rsvped: false,
      has_attended: false,
    };
    const tooEarlyEvent = {
      id: 'too-early-1',
      title: 'Starts in 45 mins',
      starts_at: new Date(now + 45 * 60 * 1000).toISOString(),
      ends_at: new Date(now + 105 * 60 * 1000).toISOString(),
      checkin_opens_at: null,
      checkin_closes_at: null,
      is_rsvped: false,
      has_attended: false,
    };

    (eventsService.getEvents as jest.Mock).mockResolvedValue([
      earlyEvent,
      lateEvent,
      tooEarlyEvent,
    ]);

    const Consumer = () => {
      const { activeEvents, loading } = useEvents();
      return (
        <>
          <Text testID="loading">{String(loading)}</Text>
          <Text testID="active-count">{activeEvents.length}</Text>
          <Text testID="active-ids">{activeEvents.map((e) => e.id).join(',')}</Text>
        </>
      );
    };

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('active-count').props.children).toBe(2);
    expect(screen.getByTestId('active-ids').props.children).toBe('early-1,late-1');
  });

  it('marks an event as attended in memory via markEventAttended', async () => {
    const Consumer = () => {
      const { events, activeEvents, markEventAttended, loading } = useEvents();
      return (
        <>
          <Text testID="loading">{String(loading)}</Text>
          <Text testID="attended">{String(events[0]?.has_attended)}</Text>
          <Text testID="active-attended">{String(activeEvents[0]?.has_attended)}</Text>
          <Pressable testID="mark-attended-btn" onPress={() => markEventAttended('event-1')}>
            <Text>Mark</Text>
          </Pressable>
        </>
      );
    };

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('attended').props.children).toBe('false');

    fireEvent.press(screen.getByTestId('mark-attended-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('attended').props.children).toBe('true');
      expect(screen.getByTestId('active-attended').props.children).toBe('true');
    });
  });

  it('toggles RSVP optimistically and updates with server response', async () => {
    (eventsService.toggleEventRsvp as jest.Mock).mockResolvedValue(true);

    const Consumer = () => {
      const { events, toggleRsvp, loading } = useEvents();
      return (
        <>
          <Text testID="loading">{String(loading)}</Text>
          <Text testID="rsvp">{String(events[0]?.is_rsvped)}</Text>
          <Pressable testID="toggle-rsvp-btn" onPress={() => toggleRsvp('event-1')}>
            <Text>Toggle</Text>
          </Pressable>
        </>
      );
    };

    render(
      <EventsProvider>
        <Consumer />
      </EventsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });

    expect(screen.getByTestId('rsvp').props.children).toBe('false');

    fireEvent.press(screen.getByTestId('toggle-rsvp-btn'));

    await waitFor(() => {
      expect(eventsService.toggleEventRsvp).toHaveBeenCalledWith('event-1');
      expect(screen.getByTestId('rsvp').props.children).toBe('true');
    });
  });
});
