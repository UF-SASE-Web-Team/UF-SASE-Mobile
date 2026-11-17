import { getSupabaseEnvironment } from '@/lib/env';

export const GRAPHICS = {
  rings: require('@/assets/graphics/rings.webp'),
  starLeft: require('@/assets/graphics/star-left.webp'),
  starRight: require('@/assets/graphics/star-right.webp'),
} as const;

export type GraphicAssetKey = keyof typeof GRAPHICS;

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

/**
 * Resource icons shipped inside the app so they never cost Supabase egress.
 * Keyed by file name in the `public-assets/resources/` folder.
 */
export const RESOURCE_ICONS: Record<string, number> = {
  'board-office-hours': require('@/assets/resources/board-office-hours.webp'),
  'class-connector-form': require('@/assets/resources/class-connector-form.webp'),
  'class-connector-sheet': require('@/assets/resources/class-connector-sheet.webp'),
  'design-teams': require('@/assets/resources/design-teams.webp'),
  'experiences-tracker': require('@/assets/resources/experiences-tracker.webp'),
  'freshman-faq': require('@/assets/resources/freshman-faq.webp'),
  gcal: require('@/assets/resources/gcal.webp'),
  internship: require('@/assets/resources/internship.webp'),
  interview: require('@/assets/resources/interview.webp'),
  linktree: require('@/assets/resources/linktree.webp'),
  'marston-booking': require('@/assets/resources/marston-booking.webp'),
  networking: require('@/assets/resources/networking.webp'),
  premed: require('@/assets/resources/premed.webp'),
  research: require('@/assets/resources/research.webp'),
  'resume-template': require('@/assets/resources/resume-template.webp'),
};

/**
 * Image source for a resource icon. Uses the bundled copy when the icon lives in
 * `public-assets/resources/` (as a bucket path or full URL) and one is bundled,
 * so existing rows need no change; anything else loads remotely.
 */
export function getResourceIconSource(value: string | null): number | { uri: string } | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/(?:^|\/)resources\/([a-z0-9-]+)\.webp(?:[?#].*)?$/i);
  const bundled = match ? RESOURCE_ICONS[match[1].toLowerCase()] : undefined;
  if (bundled) return bundled;
  const url = resolveAssetUrl(trimmed);
  return url ? { uri: url } : null;
}
