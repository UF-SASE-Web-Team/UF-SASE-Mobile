import type { EntitySeeder, SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';
import { ACADEMIC_TERMS_SEED, seedAcademicTerms } from './academic-terms.ts';
import { APP_SETTINGS_SEED, seedAppSettings } from './app-settings.ts';
import { PARENT_PROGRAMS_SEED, SUB_PROGRAMS_SEED, seedPrograms } from './programs.ts';
import { RESOURCES_SEED, seedResources } from './resources.ts';
import { REVIEWER_ACCOUNT_SEED, seedReviewerAccounts } from './reviewer-accounts.ts';
import { seedEvents } from './events.ts';

export * from './types.ts';
export * from './academic-terms.ts';
export * from './app-settings.ts';
export * from './programs.ts';
export * from './resources.ts';
export * from './reviewer-accounts.ts';
export * from './events.ts';

export const SEEDERS: readonly EntitySeeder[] = [
  {
    name: 'academic_terms',
    description: 'Academic semesters & active term designation',
    seed: seedAcademicTerms,
  },
  {
    name: 'app_settings',
    description: 'Global application settings (e.g. checkin QR code target)',
    seed: seedAppSettings,
  },
  {
    name: 'programs',
    description: 'UF SASE official programs and subprogram teams',
    seed: seedPrograms,
  },
  {
    name: 'resources',
    description: 'Curated links, academic guides, and professional tools',
    seed: seedResources,
  },
  {
    name: 'reviewer_accounts',
    description: 'Reviewer test account for app reviews (alice@gmail.com)',
    seed: seedReviewerAccounts,
  },
  {
    name: 'events',
    description: 'UF SASE official calendar events & links (from events.sql)',
    seed: seedEvents,
  },
] as const;

export async function runAllSeeds(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  for (const seeder of SEEDERS) {
    const result = await seeder.seed(supabase, options);
    results.push(result);
  }

  return results;
}
