import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import HomePage from '@/app/(tabs)/index';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { useProfile } from '@/context/ProfileContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { getPrograms } from '@/services/programs';
import { profileFixture } from '@/test-utils/profile';
import { ProgramWithPoCs } from '@/types/programs';

jest.mock('@/services/programs');

jest.mock('@/context/AuthContext', () => ({
  ...jest.requireActual('@/context/AuthContext'),
  useAuth: jest.fn(),
}));

jest.mock('@/context/EventsContext', () => ({
  ...jest.requireActual('@/context/EventsContext'),
  useEvents: jest.fn(),
}));

jest.mock('@/context/ProfileContext', () => ({
  ...jest.requireActual('@/context/ProfileContext'),
  useProfile: jest.fn(),
}));

const HOUR = 1000 * 60 * 60;

function makeUpcomingEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'upcoming-1',
    title: 'Resume Workshop',
    type: 'career' as const,
    starts_at: new Date(Date.now() + 24 * HOUR).toISOString(),
    ends_at: new Date(Date.now() + 26 * HOUR).toISOString(),
    location_name: 'Marston Library',
    checkin_code: '123456',
    points_value: 1,
    flyer_url: null,
    rsvp: 'link-1',
    is_rsvped: false,
    has_attended: false,
    ...overrides,
  };
}

function makeProgram(overrides: Partial<ProgramWithPoCs> = {}): ProgramWithPoCs {
  return {
    id: 'prog-1',
    name: 'Mentorship Program',
    slug: 'mentorship',
    category: 'community',
    display_order: 1,
    short_description: 'Connect with mentors in STEM.',
    description: 'A full year mentorship program.',
    image_url: null,
    is_active: true,
    application_url: 'https://example.com/apply',
    opens_at: new Date(Date.now() - 24 * HOUR).toISOString(),
    closes_at: new Date(Date.now() + 24 * HOUR).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: null,
    pocs: [],
    ...overrides,
  };
}

function mockEvents(overrides: Record<string, unknown> = {}) {
  (useEvents as jest.Mock).mockReturnValue({
    events: [],
    activeEvents: [],
    loading: false,
    refreshing: false,
    error: null,
    refreshEvents: jest.fn(),
    markEventAttended: jest.fn(),
    toggleRsvp: jest.fn(),
    ...overrides,
  });
}

function renderHomePage() {
  return render(
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>,
  );
}

