import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AccountSettingsPage from '@/app/profile/settings';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import {
  deleteAccount,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  updatePassword,
  updateUsername,
} from '@/services/profiles';
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

jest.mock('@/services/profiles');
jest.mock('@expo/ui/community/menu', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    MenuView: ({
      children,
      testID,
      onPressAction,
    }: import('@expo/ui/community/menu').MenuComponentProps) =>
      React.createElement(View, { testID, onPressAction }, children),
  };
});
jest.mock('@/context/ProfileContext', () => ({
  ...jest.requireActual('@/context/ProfileContext'),
  useProfile: jest.fn(),
}));

describe('Account settings', () => {
  const signOut = jest.fn();
  const reload = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');
  const renderSettings = () =>
    render(
      <ThemeProvider initialMode="light">
        <AccountSettingsPage />
      </ThemeProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    signOut.mockResolvedValue(undefined);
    (deleteAccount as jest.Mock).mockResolvedValue(undefined);
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
    (verifyPasswordResetCode as jest.Mock).mockResolvedValue(undefined);
    (updatePassword as jest.Mock).mockResolvedValue(undefined);
    (updateUsername as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: mockProfile.id, email: 'alice@example.com' },
      signOut,
    });
    (useProfile as jest.Mock).mockReturnValue({ profile: mockProfile, reload });
  });

  afterEach(async () => {
    await cleanup();
  });

  async function confirmAlert(text: string) {
    const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    await act(async () => {
      await buttons?.find((button) => button.text === text)?.onPress?.();
    });
  }

  it('persists the theme selected in the native dropdown', async () => {
    await renderSettings();
    expect(screen.getByRole('button', { name: 'App Theme' })).toBeTruthy();
    await act(() =>
      fireEvent(screen.getByTestId('profile-theme-menu'), 'pressAction', {
        nativeEvent: { event: 'dark' },
      }),
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('theme_mode', 'dark');
    expect(screen.getByText('Dark')).toBeTruthy();
  });

  it('opens the live Privacy Policy and Terms of Service pages', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const user = userEvent.setup();
    await renderSettings();

    await user.press(screen.getByRole('link', { name: 'Privacy Policy' }));
    expect(openURL).toHaveBeenLastCalledWith('https://ufsase.com/privacy');

    await user.press(screen.getByRole('link', { name: 'Terms of Service' }));
    expect(openURL).toHaveBeenLastCalledWith('https://ufsase.com/terms');
  });

  it('confirms before sending the reset email and completes a verified password reset within the profile flow', async () => {
    const user = userEvent.setup();
    await renderSettings();
    await user.press(screen.getByRole('button', { name: 'Change Password' }));
    expect(alertSpy).toHaveBeenCalledWith(
      'Change Password',
      'Send a password reset link to alice@example.com?',
      expect.any(Array),
    );
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();

    await confirmAlert('Send Email');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('alice@example.com');
    await user.type(screen.getByLabelText('6-digit verification code'), '123456');
    await user.press(screen.getByRole('button', { name: 'Verify Code' }));
    expect(verifyPasswordResetCode).toHaveBeenCalledWith('alice@example.com', '123456');
    await user.type(screen.getByLabelText('New password'), 'NewPass123');
    await user.type(screen.getByLabelText('Confirm new password'), 'NewPass123');
    await user.press(screen.getByRole('button', { name: 'Update Password' }));
    expect(updatePassword).toHaveBeenCalledWith('NewPass123');
    expect(signOut).not.toHaveBeenCalled();
  });

  it('reports email failures without opening code entry', async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(
      new Error('Email rate limit exceeded'),
    );
    await renderSettings();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Change Password' }));
    await confirmAlert('Send Email');
    expect(alertSpy).toHaveBeenCalledWith(
      'Could not send reset email',
      'Email rate limit exceeded',
    );
    expect(screen.queryByLabelText('6-digit verification code')).toBeNull();
  });

  it('opens Change Username sheet, checks availability, and updates username', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: true,
      error: null,
    });

    const user = userEvent.setup();
    await renderSettings();

    // Verify current username is visible
    expect(screen.getAllByText('@alice').length).toBeGreaterThanOrEqual(1);

    // Open Change Username sheet
    await user.press(screen.getByRole('button', { name: 'Change Username' }));
    expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    expect(screen.getByText('This is your current username')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Username' })).toBeDisabled();

    // Type a new username
    await user.clear(screen.getByPlaceholderText('Username'));
    await user.type(screen.getByPlaceholderText('Username'), 'alice_new');

    await waitFor(
      () => {
        expect(supabase.rpc).toHaveBeenCalledWith('check_username_available', {
          input_username: 'alice_new',
        });
        expect(screen.getByText('Username is available')).toBeTruthy();
      },
      { timeout: 2500 },
    );

    expect(screen.getByRole('button', { name: 'Save Username' })).not.toBeDisabled();
    await user.press(screen.getByRole('button', { name: 'Save Username' }));

    expect(updateUsername).toHaveBeenCalledWith('user-alice', 'alice_new');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith('Username updated successfully.');
  });

  it('shows error when username has an invalid format', async () => {
    const user = userEvent.setup();
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Change Username' }));
    await user.clear(screen.getByPlaceholderText('Username'));
    await user.type(screen.getByPlaceholderText('Username'), 'ab');

    expect(
      screen.getByText('3-20 letters, numbers, . or _. Must start with a letter.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save Username' })).toBeDisabled();
  });

  it('shows error when username is already taken', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: false,
      error: null,
    });

    const user = userEvent.setup();
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Change Username' }));
    await user.clear(screen.getByPlaceholderText('Username'));
    await user.type(screen.getByPlaceholderText('Username'), 'bob');

    await waitFor(
      () => {
        expect(screen.getByText('Username is already taken.')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Save Username' })).toBeDisabled();
      },
      { timeout: 2500 },
    );
  });

  it('does not display a suggest username button in the change username sheet', async () => {
    const user = userEvent.setup();
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Change Username' }));
    expect(screen.queryByRole('button', { name: 'Suggest username' })).toBeNull();
  });

  it('logs out only after confirmation', async () => {
    await renderSettings();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Log Out' }));
    expect(signOut).not.toHaveBeenCalled();
    await confirmAlert('Log Out');
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('opens Delete Account sheet and requires typing confirm before deletion', async () => {
    const user = userEvent.setup();
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Delete Account' }));
    const sheet = screen.getByTestId('delete-account-sheet');
    expect(
      within(sheet).getByText(
        /permanently delete your account, event attendance, and profile data/i,
      ),
    ).toBeTruthy();

    const deleteBtn = within(sheet).getByRole('button', { name: 'Delete Account' });
    expect(deleteBtn).toBeDisabled();

    // Type incorrect confirmation
    await user.type(within(sheet).getByPlaceholderText('confirm'), 'delete');
    expect(deleteBtn).toBeDisabled();

    // Type correct confirmation
    await user.clear(within(sheet).getByPlaceholderText('confirm'));
    await user.type(within(sheet).getByPlaceholderText('confirm'), 'confirm');
    expect(deleteBtn).toBeEnabled();

    await user.press(deleteBtn);
    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('keeps the session and displays error if deletion fails', async () => {
    (deleteAccount as jest.Mock).mockRejectedValueOnce(new Error('Database unavailable'));
    const user = userEvent.setup();
    await renderSettings();

    await user.press(screen.getByRole('button', { name: 'Delete Account' }));
    const sheet = screen.getByTestId('delete-account-sheet');
    const deleteBtn = within(sheet).getByRole('button', { name: 'Delete Account' });

    await user.type(within(sheet).getByPlaceholderText('confirm'), 'confirm');
    await user.press(deleteBtn);

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(within(sheet).getByText('Database unavailable')).toBeTruthy();
    expect(signOut).not.toHaveBeenCalled();
  });

  it('opens Feedback sheet when Send Feedback row is pressed', async () => {
    const user = userEvent.setup();
    await renderSettings();

    const feedbackRow = screen.getByRole('button', { name: 'Send Feedback' });
    expect(feedbackRow).toBeTruthy();

    await user.press(feedbackRow);
    expect(screen.getByRole('tab', { name: 'Bug' })).toBeTruthy();
  });
});
