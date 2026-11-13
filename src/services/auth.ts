import { supabase } from '@/lib/supabase';

/**
 * Suggests an available username generated from a silly adjective + boring noun.
 * Guarantees uniqueness by checking against existing profiles in the database.
 *
 * @param separator Optional separator between adjective and noun ('_' or '.'). Defaults to '' (no separator, e.g. 'derpytoaster').
 * @returns A unique lowercase username conforming to the 3-20 character format.
 */
export async function suggestUsername(separator?: string): Promise<string> {
  const { data, error } = await supabase.rpc('suggest_username', {
    p_separator: separator,
  });

  if (error) throw error;
  if (!data) throw new Error('Failed to generate a suggested username.');

  return data;
}

/**
 * Checks if a given username is available in the database.
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_username_available', {
    input_username: username.trim().toLowerCase(),
  });

  if (error) throw error;
  return Boolean(data);
}

export type SignInResult =
  | { status: 'ok' }
  | { status: 'invalid' }
  /** The password was right but the email still needs its verification code. */
  | { status: 'unconfirmed'; email: string };

/**
 * Signs in with either an email or a username.
 *
 * Emails go straight to Supabase Auth. Usernames go through the `login` edge
 * function, which resolves the email server-side so it is never exposed to a
 * caller who does not know the password.
 */
export async function signInWithIdentifier(
  identifier: string,
  password: string,
): Promise<SignInResult> {
  const cleanIdentifier = identifier.trim().toLowerCase();

  if (cleanIdentifier.includes('@')) {
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanIdentifier,
      password,
    });
    if (!error) return { status: 'ok' };
    if (error.message.toLowerCase().includes('email not confirmed')) {
      return { status: 'unconfirmed', email: cleanIdentifier };
    }
    return { status: 'invalid' };
  }

  const { data, error } = await supabase.functions.invoke('login', {
    body: { username: cleanIdentifier, password },
  });
  if (error) throw error;

  if (data?.status === 'unconfirmed' && typeof data.email === 'string') {
    return { status: 'unconfirmed', email: data.email };
  }
  if (data?.status !== 'ok') return { status: 'invalid' };

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (sessionError) throw sessionError;
  return { status: 'ok' };
}

/**
 * Clears a sign-up for this email that was never verified, so a new attempt
 * starts fresh instead of keeping the abandoned one's password and username.
 * Verified accounts are untouched. Best effort: sign-up proceeds either way.
 */
export async function discardUnverifiedSignup(email: string): Promise<void> {
  await supabase.rpc('discard_unverified_signup', { p_email: email.trim().toLowerCase() });
}

/** Emails a fresh sign-up verification code. Best effort: the verify screen can resend. */
export async function resendSignupCode(email: string): Promise<void> {
  await supabase.auth.resend({ type: 'signup', email });
}