describe('HomePage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      isRecovering: false,
      setIsRecovering: jest.fn(),
      signOut: jest.fn(),
    });
    (useEvents as jest.Mock).mockReturnValue({
      events: [],
      activeEvents: [],
      loading: false,
      refreshing: false,
      error: null,
      refreshEvents: jest.fn(),
      markEventAttended: jest.fn(),
      toggleRsvp: jest.fn(),
    });
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      isLoading: false,
      error: null,
      reload: jest.fn(),
      save: jest.fn(),
    });
    (getPrograms as jest.Mock).mockResolvedValue([]);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders SASE flask and logo header', async () => {
    await renderHomePage();

    expect(screen.getByRole('image', { name: 'UF SASE Logo' })).toBeTruthy();
    expect(screen.getByTestId('home-sase-flask')).toBeTruthy();
    expect(screen.getByTestId('home-sase-brand')).toBeTruthy();
  });

  it('renders profile picture button and navigates to /profile on press', async () => {
    const user = userEvent.setup();
    await renderHomePage();

    const profileButton = screen.getByRole('button', { name: 'Profile' });
    expect(profileButton).toBeTruthy();
    expect(screen.getByTestId('home-profile-image')).toBeTruthy();

    await user.press(profileButton);

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it("renders authenticated user's profile picture with their name", async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: profileFixture,
      isLoading: false,
      error: null,
      reload: jest.fn(),
      save: jest.fn(),
    });

    await renderHomePage();

    expect(screen.getByLabelText(`${profileFixture.full_name}'s profile picture`)).toBeTruthy();
  });

  it('renders happening now cards when active events exist', async () => {
    const mockActiveEvent = {
      id: 'active-1',
      title: 'GBM 1: Welcome to SASE',
      type: 'gbm' as const,
      starts_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      ends_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      location_name: 'Reitz Union',
      checkin_code: '123456',
      points_value: 1,
      flyer_url: null,
      is_rsvped: false,
      has_attended: false,
    };

    (useEvents as jest.Mock).mockReturnValue({
      events: [mockActiveEvent],
      activeEvents: [mockActiveEvent],
      loading: false,
      refreshing: false,
      error: null,
      refreshEvents: jest.fn(),
      markEventAttended: jest.fn(),
      toggleRsvp: jest.fn(),
    });

    const user = userEvent.setup();
    await renderHomePage();

    expect(screen.getByText('Happening Now')).toBeTruthy();
    expect(screen.getByText('GBM 1: Welcome to SASE')).toBeTruthy();

    const card = screen.getByRole('button', {
      name: 'Happening now: GBM 1: Welcome to SASE',
    });
    await user.press(card);

    expect(mockPush).toHaveBeenCalledWith('/events/active-1');
  });

  describe('upcoming events', () => {
    it('shows a message instead of an empty row when there are no upcoming events', async () => {
      await renderHomePage();

      expect(screen.getByText(/No upcoming events right now/)).toBeTruthy();
    });

    it('shows a loading indicator while events are loading', async () => {
      mockEvents({ loading: true });

      await renderHomePage();

      expect(screen.getByLabelText('Loading events')).toBeTruthy();
      expect(screen.queryByText(/No upcoming events right now/)).toBeNull();
    });

    it('shows an error message when events fail to load', async () => {
      mockEvents({ error: 'Network request failed' });

      await renderHomePage();

      expect(screen.getByText(/Couldn't load events/)).toBeTruthy();
    });

    it('lists upcoming events and navigates to the events tab from "See all"', async () => {
      mockEvents({ events: [makeUpcomingEvent()] });
      const user = userEvent.setup();

      await renderHomePage();

      expect(screen.getByRole('button', { name: 'Resume Workshop' })).toBeTruthy();
      expect(screen.queryByText(/No upcoming events right now/)).toBeNull();

      await user.press(screen.getByRole('button', { name: 'See all events' }));

      expect(mockPush).toHaveBeenCalledWith('/events');
    });
  });

  describe('your next event', () => {
    it('is hidden when the user has no upcoming RSVP', async () => {
      mockEvents({ events: [makeUpcomingEvent()] });

      await renderHomePage();

      expect(screen.queryByText('Your Next Event')).toBeNull();
    });

    it('shows the soonest RSVPed event and lets the user cancel the RSVP', async () => {
      const toggleRsvp = jest.fn().mockResolvedValue(false);
      mockEvents({
        events: [
          makeUpcomingEvent({ id: 'not-going', title: 'Study Night' }),
          makeUpcomingEvent({
            id: 'going-later',
            title: 'Fall Banquet',
            is_rsvped: true,
            starts_at: new Date(Date.now() + 72 * HOUR).toISOString(),
          }),
          makeUpcomingEvent({
            id: 'going-soon',
            title: 'Industry Panel',
            is_rsvped: true,
            starts_at: new Date(Date.now() + 48 * HOUR).toISOString(),
          }),
        ],
        toggleRsvp,
      });
      (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });
      const user = userEvent.setup();

      await renderHomePage();

      expect(screen.getByText('Your Next Event')).toBeTruthy();
      // Only the soonest RSVP gets the full card with the RSVP toggle
      expect(screen.getAllByRole('button', { name: 'Cancel RSVP' })).toHaveLength(1);
      expect(screen.getByRole('button', { name: /^Industry Panel, on/ })).toBeTruthy();

      await user.press(screen.getByRole('button', { name: 'Cancel RSVP' }));

      expect(toggleRsvp).toHaveBeenCalledWith('going-soon');
    });
  });

  describe('open applications', () => {
    it('is hidden when no program has an open application', async () => {
      (getPrograms as jest.Mock).mockResolvedValue([
        makeProgram({ application_url: null, opens_at: null, closes_at: null }),
      ]);

      await renderHomePage();

      expect(await screen.findByText(/No upcoming events right now/)).toBeTruthy();
      expect(screen.queryByText('Open Applications')).toBeNull();
    });

    it('is hidden when programs fail to load', async () => {
      (getPrograms as jest.Mock).mockRejectedValue(new Error('Network request failed'));

      await renderHomePage();

      expect(await screen.findByText(/No upcoming events right now/)).toBeTruthy();
      expect(screen.queryByText('Open Applications')).toBeNull();
    });

    it('shows programs with open applications and navigates to the program', async () => {
      (getPrograms as jest.Mock).mockResolvedValue([makeProgram()]);
      const user = userEvent.setup();

      await renderHomePage();

      expect(await screen.findByText('Open Applications')).toBeTruthy();

      await user.press(screen.getByRole('button', { name: 'Mentorship Program' }));

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/programs/mentorship',
        params: { name: 'Mentorship Program' },
      });
    });

    it('navigates to the programs tab from "See all"', async () => {
      (getPrograms as jest.Mock).mockResolvedValue([makeProgram()]);
      const user = userEvent.setup();

      await renderHomePage();

      await user.press(await screen.findByRole('button', { name: 'See all programs' }));

      expect(mockPush).toHaveBeenCalledWith('/programs');
    });
  });
});
