import { Database } from '@/types/supabase';

export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ResourceCategory = Database['public']['Enums']['resource_category'];
