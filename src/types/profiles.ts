import type { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileChanges = Pick<
  Database['public']['Tables']['profiles']['Update'],
  | 'full_name'
  | 'major'
  | 'minor'
  | 'grad_time'
  | 'discord_handle'
  | 'instagram_handle'
  | 'linkedin_url'
  | 'bio'
  | 'avatar_url'
>;

export type ProfileWithPrograms = Profile & { programNames: string[] };
