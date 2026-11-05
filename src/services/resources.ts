import { supabase } from '@/lib/supabase';
import { ResourceRow } from '@/types/resources';

export async function getResources(): Promise<ResourceRow[]> {
  const { data, error: fetchError } = await supabase
    .from('resources')
    .select('*')
    .order('display_order', { ascending: true });

  if (fetchError) throw fetchError;
  return data || [];
}
