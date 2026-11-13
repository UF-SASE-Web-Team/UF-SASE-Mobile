import { act, cleanup, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AccountSettingsPage from '@/app/profile/settings';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {
  deleteAccount,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  updatePassword,
} from '@/services/profiles';
import { profileFixture } from '@/test-utils/profile';

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
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: profileFixture.id, email: 'alice@example.com' },
      signOut,
    });
    (useProfile as jest.Mock).mockReturnValue({ profile: profileFixture });
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

  it('sends the reset email and completes a verified password reset within the profile flow', async () => {
    const user = userEvent.setup();
    await renderSettings();
    await user.press(screen.getByRole('button', { name: 'Reset Email' }));
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
    await userEvent.setup().press(screen.getByRole('button', { name: 'Reset Email' }));
    expect(alertSpy).toHaveBeenCalledWith(
      'Could not send reset email',
      'Email rate limit exceeded',
    );
    expect(screen.queryByLabelText('6-digit verification code')).toBeNull();
  });

  it('logs out only after confirmation', async () => {
    await renderSettings();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Log Out' }));
    expect(signOut).not.toHaveBeenCalled();
    await confirmAlert('Log Out');
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('deletes the account only after destructive confirmation', async () => {
    await renderSettings();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Delete Account' }));
    expect(alertSpy).toHaveBeenCalledWith(
      'Delete Account',
      expect.stringContaining('permanently deleted'),
      expect.any(Array),
    );
    expect(deleteAccount).not.toHaveBeenCalled();
    await confirmAlert('Delete');
    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('keeps the session if deletion fails', async () => {
    (deleteAccount as jest.Mock).mockRejectedValueOnce(new Error('Database unavailable'));
    await renderSettings();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Delete Account' }));
    await confirmAlert('Delete');
    expect(alertSpy).toHaveBeenCalledWith('Account deletion failed', 'Database unavailable');
    expect(signOut).not.toHaveBeenCalled();
  });
});
