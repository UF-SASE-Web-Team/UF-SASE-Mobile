import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PointsLogPage from '@/app/points';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import * as pointsService from '@/services/points';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/points', () => ({
  getPointsLog: jest.fn(),
  getUserPointsTotal: jest.fn().mockResolvedValue(3),
  getUserLeaderboardRank: jest.fn().mockResolvedValue(14),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderPointsLogPage() {
  return await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <PointsLogPage />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('PointsLogPage', () => {
  const mockUser = { id: 'test-user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('renders loading state without misleading 0-point card during initial fetch', async () => {
    // Keep promise pending
    (pointsService.getPointsLog as jest.Mock).mockReturnValue(new Promise(() => {}));

    await renderPointsLogPage();

    expect(screen.getByRole('header', { name: 'Points' })).toBeTruthy();
    expect(screen.getByLabelText('Loading points')).toBeTruthy();
    expect(screen.queryByText('Free UF SASE T-Shirt')).toBeNull();
  });

  it('renders standardized error state when points fetch fails without misleading 0-point card', async () => {
    const rawError =
      'fetch failed: UnexpectedException: Could not connect to the server. (at ExpoModulesCore/Promise.swift:56)';
    (pointsService.getPointsLog as jest.Mock).mockRejectedValue(new Error(rawError));

    await renderPointsLogPage();

    // Standardized ErrorState is shown
    expect(screen.getByText("Couldn't load points")).toBeTruthy();
    expect(
      screen.getByText(
        'Unable to connect to SASE servers. Please check your internet connection and try again.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();

    // The misleading 0-point card is not rendered
    expect(screen.queryByText('Free UF SASE T-Shirt')).toBeNull();
  });

  it('renders points progress card and log entries when data loads successfully', async () => {
    (pointsService.getPointsLog as jest.Mock).mockResolvedValue([
      {
        id: 'entry-1',
        title: 'GBM 1: Welcome',
        pointsValue: 1,
        date: '2026-09-01T18:00:00Z',
        category: 'attendance',
      },
      {
        id: 'entry-2',
        title: 'Resume Workshop',
        pointsValue: 2,
        date: '2026-09-10T18:00:00Z',
        category: 'attendance',
      },
    ]);

    await renderPointsLogPage();

    expect(screen.getByText('GBM 1: Welcome')).toBeTruthy();
    expect(screen.getByText('Resume Workshop')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('POINTS')).toBeTruthy();
    expect(screen.getByText('RANK')).toBeTruthy();
    expect(screen.getByText('#14')).toBeTruthy();
    expect(screen.getByText('Ledger')).toBeTruthy();
  });

  it('renders generic empty state without any button when user has no points', async () => {
    (pointsService.getPointsLog as jest.Mock).mockResolvedValue([]);

    await renderPointsLogPage();

    expect(screen.getByText('Ledger')).toBeTruthy();
    expect(screen.getByText('No points yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Browse events' })).toBeNull();
  });

  it('retries fetching points when Try Again is pressed on error state', async () => {
    const user = userEvent.setup();
    (pointsService.getPointsLog as jest.Mock).mockRejectedValueOnce(
      new Error('fetch failed: network down'),
    );

    await renderPointsLogPage();

    expect(screen.getByText("Couldn't load points")).toBeTruthy();

    (pointsService.getPointsLog as jest.Mock).mockResolvedValueOnce([]);

    await user.press(screen.getByRole('button', { name: 'Try again' }));

    expect(pointsService.getPointsLog).toHaveBeenCalledTimes(2);
  });
});
