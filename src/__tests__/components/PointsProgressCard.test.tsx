import React from 'react';
import { render, screen, cleanup, userEvent } from '@testing-library/react-native';
import { PointsProgressCard } from '@/components/points/PointsProgressCard';
import { ThemeProvider } from '@/context/ThemeContext';

function renderCard(props: React.ComponentProps<typeof PointsProgressCard>) {
  return render(
    <ThemeProvider>
      <PointsProgressCard {...props} />
    </ThemeProvider>,
  );
}

describe('PointsProgressCard', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders points and rank side-by-side cards', async () => {
    await renderCard({
      totalPoints: 19,
      rank: 14,
      entriesCount: 8,
      error: null,
    });

    expect(screen.getByText('POINTS')).toBeTruthy();
    expect(screen.getByText('19')).toBeTruthy();
    expect(screen.getByText('RANK')).toBeTruthy();
    expect(screen.getByText('#14')).toBeTruthy();
  });

  it('renders fallback dash when rank is not available', async () => {
    await renderCard({
      totalPoints: 0,
      rank: null,
      entriesCount: 0,
      error: null,
    });

    expect(screen.getByText('POINTS')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('RANK')).toBeTruthy();
    expect(screen.getByText('–')).toBeTruthy();
  });

  it('calls onOpenLeaderboard when rank card is pressed', async () => {
    const onOpenLeaderboard = jest.fn();
    const user = userEvent.setup();

    await renderCard({
      totalPoints: 19,
      rank: 14,
      entriesCount: 5,
      error: null,
      onOpenLeaderboard,
    });

    await user.press(screen.getByTestId('rank-summary-card'));
    expect(onOpenLeaderboard).toHaveBeenCalledTimes(1);
  });

  it('displays refresh error message when error is provided and entries exist', async () => {
    await renderCard({
      totalPoints: 10,
      entriesCount: 3,
      error: 'Network connection error',
    });

    expect(screen.getByText('Could not refresh points. Pull down to try again.')).toBeTruthy();
  });
});
