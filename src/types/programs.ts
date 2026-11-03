import { Database } from '@/types/supabase';

export type ProgramRow = Database['public']['Tables']['programs']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProgramCategory = Database['public']['Enums']['program_category'];

export interface ProgramMemberWithProfile {
  id: string;
  user_id: string | null;
  display_name: string;
  academic_term: string;
  is_poc: boolean;
  profile: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface ProgramWithPoCs extends ProgramRow {
  pocs: ProgramMemberWithProfile[];
}
