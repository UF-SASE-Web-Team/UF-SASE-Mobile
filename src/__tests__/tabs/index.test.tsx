import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import HomePage from '@/app/(tabs)/index';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventsContext';
import { useProfile } from '@/context/ProfileContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { profileFixture } from '@/test-utils/profile';

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
});
