import React from 'react';
import { act, cleanup, render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import { AuthRetryableFetchError, AuthApiError, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Unmock AuthContext since it is mocked globally in jest.setup.ts
jest.unmock('@/context/AuthContext');

const { AuthProvider, useAuth } = jest.requireActual('@/context/AuthContext');

function AuthConsumer() {
  const { session, user, isLoading, signOut } = useAuth();
  return (
    <View>
      <Text testID="loading">{String(isLoading)}</Text>
      <Text testID="session">{session ? session.access_token : 'no-session'}</Text>
      <Text testID="user">{user ? user.id : 'no-user'}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}

describe('AuthContext session validation and lifecycle', () => {
  let authStateCallback: ((event: string, session: Session | null) => void) | null = null;
  const mockUnsubscribe = jest.fn();

  const mockSession = {
    access_token: 'valid-token',
    refresh_token: 'valid-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'user-123', email: 'user@example.com' },
  } as unknown as Session;

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      };
    });
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockSession.user },
      error: null,
    });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  });

  afterEach(async () => {
    await cleanup();
    authStateCallback = null;
  });

  it('initializes with null session when auth state provides null', async () => {
    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authStateCallback!('INITIAL_SESSION', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });
    expect(screen.getByTestId('session').props.children).toBe('no-session');
    expect(screen.getByTestId('user').props.children).toBe('no-user');
  });

  it('validates active session with getUser on INITIAL_SESSION and retains session if valid', async () => {
    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authStateCallback!('INITIAL_SESSION', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });

    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('session').props.children).toBe('valid-token');
    expect(screen.getByTestId('user').props.children).toBe('user-123');
  });

  it('signs out automatically when backend rejects session on INITIAL_SESSION (e.g. database rugpull)', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new AuthApiError('User not found', 400, 'user_not_found'),
    });

    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authStateCallback!('INITIAL_SESSION', mockSession);
    });

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  it('does not sign out when getUser fails due to offline/retryable network error', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('Network request failed', 0),
    });

    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authStateCallback!('INITIAL_SESSION', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
    });

    expect(supabase.auth.signOut).not.toHaveBeenCalled();
    expect(screen.getByTestId('session').props.children).toBe('valid-token');
  });

  it('falls back to local scope sign out if remote sign out fails', async () => {
    (supabase.auth.signOut as jest.Mock)
      .mockResolvedValueOnce({ error: new Error('Network error') })
      .mockResolvedValueOnce({ error: null });

    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authStateCallback!('SIGNED_IN', mockSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('session').props.children).toBe('valid-token');
    });

    // Trigger user-initiated sign out
    const user = userEvent.setup();
    await user.press(screen.getByRole('button', { name: 'Sign Out' }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      expect(screen.getByTestId('session').props.children).toBe('no-session');
    });
  });
});
