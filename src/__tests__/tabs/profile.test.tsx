import React from 'react';
import { render, screen, userEvent, waitFor, cleanup, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfilePage from '@/app/(tabs)/profile';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

describe('ProfilePage', () => {
  const mockSignOut = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders profile title, Sign Out, and Delete Account buttons', async () => {
    await render(<ProfilePage />);

    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Sign Out')).toBeTruthy();
    expect(screen.getByText('Delete Account')).toBeTruthy();
  });

  describe('Sign Out Flow', () => {
    it('prompts confirmation when Sign Out is pressed', async () => {
      const user = userEvent.setup();
      await render(<ProfilePage />);

      await user.press(screen.getByText('Sign Out'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Sign Out',
        'Are you sure you want to sign out?',
        expect.any(Array),
      );
    });

    it('signs out when confirmed in alert', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValueOnce(undefined);

      await render(<ProfilePage />);

      await user.press(screen.getByText('Sign Out'));

      const alertButtons = alertSpy.mock.calls[0][2];
      const confirmButton = alertButtons?.find((btn) => btn.text === 'Sign Out');
      expect(confirmButton).toBeDefined();

      await act(async () => {
        await confirmButton?.onPress?.();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('Delete Account Flow', () => {
    it('shows irreversible destructive confirmation alert when Delete Account is pressed', async () => {
      const user = userEvent.setup();
      await render(<ProfilePage />);

      await user.press(screen.getByText('Delete Account'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Delete Account',
        expect.stringContaining('permanently deleted'),
        expect.any(Array),
      );
    });

    it('cancels deletion when Cancel is pressed in alert', async () => {
      const user = userEvent.setup();
      await render(<ProfilePage />);

      await user.press(screen.getByText('Delete Account'));

      const alertButtons = alertSpy.mock.calls[0][2];
      const cancelButton = alertButtons?.find((btn) => btn.text === 'Cancel');
      expect(cancelButton).toBeDefined();

      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('calls delete_user_account RPC and signs out on confirmation', async () => {
      const user = userEvent.setup();
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({ error: null });
      mockSignOut.mockResolvedValueOnce(undefined);

      await render(<ProfilePage />);

      await user.press(screen.getByText('Delete Account'));

      const alertButtons = alertSpy.mock.calls[0][2];
      const deleteButton = alertButtons?.find((btn) => btn.text === 'Delete');
      expect(deleteButton).toBeDefined();

      await act(async () => {
        await deleteButton?.onPress?.();
      });

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('delete_user_account');
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it('displays error alert if delete_user_account RPC fails', async () => {
      const user = userEvent.setup();
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        error: { message: 'Database connection failed' },
      });

      await render(<ProfilePage />);

      await user.press(screen.getByText('Delete Account'));

      const alertButtons = alertSpy.mock.calls[0][2];
      const deleteButton = alertButtons?.find((btn) => btn.text === 'Delete');

      await act(async () => {
        await deleteButton?.onPress?.();
      });

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('delete_user_account');
        expect(mockSignOut).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringMatching(/error|fail|could not/i),
          expect.any(String),
        );
      });
    });
  });
});
