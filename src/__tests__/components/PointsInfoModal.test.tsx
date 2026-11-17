import React from 'react';
import { render, screen, cleanup, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PointsInfoModal } from '@/components/points/PointsInfoModal';
import { ThemeProvider } from '@/context/ThemeContext';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('PointsInfoModal', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders Points Rules and content accurately when visible', async () => {
    const handleClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider>
          <PointsInfoModal visible={true} onClose={handleClose} />
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    // Title should be Points Info
    expect(screen.getByText('Points Info')).toBeTruthy();

    // Section 1: Spendable Points
    expect(screen.getByText('1. Spendable Points')).toBeTruthy();
    expect(
      screen.getByText(
        /Points are a running total earned through events, digital engagement, and club commitment/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Points will be spendable through the SASE Marketplace/)).toBeTruthy();
    expect(screen.queryByText(/banquet raffle tickets/i)).toBeNull();

    // Section 2: Attendance & Free Shirt
    expect(screen.getByText('2. Attendance & Free Shirt')).toBeTruthy();
    expect(screen.getByText(/free SASE semester shirt/)).toBeTruthy();
    expect(screen.queryByText(/official free SASE semester shirt/i)).toBeNull();

    // Section 3: Ways to Earn Points with categories and examples
    expect(screen.getByText('3. Ways to Earn Points')).toBeTruthy();
    expect(screen.getByText('Digital Engagement')).toBeTruthy();
    expect(screen.getByText('Create SASE Account')).toBeTruthy();
    expect(screen.getByText('Report verified bug')).toBeTruthy();
    expect(screen.getByText(/Write a blog/)).toBeTruthy();

    expect(screen.getByText('Attendance')).toBeTruthy();
    expect(screen.getByText('GBM')).toBeTruthy();
    expect(screen.getByText('Workshops / ProDev')).toBeTruthy();
    expect(screen.getByText('Socials')).toBeTruthy();
    expect(screen.getByText('Volunteering')).toBeTruthy();
    expect(screen.getByText('STEM Connect / SERC Conference')).toBeTruthy();
    expect(screen.getByText('Team Meeting')).toBeTruthy();

    expect(screen.getByText('Club Commitment')).toBeTruthy();
    expect(screen.getByText('Mentor - Mentee')).toBeTruthy();
    expect(screen.getByText('Program Member')).toBeTruthy();
    expect(screen.getByText('Carpooling')).toBeTruthy();

    // No point values (+1 pt, +2 pts, etc.)
    expect(screen.queryByText(/\+1 pt/i)).toBeNull();
    expect(screen.queryByText(/\+2 pts/i)).toBeNull();
    expect(screen.queryByText(/\+10 pts/i)).toBeNull();

    // Button to close
    const user = userEvent.setup();
    const closeBtn = screen.getByRole('button', { name: 'Back to Points' });
    await user.press(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
