import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import LandingScreen from '@/app/(auth)/index';
import { useRouter } from 'expo-router';

describe('LandingScreen', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
    });
  });

  it('navigates to signup when Create account button is pressed', async () => {
    const user = userEvent.setup();
    await render(<LandingScreen />);

    await user.press(screen.getByRole('button', { name: /create an account/i }));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/signup');
  });

  it('navigates to login when Login button is pressed', async () => {
    const user = userEvent.setup();
    await render(<LandingScreen />);

    await user.press(screen.getByRole('button', { name: /login/i }));
    expect(mockPush).toHaveBeenCalledWith('/(auth)/login');
  });
});
