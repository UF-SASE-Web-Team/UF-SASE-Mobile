import React from 'react';
import { render, screen, userEvent, waitFor, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ResetPasswordScreen from '@/app/(auth)/reset-password';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

describe('ResetPasswordScreen', () => {
  const mockReplace = jest.fn();
  const mockSetIsRecovering = jest.fn();
  const mockSignOut = jest.fn().mockResolvedValue(undefined);
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
    });
    (useAuth as jest.Mock).mockReturnValue({
      setIsRecovering: mockSetIsRecovering,
      signOut: mockSignOut,
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('toggles password visibility for both password inputs', async () => {
    const user = userEvent.setup();
    await render(<ResetPasswordScreen />);

    const newPassInput = screen.getByPlaceholderText('New password');
    const confirmPassInput = screen.getByPlaceholderText('Confirm new password');

    expect(newPassInput.props.secureTextEntry).toBe(true);
    expect(confirmPassInput.props.secureTextEntry).toBe(true);

    await user.press(screen.getByLabelText('Show password'));

    expect(screen.getByPlaceholderText('New password').props.secureTextEntry).toBe(false);
    expect(screen.getByPlaceholderText('Confirm new password').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Hide password')).toBeTruthy();
  });

  it('alerts error if password is shorter than 8 characters or missing letters/numbers without calling API', async () => {
    const user = userEvent.setup();
    await render(<ResetPasswordScreen />);

    await user.type(screen.getByPlaceholderText('New password'), 'short');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'short');
    await user.press(screen.getByRole('button', { name: /update password/i }));

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/invalid/i),
      expect.stringMatching(/at least 8 characters/i),
    );
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('alerts error if passwords do not match without calling API', async () => {
    const user = userEvent.setup();
    await render(<ResetPasswordScreen />);

    await user.type(screen.getByPlaceholderText('New password'), 'password123');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'password456');
    await user.press(screen.getByRole('button', { name: /update password/i }));

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/mismatch/i),
      expect.stringMatching(/do not match/i),
    );
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('handles update failure from supabase', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      error: { message: 'Token expired' },
    });

    const user = userEvent.setup();
    await render(<ResetPasswordScreen />);

    await user.type(screen.getByPlaceholderText('New password'), 'ValidPass1');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'ValidPass1');
    await user.press(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'ValidPass1' });
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/failed/i),
        expect.stringMatching(/Token expired/i),
      );
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('successfully updates password, clears recovering mode, and navigates to tabs', async () => {
    (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
      data: { user: {} },
      error: null,
    });

    const user = userEvent.setup();
    await render(<ResetPasswordScreen />);

    await user.type(screen.getByPlaceholderText('New password'), 'ValidPass1');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'ValidPass1');
    await user.press(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'ValidPass1' });
      expect(mockSetIsRecovering).toHaveBeenCalledWith(false);
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        'Your password has been updated.',
        expect.any(Array),
      );
    });

    const alertButtons = alertSpy.mock.calls[0][2];
    const continueBtn = alertButtons?.find((btn) => btn.text === 'Continue');
    expect(continueBtn).toBeDefined();
    continueBtn?.onPress?.();

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('signs out and navigates to login when cancel button is pressed', async () => {
    const user = userEvent.setup();
    await render(<ResetPasswordScreen />);

    await user.press(screen.getByLabelText('Cancel password reset'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('signs out if the screen is unmounted without completing reset', async () => {
    const { unmount } = await render(<ResetPasswordScreen />);
    await unmount();

    expect(mockSignOut).toHaveBeenCalled();
  });
});
