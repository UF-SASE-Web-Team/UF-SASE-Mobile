import { getSupabaseEnvironment } from '@/lib/env';

const PUBLIC_ASSETS_BUCKET = 'public-assets';

/**
 * Image columns hold either an absolute URL or a path inside the `public-assets`
 * storage bucket (e.g. `programs/interns.webp`). Paths resolve against the Supabase
 * project the app is configured for, so the same row works in every environment.
 */
export function resolveAssetUrl(value: string | null): string | null {
  const path = value?.trim();
  if (!path) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const { supabaseUrl } = getSupabaseEnvironment();
  return `${supabaseUrl}/storage/v1/object/public/${PUBLIC_ASSETS_BUCKET}/${path.replace(/^\/+/, '')}`;
}
