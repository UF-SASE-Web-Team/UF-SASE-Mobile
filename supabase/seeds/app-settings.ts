import type { Database } from '../../src/types/supabase.ts';
import type { SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';

export type AppSettingInsert = Database['public']['Tables']['app_settings']['Insert'];

export const APP_SETTINGS_SEED: readonly AppSettingInsert[] = [
  {
    key: 'checkin_qr_url',
    value: 'https://forms.gle/CBEEdo8zP8hjqHdc6',
  },
] as const;

export async function seedAppSettings(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const result: SeedResult = {
    entity: 'app_settings',
    inserted: 0,
    updated: 0,
    skipped: 0,
    total: APP_SETTINGS_SEED.length,
    details: [],
  };

  const { data: existingRows, error: fetchErr } = await supabase
    .from('app_settings')
    .select('key, value');

  if (fetchErr) {
    throw new Error(`Failed to query existing app_settings: ${fetchErr.message}`);
  }

  const existingMap = new Map((existingRows ?? []).map((row) => [row.key, row.value]));

  for (const setting of APP_SETTINGS_SEED) {
    const existingVal = existingMap.get(setting.key);

    if (existingVal === undefined) {
      if (options.dryRun) {
        result.inserted++;
        result.details?.push(`[DRY RUN] Would insert setting: ${setting.key}`);
        continue;
      }

      const { error: insertErr } = await supabase.from('app_settings').insert(setting);
      if (insertErr) {
        throw new Error(`Failed to insert setting "${setting.key}": ${insertErr.message}`);
      }
      result.inserted++;
      result.details?.push(`Inserted setting: ${setting.key}`);
    } else if (existingVal !== setting.value) {
      if (options.dryRun) {
        result.updated++;
        result.details?.push(
          `[DRY RUN] Would update setting: ${setting.key} (${existingVal} -> ${setting.value})`,
        );
        continue;
      }

      const { error: updateErr } = await supabase
        .from('app_settings')
        .update({ value: setting.value })
        .eq('key', setting.key);

      if (updateErr) {
        throw new Error(`Failed to update setting "${setting.key}": ${updateErr.message}`);
      }
      result.updated++;
      result.details?.push(`Updated setting: ${setting.key} -> ${setting.value}`);
    } else {
      result.skipped++;
    }
  }

  return result;
}
