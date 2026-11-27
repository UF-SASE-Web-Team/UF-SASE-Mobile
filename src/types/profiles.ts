import type { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileChanges = Pick<
  Database['public']['Tables']['profiles']['Update'],
  | 'full_name'
  | 'pronouns'
  | 'majors'
  | 'minors'
  | 'grad_time'
  | 'discord_handle'
  | 'instagram_handle'
  | 'linkedin_url'
  | 'bio'
  | 'avatar_url'
>;

/** Profile edits plus the member's private details, which are stored separately. */
export type ProfileEdits = ProfileChanges & { ufid?: string; ufEmail?: string; gender?: string };

export type ProfileWithPrograms = Profile & { programNames: string[] };
