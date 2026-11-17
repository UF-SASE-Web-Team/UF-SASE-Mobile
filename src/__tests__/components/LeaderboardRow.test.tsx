import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { LeaderboardRow } from '@/components/points/LeaderboardRow';
import { ThemeProvider } from '@/context/ThemeContext';
import type { LeaderboardEntry } from '@/types/points';

const baseEntry: LeaderboardEntry = {
  rank: 2,
  userId: 'user-2',
  fullName: 'Bob Gator',
  username: 'bob',
  avatarUrl: null,
  points: 5,
  isMe: false,
};

function renderRow(entry: LeaderboardEntry) {
  return render(
    <ThemeProvider>
      <LeaderboardRow entry={entry} />
    </ThemeProvider>,
  );
}

describe('LeaderboardRow', () => {
  const push = jest.fn();

  beforeEach(() => {
    push.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it("opens another member's profile", async () => {
    const user = userEvent.setup();
    await renderRow(baseEntry);

    await user.press(screen.getByRole('button', { name: 'Rank 2, Bob Gator, 5 points' }));

    expect(push).toHaveBeenCalledWith('/profile/user-2');
  });

  it("marks the caller's own row and opens their own profile", async () => {
    const user = userEvent.setup();
    await renderRow({ ...baseEntry, isMe: true, points: 1 });

    await user.press(screen.getByRole('button', { name: 'Rank 2, Bob Gator (You), 1 point' }));

    expect(push).toHaveBeenCalledWith('/profile');
  });
});
