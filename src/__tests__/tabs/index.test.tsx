import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import HomePage from '@/app/(tabs)/index';
import { useRouter } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';

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
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders home title and status card', async () => {
    await renderHomePage();

    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('renders profile button and navigates to /profile on press', async () => {
    const user = userEvent.setup();
    await renderHomePage();

    const profileButton = screen.getByTestId('home-profile-button');
    expect(profileButton).toBeTruthy();

    await user.press(profileButton);

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });
});
