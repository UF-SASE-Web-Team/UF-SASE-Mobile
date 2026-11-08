import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PublicProfilePage from '@/app/profile/[id]';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import * as profilesService from '@/services/profiles';
import { profileFixture } from '@/test-utils/profile';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/profiles', () => ({
  getProfile: jest.fn(),
}));

function renderPage() {
  return render(
    <ThemeProvider>
      <PublicProfilePage />
    </ThemeProvider>,
  );
}

describe('PublicProfilePage (/profile/[id])', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'other-user-id' } });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: profileFixture.id });
    (profilesService.getProfile as jest.Mock).mockResolvedValue(profileFixture);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('loads and displays the public profile', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Gator')).toBeTruthy();
      expect(screen.getByText('Computer Science')).toBeTruthy();
      expect(screen.getByText('SWEET | SASEHacks')).toBeTruthy();
      expect(screen.getByLabelText("Alice Gator's profile picture")).toBeTruthy();
    });

    expect(screen.queryByLabelText('Edit profile')).toBeNull();
    expect(screen.queryByText('Account Settings')).toBeNull();
  });

  it('renders edit button and account settings when viewing own profile', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: profileFixture.id } });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice Gator')).toBeTruthy();
      expect(screen.getByLabelText('Edit profile')).toBeTruthy();
      expect(screen.getByText('Account Settings')).toBeTruthy();
    });
  });

  it('renders error state when profile fails to load', async () => {
    (profilesService.getProfile as jest.Mock).mockRejectedValue(new Error('Profile not found'));

    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Profile unavailable')).toBeTruthy();
      expect(screen.getByText('Profile not found')).toBeTruthy();
    });
  });
});
