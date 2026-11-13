import { checkUsernameAvailable, signInWithIdentifier, suggestUsername } from '@/services/auth';
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

  describe('signInWithIdentifier', () => {
    beforeEach(() => {
      (supabase.rpc as jest.Mock) = jest.fn();
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({ error: null });
    });

    it('signs in an email directly with Supabase Auth', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });

      const result = await signInWithIdentifier('  Alice@UFL.edu ', 'secret');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'alice@ufl.edu',
        password: 'secret',
      });
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });

    it('reports an unconfirmed email sign-in', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: { message: 'Email not confirmed' },
      });

      await expect(signInWithIdentifier('alice@ufl.edu', 'secret')).resolves.toEqual({
        status: 'unconfirmed',
        email: 'alice@ufl.edu',
      });
    });

    it('signs in a username through the login function and never looks up the email', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { status: 'ok', access_token: 'access', refresh_token: 'refresh' },
        error: null,
      });

      const result = await signInWithIdentifier('  ALICE  ', 'secret');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('login', {
        body: { username: 'alice', password: 'secret' },
      });
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'access',
        refresh_token: 'refresh',
      });
      expect(supabase.rpc).not.toHaveBeenCalled();
      expect(result).toEqual({ status: 'ok' });
    });

    it('treats a rejected username login as invalid without starting a session', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { status: 'invalid' },
        error: null,
      });

      await expect(signInWithIdentifier('alice', 'wrong')).resolves.toEqual({ status: 'invalid' });
      expect(supabase.auth.setSession).not.toHaveBeenCalled();
    });

    it('passes along the email for an unconfirmed username login', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { status: 'unconfirmed', email: 'alice@ufl.edu' },
        error: null,
      });

      await expect(signInWithIdentifier('alice', 'secret')).resolves.toEqual({
        status: 'unconfirmed',
        email: 'alice@ufl.edu',
      });
    });

    it('throws when the login function fails', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Function unreachable'),
      });

      await expect(signInWithIdentifier('alice', 'secret')).rejects.toThrow('Function unreachable');
    });
  });
});
