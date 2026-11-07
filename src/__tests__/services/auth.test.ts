import { checkUsernameAvailable, getEmailFromUsername, suggestUsername } from '@/services/auth';
import { supabase } from '@/lib/supabase';

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('suggestUsername', () => {
    it('calls suggest_username RPC without separator by default', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: 'derpytoaster',
        error: null,
      });

      const result = await suggestUsername();

      expect(supabase.rpc).toHaveBeenCalledWith('suggest_username', {
        p_separator: undefined,
      });
      expect(result).toBe('derpytoaster');
    });

    it('passes custom separator when provided', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: 'derpy_toaster',
        error: null,
      });

      const result = await suggestUsername('_');

      expect(supabase.rpc).toHaveBeenCalledWith('suggest_username', {
        p_separator: '_',
      });
      expect(result).toBe('derpy_toaster');
    });

    it('throws error when RPC returns an error', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(suggestUsername()).rejects.toThrow('Database error');
    });

    it('throws error when data is empty or missing', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(suggestUsername()).rejects.toThrow('Failed to generate a suggested username.');
    });
  });

  describe('checkUsernameAvailable', () => {
    it('calls check_username_available RPC with trimmed lowercase username', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: true,
        error: null,
      });

      const result = await checkUsernameAvailable('  GatorGuy  ');

      expect(supabase.rpc).toHaveBeenCalledWith('check_username_available', {
        input_username: 'gatorguy',
      });
      expect(result).toBe(true);
    });

    it('returns false when username is taken', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: false,
        error: null,
      });

      const result = await checkUsernameAvailable('alice');
      expect(result).toBe(false);
    });

    it('throws error when RPC fails', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      await expect(checkUsernameAvailable('alice')).rejects.toThrow('Network error');
    });
  });

  describe('getEmailFromUsername', () => {
    it('calls get_email_from_username RPC with trimmed lowercase username', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: 'alice@ufl.edu',
        error: null,
      });

      const result = await getEmailFromUsername('  ALICE  ');

      expect(supabase.rpc).toHaveBeenCalledWith('get_email_from_username', {
        p_username: 'alice',
      });
      expect(result).toBe('alice@ufl.edu');
    });

    it('returns null when username not found', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getEmailFromUsername('unknown');
      expect(result).toBeNull();
    });

    it('throws error when RPC fails', async () => {
      (supabase.rpc as jest.Mock) = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Lookup error'),
      });

      await expect(getEmailFromUsername('unknown')).rejects.toThrow('Lookup error');
    });
  });
});
