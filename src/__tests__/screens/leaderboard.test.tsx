import React from 'react';
import { render, screen, cleanup, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LeaderboardPage from '@/app/leaderboard';
import { ThemeProvider } from '@/context/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import { getLeaderboard } from '@/services/points';

jest.mock('@/context/ProfileContext');
jest.mock('@/services/points', () => ({
  getLeaderboard: jest.fn(),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <LeaderboardPage />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('LeaderboardPage', () => {
  const mockBack = jest.fn();

  const mockFallLeaderboard = [
    { rank: 1, userId: 'u1', name: 'Brandon Nguyen', points: 34, avatarUrl: 'sase-shark' },
    { rank: 2, userId: 'u2', name: 'Jessica Chen', points: 28, avatarUrl: null },
    { rank: 3, userId: 'u3', name: 'David Zhang', points: 24, avatarUrl: null },
  ];

  const mockAllTimeLeaderboard = [
    { rank: 1, userId: 'u1', name: 'Brandon Nguyen', points: 82, avatarUrl: null },
    { rank: 2, userId: 'u3', name: 'David Zhang', points: 65, avatarUrl: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: jest.fn(),
      replace: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(true),
    });
    (useProfile as jest.Mock).mockReturnValue({
      profile: { full_name: 'Test Member', username: 'testuser' },
    });
    (getLeaderboard as jest.Mock).mockImplementation((term: string | null) => {
      if (term === 'fall-2026') return Promise.resolve(mockFallLeaderboard);
      return Promise.resolve(mockAllTimeLeaderboard);
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders the header title and back button', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Leaderboard' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });

  it('navigates back when BackButton is pressed', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await user.press(screen.getByRole('button', { name: 'Go back' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders all members in the list with their rank number', async () => {
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Brandon Nguyen')).toBeTruthy();
    });

    expect(screen.getByText('Jessica Chen')).toBeTruthy();
    expect(screen.getByText('David Zhang')).toBeTruthy();
    expect(screen.getByText('Rankings')).toBeTruthy();
    expect(screen.getByTestId('leaderboard-row-1')).toBeTruthy();
    expect(screen.getByTestId('leaderboard-row-2')).toBeTruthy();
    expect(screen.getByTestId('leaderboard-row-3')).toBeTruthy();
    expect(screen.getByText('#1')).toBeTruthy();
    expect(screen.getByText('#2')).toBeTruthy();
    expect(screen.getByText('#3')).toBeTruthy();
    expect(screen.getByLabelText("Brandon Nguyen's profile picture")).toBeTruthy();
    expect(screen.getByText('J')).toBeTruthy();
    expect(screen.queryByText(/events attended/i)).toBeNull();
  });

  it('does not render floating user standing banner', async () => {
    await renderScreen();

    expect(screen.queryByTestId('leaderboard-user-standing')).toBeNull();
  });

  it('switches between semester tabs', async () => {
    const user = userEvent.setup();
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Brandon Nguyen')).toBeTruthy();
    });

    const allTimeTab = screen.getByRole('tab', { name: 'All-Time leaderboard' });
    await user.press(allTimeTab);

    await waitFor(() => {
      expect(screen.getByText('82')).toBeTruthy();
    });
    expect(getLeaderboard).toHaveBeenCalledWith(null);
  });

  it('renders empty state when no members have points', async () => {
    (getLeaderboard as jest.Mock).mockResolvedValueOnce([]);
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('No points earned for Fall 2026 yet.')).toBeTruthy();
    });
  });

  it('renders error state when fetch fails', async () => {
    (getLeaderboard as jest.Mock).mockRejectedValueOnce(new Error('Network down'));
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    });
  });

  it('navigates to member profile when a ranking row is pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
      canGoBack: jest.fn().mockReturnValue(true),
    });

    const user = userEvent.setup();
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Brandon Nguyen')).toBeTruthy();
    });

    await user.press(screen.getByTestId('leaderboard-row-1'));
    expect(mockPush).toHaveBeenCalledWith('/profile/u1');
  });
});
