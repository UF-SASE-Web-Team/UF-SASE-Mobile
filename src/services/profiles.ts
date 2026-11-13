import { supabase } from '@/lib/supabase';
import type { Profile, ProfileChanges, ProfileWithPrograms } from '@/types/profiles';

export async function getProfile(userId: string): Promise<ProfileWithPrograms> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      '*, program_members(program:programs!inner(name, is_active), term:academic_terms!inner(is_current))',
    )
    .eq('id', userId)
    .eq('program_members.term.is_current', true)
    .eq('program_members.program.is_active', true)
    .single();

  if (error) throw error;
  const { program_members, ...profile } = data;
  return {
    ...profile,
    programNames: [...new Set(program_members.map((membership) => membership.program.name))],
  };
}

export async function updateProfile(userId: string, changes: ProfileChanges): Promise<Profile> {
  // Keep account IDs, roles, and membership data outside the editable payload.
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: changes.full_name,
      major: changes.major,
      minor: changes.minor,
      grad_time: changes.grad_time,
      discord_handle: changes.discord_handle,
      instagram_handle: changes.instagram_handle,
      linkedin_url: changes.linkedin_url,
      bio: changes.bio,
      avatar_url: changes.avatar_url,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/** The signed-in member's own UFID. Other members' UFIDs are never readable. */
export async function getUfid(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profile_private')
    .select('ufid')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.ufid ?? null;
}

export async function saveUfid(userId: string, ufid: string): Promise<string> {
  const { data, error } = await supabase
    .from('profile_private')
    .upsert({ user_id: userId, ufid })
    .select('ufid')
    .single();

  if (error) {
    // Unique violation: another account already registered this UFID.
    if (error.code === '23505') {
      throw new Error('That UFID is already linked to another account.');
    }
    throw error;
  }
  return data.ufid;
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function verifyPasswordResetCode(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export type ContactProfile = Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;

export async function getProfilesByIds(userIds: string[]): Promise<ContactProfile[]> {
  if (!userIds || userIds.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  if (error) throw error;
  return data || [];
}

export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
}
