import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackSheet } from '@/components/profile/FeedbackSheet';
import { ThemeProvider } from '@/context/ThemeContext';
import { submitAppFeedback } from '@/services/feedback';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock('@/services/feedback');

describe('FeedbackSheet', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (submitAppFeedback as jest.Mock).mockResolvedValue(undefined);
  });

  const renderSheet = async (visible = true) =>
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider initialMode="light">
          <FeedbackSheet visible={visible} onClose={onClose} userId="u1" />
        </ThemeProvider>
      </SafeAreaProvider>,
    );

  it('renders category options and message input field', async () => {
    await renderSheet();

    expect(screen.getByText('Send Feedback')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Bug' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Feature' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'General' })).toBeTruthy();
    expect(screen.getByLabelText('Feedback message')).toBeTruthy();
  });

  it('submits feedback successfully and displays success state', async () => {
    const user = userEvent.setup();
    await renderSheet();

    // Select "Feature"
    await user.press(screen.getByRole('tab', { name: 'Feature' }));

    // Type feedback
    const input = screen.getByLabelText('Feedback message');
    await user.type(input, 'Would love a Discord integration for announcements.');

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Submit Feedback' });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(submitAppFeedback).toHaveBeenCalledWith({
        userId: 'u1',
        category: 'feature',
        message: 'Would love a Discord integration for announcements.',
      });
      expect(screen.getByText('Thank you!')).toBeTruthy();
    });

    // Press Done
    await user.press(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('displays error message when submission fails', async () => {
    const user = userEvent.setup();
    (submitAppFeedback as jest.Mock).mockRejectedValue(new Error('Network error'));
    await renderSheet();

    const input = screen.getByLabelText('Feedback message');
    await user.type(input, 'App crashed on checkin');

    const submitBtn = screen.getByRole('button', { name: 'Submit Feedback' });
    await user.press(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Unable to connect to SASE servers|Could not send feedback/i),
      ).toBeTruthy();
    });
  });
});
