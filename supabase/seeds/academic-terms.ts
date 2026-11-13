import type { Database } from '../../src/types/supabase.ts';
import type { SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';

export type AcademicTermInsert = Database['public']['Tables']['academic_terms']['Insert'];

export const ACADEMIC_TERMS_SEED: readonly AcademicTermInsert[] = [
  {
    id: 'fall-2026',
    name: 'Fall 2026',
    start_date: '2026-08-18',
    is_current: true,
  },
  {
    id: 'spring-2027',
    name: 'Spring 2027',
    start_date: '2027-01-07',
    is_current: false,
  },
  {
    id: 'summer-2027',
    name: 'Summer 2027',
    start_date: '2027-05-06',
    is_current: false,
  },
] as const;

export async function seedAcademicTerms(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const result: SeedResult = {
    entity: 'academic_terms',
    inserted: 0,
    updated: 0,
    skipped: 0,
    total: ACADEMIC_TERMS_SEED.length,
    details: [],
  };

  const { data: existingRows, error: fetchErr } = await supabase
    .from('academic_terms')
    .select('id, name, start_date, is_current');

  if (fetchErr) {
    throw new Error(`Failed to query existing academic_terms: ${fetchErr.message}`);
  }

  const existingMap = new Map((existingRows ?? []).map((row) => [row.id, row]));

  for (const term of ACADEMIC_TERMS_SEED) {
    const existing = existingMap.get(term.id);

    if (!existing) {
      if (options.dryRun) {
        result.inserted++;
        result.details?.push(`[DRY RUN] Would insert term: ${term.name} (${term.id})`);
        continue;
      }

      if (term.is_current) {
        // Clear is_current flag on any existing terms to avoid unique partial index conflict
        await supabase.from('academic_terms').update({ is_current: false }).eq('is_current', true);
      }

      const { error: insertErr } = await supabase.from('academic_terms').insert(term);
      if (insertErr) {
        throw new Error(`Failed to insert academic_term "${term.id}": ${insertErr.message}`);
      }
      result.inserted++;
      result.details?.push(`Inserted term: ${term.name} (${term.id})`);
    } else {
      const needsUpdate =
        existing.name !== term.name ||
        existing.start_date !== term.start_date ||
        existing.is_current !== term.is_current;

      if (needsUpdate) {
        if (options.dryRun) {
          result.updated++;
          result.details?.push(`[DRY RUN] Would update term: ${term.name} (${term.id})`);
          continue;
        }

        if (term.is_current && !existing.is_current) {
          await supabase
            .from('academic_terms')
            .update({ is_current: false })
            .eq('is_current', true);
        }

        const { error: updateErr } = await supabase
          .from('academic_terms')
          .update({
            name: term.name,
            start_date: term.start_date,
            is_current: term.is_current,
          })
          .eq('id', term.id);

        if (updateErr) {
          throw new Error(`Failed to update academic_term "${term.id}": ${updateErr.message}`);
        }
        result.updated++;
        result.details?.push(`Updated term: ${term.name} (${term.id})`);
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}
