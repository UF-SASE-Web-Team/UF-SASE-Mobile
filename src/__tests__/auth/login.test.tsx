import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '@/app/(auth)/login';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

describe('LoginScreen', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockCanGoBack = jest.fn();
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
  });

  it('navigates back when back button is pressed and canGoBack is true', async () => {
    const user = userEvent.setup();
    mockCanGoBack.mockReturnValue(true);
    await render(<LoginScreen />);

    await user.press(screen.getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('replaces to landing when back button is pressed and canGoBack is false', async () => {
    const user = userEvent.setup();
    mockCanGoBack.mockReturnValue(false);
    await render(<LoginScreen />);

    await user.press(screen.getByLabelText('Go back'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)');
  });

  it('toggles password visibility when the eye button is pressed', async () => {
    const user = userEvent.setup();
    await render(<LoginScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    await user.press(screen.getByLabelText('Show password'));
    expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
    expect(screen.getByLabelText('Hide password')).toBeTruthy();

    await user.press(screen.getByLabelText('Hide password'));
    expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(true);
  });

  it('navigates to forgot password screen when button is pressed', async () => {
    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.press(screen.getByLabelText('Forgot password?'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/forgot-password',
    });
  });

  it('shows an alert if identifier or password is empty without calling auth API', async () => {
    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.press(screen.getByRole('button', { name: /log in/i }));
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/error|fail|invalid/i),
      expect.any(String),
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();

    alertSpy.mockClear();
    await user.type(screen.getByPlaceholderText('Email or username'), 'user@test.com');
    await user.press(screen.getByRole('button', { name: /log in/i }));

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringMatching(/error|fail|invalid/i),
      expect.any(String),
    );
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('signs in directly with email without username lookup', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: '123' }, session: {} },
      error: null,
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('Email or username'), 'test@ufl.edu');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.press(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@ufl.edu',
        password: 'secret123',
      });
    });
  });

  it('resolves username to email via rpc and then signs in', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: 'resolved@ufl.edu',
      error: null,
    });
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: '123' }, session: {} },
      error: null,
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('Email or username'), 'gatorboy');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.press(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_email_from_username', {
        p_username: 'gatorboy',
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'resolved@ufl.edu',
        password: 'secret123',
      });
    });
  });

  it('shows error when username lookup fails or returns no email', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Username not found' },
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('Email or username'), 'unknownuser');
    await user.type(screen.getByPlaceholderText('Password'), 'secret123');
    await user.press(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_email_from_username', {
        p_username: 'unknownuser',
      });
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/error|fail|invalid/i),
        expect.any(String),
      );
    });
  });

  it('shows error on invalid credentials from supabase', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('Email or username'), 'test@ufl.edu');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    await user.press(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/error|fail|invalid/i),
        expect.any(String),
      );
    });
  });

  it('prompts to verify email when sign in fails with unconfirmed email', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Email not confirmed' },
    });

    const user = userEvent.setup();
    await render(<LoginScreen />);

    await user.type(screen.getByPlaceholderText('Email or username'), 'unverified@ufl.edu');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringMatching(/unverified|verify|error/i),
        expect.any(String),
        expect.any(Array),
      );
    });

    const alertButtons = alertSpy.mock.calls[0][2];
    const verifyButton = alertButtons?.find((btn) => btn.text === 'Verify Code');
    expect(verifyButton).toBeDefined();
    verifyButton?.onPress?.();

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(auth)/verify',
      params: { email: 'unverified@ufl.edu', mode: 'signup' },
    });
  });
});
