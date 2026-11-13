import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/supabase.ts';

export type SupabaseAdminClient = SupabaseClient<Database>;

export interface SeedOptions {
  /** When true, queries database state and calculates changes without performing writes */
  dryRun?: boolean;
  /** When true, outputs additional debug / row-level information */
  verbose?: boolean;
}

export interface SeedResult {
  entity: string;
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
  details?: string[];
}

export interface EntitySeeder {
  name: string;
  description: string;
  seed: (client: SupabaseAdminClient, options?: SeedOptions) => Promise<SeedResult>;
}
