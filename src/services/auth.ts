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

/**
 * Resolves a username to its associated email for authentication.
 */
export async function getEmailFromUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_email_from_username', {
    p_username: username.trim().toLowerCase(),
  });

  if (error) throw error;
  return data;
}
