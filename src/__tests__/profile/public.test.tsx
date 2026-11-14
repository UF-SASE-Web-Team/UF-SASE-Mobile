import React from 'react';
import { act, cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PublicProfilePage from '@/app/profile/[id]';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import * as moderationService from '@/services/moderation';
import * as profilesService from '@/services/profiles';
import type { ProfileWithPrograms } from '@/types/profiles';

const mockProfile: ProfileWithPrograms = {
  id: 'user-alice',
  full_name: 'Alice Gator',
  username: 'alice',
  role: 'member',
  avatar_url: 'sase-shark',
  majors: ['Computer Science'],
  minors: ['Digital Arts and Sciences'],
  grad_time: '2029',
  discord_handle: 'alice.gator',
  instagram_handle: 'alice.gator',
  linkedin_url: 'https://www.linkedin.com/in/alice-gator',
  bio: 'I enjoy building things with SASE.',
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  programNames: ['SWEET', 'SASEHacks'],
};

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

jest.mock('@/services/moderation', () => ({
  reportMember: jest.fn(),
  isMemberBlocked: jest.fn(),
  blockMember: jest.fn(),
  unblockMember: jest.fn(),
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
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: mockProfile.id });
    (profilesService.getProfile as jest.Mock).mockResolvedValue(mockProfile);
    (moderationService.isMemberBlocked as jest.Mock).mockResolvedValue(false);
    (moderationService.blockMember as jest.Mock).mockResolvedValue(undefined);
    (moderationService.unblockMember as jest.Mock).mockResolvedValue(undefined);
    (moderationService.reportMember as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
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
    (useAuth as jest.Mock).mockReturnValue({ user: { id: mockProfile.id } });

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

  it('does not offer report or block on your own profile', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: mockProfile.id } });

    await renderPage();

    await screen.findByRole('button', { name: 'Account Settings' });
    expect(screen.queryByRole('button', { name: 'Report Member' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Block Member' })).toBeNull();
    expect(moderationService.isMemberBlocked).not.toHaveBeenCalled();
  });

  it('blocks a member after confirmation and hides their profile', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.press(await screen.findByRole('button', { name: 'Block Member' }));
    expect(moderationService.blockMember).not.toHaveBeenCalled();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    await act(async () => {
      await buttons.find((button: { style?: string }) => button.style === 'destructive').onPress();
    });

    expect(moderationService.blockMember).toHaveBeenCalledWith(mockProfile.id);
    expect(await screen.findByRole('button', { name: 'Unblock Member' })).toBeTruthy();
    expect(screen.getByTestId('public-profile-blocked')).toBeTruthy();
    expect(screen.queryByLabelText("Alice Gator's profile picture")).toBeNull();
  });

  it('keeps a blocked member hidden until they are unblocked', async () => {
    (moderationService.isMemberBlocked as jest.Mock).mockResolvedValue(true);
    const user = userEvent.setup();
    await renderPage();

    expect(await screen.findByTestId('public-profile-blocked')).toBeTruthy();

    await user.press(screen.getByRole('button', { name: 'Unblock Member' }));

    expect(moderationService.unblockMember).toHaveBeenCalledWith(mockProfile.id);
    expect(await screen.findByRole('button', { name: 'Block Member' })).toBeTruthy();
    expect(screen.queryByTestId('public-profile-blocked')).toBeNull();
  });

  it('still shows the profile when the block lookup fails', async () => {
    (moderationService.isMemberBlocked as jest.Mock).mockRejectedValue(new Error('offline'));

    await renderPage();

    expect(await screen.findByRole('button', { name: 'Block Member' })).toBeTruthy();
    expect(screen.queryByTestId('public-profile-blocked')).toBeNull();
  });

  it('sends a report once a reason is chosen', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.press(await screen.findByRole('button', { name: 'Report Member' }));

    const send = await screen.findByRole('button', { name: 'Send Report' });
    expect(send).toBeDisabled();

    await user.press(screen.getByRole('radio', { name: 'Spam or scam' }));
    await user.type(screen.getByLabelText('Report details'), 'Promo links');
    await user.press(screen.getByRole('button', { name: 'Send Report' }));

    await waitFor(() => {
      expect(moderationService.reportMember).toHaveBeenCalledWith(
        mockProfile.id,
        'spam',
        'Promo links',
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Send Report' })).toBeNull();
    });
  });

  it('keeps the report open and shows the error when sending fails', async () => {
    (moderationService.reportMember as jest.Mock).mockRejectedValue(new Error('Network down'));
    const user = userEvent.setup();
    await renderPage();

    await user.press(await screen.findByRole('button', { name: 'Report Member' }));
    await user.press(await screen.findByRole('radio', { name: 'Something else' }));
    await user.press(screen.getByRole('button', { name: 'Send Report' }));

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send Report' })).toBeTruthy();
  });
});
