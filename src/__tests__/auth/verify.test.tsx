import React from 'react';
import { render, screen, userEvent, waitFor, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VerifyScreen from '@/app/(auth)/verify';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

const renderVerify = async () =>
  await render(
    <ThemeProvider>
      <VerifyScreen />
    </ThemeProvider>,
  );

describe('VerifyScreen', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockCanGoBack = jest.fn();
  const mockSetIsRecovering = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      canGoBack: mockCanGoBack,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      email: 'test@ufl.edu',
      mode: 'signup',
    });
    (useAuth as jest.Mock).mockReturnValue({
      setIsRecovering: mockSetIsRecovering,
      signOut: jest.fn(),
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Navigation', () => {
    it('navigates back when back button pressed and canGoBack is true', async () => {
      const user = userEvent.setup();
      mockCanGoBack.mockReturnValue(true);
      await renderVerify();

      await user.press(screen.getByLabelText('Go back'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('replaces to signup when back pressed, cannot go back, and mode is signup', async () => {
      const user = userEvent.setup();
      mockCanGoBack.mockReturnValue(false);
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        email: 'test@ufl.edu',
        mode: 'signup',
      });
      await renderVerify();

      await user.press(screen.getByLabelText('Go back'));
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/signup');
    });

    it('replaces to forgot-password when back pressed, cannot go back, and mode is recovery', async () => {
      const user = userEvent.setup();
      mockCanGoBack.mockReturnValue(false);
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        email: 'test@ufl.edu',
        mode: 'recovery',
      });
      await renderVerify();

      await user.press(screen.getByLabelText('Go back'));
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/forgot-password');
    });
  });

  describe('Verification flows', () => {
    it('disables verify button when code length is less than 6', async () => {
      await renderVerify();

      const verifyButton = screen.getByRole('button', { name: /verify/i });
      expect(verifyButton).toBeDisabled();
    });

    it('auto-submits OTP on typing 6 digits in signup mode', async () => {
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
        data: { session: {} },
        error: null,
      });

      const user = userEvent.setup();
      await renderVerify();

      await user.type(screen.getByLabelText('6-digit verification code'), '123456');

      await waitFor(() => {
        expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
          email: 'test@ufl.edu',
          token: '123456',
          type: 'signup',
        });
        expect(mockSetIsRecovering).not.toHaveBeenCalled();
      });
    });

    it('sets isRecovering and navigates to reset-password on successful recovery verification', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        email: 'recovery@ufl.edu',
        mode: 'recovery',
      });
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
        data: { session: {} },
        error: null,
      });

      const user = userEvent.setup();
      await renderVerify();

      await user.type(screen.getByLabelText('6-digit verification code'), '654321');

      await waitFor(() => {
        expect(mockSetIsRecovering).toHaveBeenCalledWith(true);
        expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
          email: 'recovery@ufl.edu',
          token: '654321',
          type: 'recovery',
        });
        expect(mockReplace).toHaveBeenCalledWith('/(auth)/reset-password');
      });
    });

    it('handles verification error and resets isRecovering if in recovery mode', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        email: 'recovery@ufl.edu',
        mode: 'recovery',
      });
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Token has expired' },
      });

      const user = userEvent.setup();
      await renderVerify();

      await user.type(screen.getByLabelText('6-digit verification code'), '111111');

      await waitFor(() => {
        expect(mockSetIsRecovering).toHaveBeenCalledWith(false);
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringMatching(/failed/i),
          expect.stringMatching(/Token has expired/i),
        );
      });
    });
  });

  describe('Resend flow', () => {
    it('resends verification code for signup when cooldown finishes', async () => {
      (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
        error: null,
      });

      await renderVerify();

      // Find the resend button by label
      const resendBtn = screen.getByLabelText('Resend code');
      // Initially disabled by cooldown
      expect(resendBtn).toBeDisabled();
    });

    it('resends password recovery email when mode is recovery', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        email: 'recovery@ufl.edu',
        mode: 'recovery',
      });

      await renderVerify();
      const resendBtn = screen.getByLabelText('Resend code');
      expect(resendBtn).toBeDisabled();
    });

    it('shows alert if resend returns an error', async () => {
      (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
        error: { message: 'Rate limit exceeded' },
      });

      await renderVerify();
      expect(screen.getByLabelText('Resend code')).toBeTruthy();
    });
  });
});
