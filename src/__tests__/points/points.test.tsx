import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PointsLogPage from '@/app/points';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import * as pointsService from '@/services/points';

jest.mock('@/services/points', () => ({
  ...jest.requireActual('@/services/points'),
  getPointsLog: jest.fn(),
  getPointsSummary: jest.fn(),
  getPointsLeaderboard: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  ...jest.requireActual('@/context/AuthContext'),
  useAuth: jest.fn(),
}));

const mocked = pointsService as jest.Mocked<typeof pointsService>;

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderPage() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <PointsLogPage />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('Points page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });
    mocked.getPointsLog.mockResolvedValue([
      {
        id: 'check-in-1',
        checkedInAt: '2026-09-01T22:10:00Z',
        eventId: 'event-1',
        eventTitle: 'GBM 1',
        eventType: 'gbm',
        eventStartsAt: '2026-09-01T22:00:00Z',
        pointsValue: 2,
      },
    ]);
    mocked.getPointsSummary.mockResolvedValue({
      totalPoints: 2,
      semesterPoints: 2,
      semesterRank: 3,
      rankedMembers: 10,
      termName: 'Fall 2026',
    });
    mocked.getPointsLeaderboard.mockResolvedValue([
      {
        rank: 1,
        userId: 'user-9',
        fullName: 'Alice Gator',
        username: 'alice',
        avatarUrl: null,
        points: 6,
        isMe: false,
      },
    ]);
  });

  it('loads the points log and server summary for the signed-in member', async () => {
    await renderPage();

    expect(await screen.findByTestId('points-item')).toBeTruthy();
    expect(mocked.getPointsLog).toHaveBeenCalledWith('user-1');
    expect(mocked.getPointsSummary).toHaveBeenCalledTimes(1);
    // Semester standing only appears on the Leaderboard tab.
    expect(screen.queryByTestId('semester-standing')).toBeNull();
  });

  it('does not hang on a loading state without a signed-in user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    await renderPage();

    expect(screen.getByRole('button', { name: 'Browse events' })).toBeTruthy();
    expect(mocked.getPointsLog).not.toHaveBeenCalled();
  });

  it('only fetches the leaderboard once its tab is opened', async () => {
    const user = userEvent.setup();
    await renderPage();
    await screen.findByTestId('points-item');
    expect(mocked.getPointsLeaderboard).not.toHaveBeenCalled();

    await user.press(screen.getByRole('tab', { name: 'Leaderboard' }));

    await waitFor(() => expect(mocked.getPointsLeaderboard).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('leaderboard-row')).toBeTruthy();

    expect(screen.getByTestId('semester-standing')).toBeTruthy();

    // Switching back and forth reuses the loaded leaderboard.
    await user.press(screen.getByRole('tab', { name: 'My Points' }));
    await user.press(screen.getByRole('tab', { name: 'Leaderboard' }));
    expect(mocked.getPointsLeaderboard).toHaveBeenCalledTimes(1);
  });
});
