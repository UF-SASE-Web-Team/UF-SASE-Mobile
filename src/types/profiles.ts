import type { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileChanges = Pick<
  Database['public']['Tables']['profiles']['Update'],
  | 'full_name'
  | 'majors'
  | 'minors'
  | 'grad_time'
  | 'discord_handle'
  | 'instagram_handle'
  | 'linkedin_url'
  | 'bio'
  | 'avatar_url'
>;

/** Profile edits plus the member's private UFID, which is stored separately. */
export type ProfileEdits = ProfileChanges & { ufid?: string };

export type ProfileWithPrograms = Profile & { programNames: string[] };
