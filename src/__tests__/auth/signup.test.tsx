import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
  cleanup,
  fireEvent,
  act,
} from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import SignupScreen from '@/app/(auth)/signup';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

describe('SignupScreen', () => {
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

  afterEach(async () => {
    await cleanup();
  });

  it('navigates back when back button is pressed and canGoBack is true', async () => {
    const user = userEvent.setup();
    mockCanGoBack.mockReturnValue(true);
    await render(<SignupScreen />);

    await user.press(screen.getByLabelText('Go back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('replaces to login when back button is pressed and canGoBack is false', async () => {
    const user = userEvent.setup();
    mockCanGoBack.mockReturnValue(false);
    await render(<SignupScreen />);

    await user.press(screen.getByLabelText('Go back'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    await render(<SignupScreen />);

    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    await user.press(screen.getByLabelText('Show password'));
    expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(false);

    await user.press(screen.getByLabelText('Hide password'));
    expect(screen.getByPlaceholderText('Password').props.secureTextEntry).toBe(true);
  });

  it('clears input fields when clear buttons are pressed', async () => {
    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@ufl.edu');
    expect(screen.getByPlaceholderText('Email').props.value).toBe('test@ufl.edu');
    await user.press(screen.getByLabelText('Clear email'));
    expect(screen.getByPlaceholderText('Email').props.value).toBe('');

    await user.type(screen.getByPlaceholderText('Full name'), 'Albert Gator');
    expect(screen.getByPlaceholderText('Full name').props.value).toBe('Albert Gator');
    await user.press(screen.getByLabelText('Clear full name'));
    expect(screen.getByPlaceholderText('Full name').props.value).toBe('');

    // For username, type an invalid format so clear button shows immediately without in-flight spinner
    await user.type(screen.getByPlaceholderText('Username'), '1invalid');
    expect(screen.getByPlaceholderText('Username').props.value).toBe('1invalid');
    await user.press(screen.getByLabelText('Clear username'));
    expect(screen.getByPlaceholderText('Username').props.value).toBe('');
  });

  it('marks fields as invalid when blurred with bad data', async () => {
    const user = userEvent.setup();
    await render(<SignupScreen />);

    // Email blur with invalid email
    await user.type(screen.getByPlaceholderText('Email'), 'notanemail');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('Email'), 'blur');
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email')).toHaveProp('aria-invalid', true);
    });

    // Password blur with weak password
    await user.type(screen.getByPlaceholderText('Password'), 'weak');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('Password'), 'blur');
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Password')).toHaveProp('aria-invalid', true);
    });

    // Full name blur with empty
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('Full name'), 'blur');
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Full name')).toHaveProp('aria-invalid', true);
    });

    // Username blur with invalid format
    await user.type(screen.getByPlaceholderText('Username'), '1invalid');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('Username'), 'blur');
    });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toHaveProp('aria-invalid', true);
    });
  });

  it('checks username availability via debounced RPC and shows checkmark when available', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: true,
      error: null,
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Username'), 'gatorfresh');

    await waitFor(
      () => {
        expect(supabase.rpc).toHaveBeenCalledWith('check_username_available', {
          input_username: 'gatorfresh',
        });
        expect(screen.getByLabelText('Username available')).toBeTruthy();
      },
      { timeout: 2500 },
    );
  });

  it('marks username invalid when availability RPC returns false (taken)', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: false,
      error: null,
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Username'), 'existinguser');

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('Username')).toHaveProp('aria-invalid', true);
      },
      { timeout: 2500 },
    );
  });

  it('marks username invalid when username availability RPC fails with network error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Network request failed' },
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Username'), 'validuser');

    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('Username')).toHaveProp('aria-invalid', true);
      },
      { timeout: 2500 },
    );
  });

  it('blocks submit if fields are invalid and focuses failing inputs without calling signUp', async () => {
    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.press(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email')).toHaveProp('aria-invalid', true);
    });
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('successfully creates account and navigates to verify screen', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: true,
      error: null,
    });
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: { user: { id: 'user-1' }, session: null },
      error: null,
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'albert@ufl.edu');
    await user.type(screen.getByPlaceholderText('Password'), 'StrongPass123');
    await user.type(screen.getByPlaceholderText('Full name'), 'Albert Gator');
    await user.type(screen.getByPlaceholderText('Username'), 'albertg');

    // Wait for username availability check
    await waitFor(
      () => {
        expect(screen.getByLabelText('Username available')).toBeTruthy();
      },
      { timeout: 2500 },
    );

    await user.press(screen.getByRole('button', { name: /create account/i }));

    // An earlier unverified attempt is cleared first so this password and username apply
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('discard_unverified_signup', {
        p_email: 'albert@ufl.edu',
      });
      expect((supabase.rpc as jest.Mock).mock.invocationCallOrder.at(-1)!).toBeLessThan(
        (supabase.auth.signUp as jest.Mock).mock.invocationCallOrder[0],
      );
    });

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'albert@ufl.edu',
        password: 'StrongPass123',
        options: {
          data: {
            full_name: 'Albert Gator',
            username: 'albertg',
          },
        },
      });
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/(auth)/verify',
        params: { email: 'albert@ufl.edu', mode: 'signup' },
      });
    });
  });

  it.each([
    [
      'signUp returns a user with no identities',
      { data: { user: { id: 'user-1', identities: [] }, session: null }, error: null },
    ],
    [
      'signUp returns an already-registered error',
      { data: { user: null, session: null }, error: { message: 'User already registered' } },
    ],
  ])('marks the email invalid and stays on the form when %s', async (_name, signUpResult) => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: true,
      error: null,
    });
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce(signUpResult);

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'albert@ufl.edu');
    await user.type(screen.getByPlaceholderText('Password'), 'StrongPass123');
    await user.type(screen.getByPlaceholderText('Full name'), 'Albert Gator');
    await user.type(screen.getByPlaceholderText('Username'), 'albertg');

    await waitFor(
      () => {
        expect(screen.getByLabelText('Username available')).toBeTruthy();
      },
      { timeout: 2500 },
    );

    await user.press(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Email')).toHaveProp('aria-invalid', true);
    });
    expect(mockPush).not.toHaveBeenCalled();

    // Editing the email clears the error
    await user.type(screen.getByPlaceholderText('Email'), 'x');
    expect(screen.getByPlaceholderText('Email')).toHaveProp('aria-invalid', false);
  });

  it('displays user-friendly error when sign up encounters rate limit or network error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: true,
      error: null,
    });
    (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'rate limit exceeded', status: 429 },
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'albert@ufl.edu');
    await user.type(screen.getByPlaceholderText('Password'), 'StrongPass123');
    await user.type(screen.getByPlaceholderText('Full name'), 'Albert Gator');
    await user.type(screen.getByPlaceholderText('Username'), 'albertg');

    await waitFor(
      () => {
        expect(screen.getByLabelText('Username available')).toBeTruthy();
      },
      { timeout: 2500 },
    );

    await user.press(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Sign-up failed',
        expect.stringMatching(/too many sign-up attempts/i),
      );
    });
  });

  it('suggests a username when the suggest button is pressed', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: 'derpytoaster',
      error: null,
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.press(screen.getByRole('button', { name: /suggest username/i }));

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('suggest_username', {
        p_separator: undefined,
      });
      expect(screen.getByPlaceholderText('Username').props.value).toBe('derpytoaster');
      expect(screen.getByLabelText('Username available')).toBeTruthy();
    });
  });

  it('shows an alert when suggest username RPC fails', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    });

    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.press(screen.getByRole('button', { name: /suggest username/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Suggestion Failed',
        expect.stringMatching(/could not generate a suggested username/i),
      );
    });
  });

  it('links to the Terms of Service and Privacy Policy next to the create account button', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const user = userEvent.setup();
    await render(<SignupScreen />);

    await user.press(screen.getByRole('link', { name: 'Terms of Service' }));
    expect(openURL).toHaveBeenLastCalledWith('https://ufsase.com/terms');

    await user.press(screen.getByRole('link', { name: 'Privacy Policy' }));
    expect(openURL).toHaveBeenLastCalledWith('https://ufsase.com/privacy');
  });
});
