import { Database } from '@/types/supabase';

export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ResourceCategory = Database['public']['Enums']['resource_category'];

export interface ResourceSection {
  key: string;
  title: string;
  collapsible: boolean;
  data: { id: string; items: ResourceRow[] }[];
}

export const RESOURCE_DISPLAY_NAMES: Record<string, string> = {
  'freshman faqs': 'Freshmen FAQs',
  '26-27 google calendar': "SASE's Gcal",
  'resume template': 'SASE Resume Template',
  'marston study room booking': 'Pi Room Booking',
  'board office hours': 'Board OH',
  'f26 class connector form': 'Class Connector Form',
  'f26 class connector sheet': 'Class Connector Finder',
  'pre-med resources': 'Pre-Med Resources',
  'internship guide': 'Internship Resources',
  'interview prep': 'Interview Resources',
  'experiences tracker': 'Experience Tracker',
};

export function getResourceDisplayName(name: string): string {
  return RESOURCE_DISPLAY_NAMES[name.toLowerCase().trim()] || name;
}

const TOP_RESOURCE_NAMES = new Set([
  'freshmen faqs',
  'freshman faqs',
  'linktree',
  "sase's gcal",
  '26-27 google calendar',
  'sase resume template',
  'resume template',
]);

export function isTopResource(resource: ResourceRow): boolean {
  if ((resource as any).is_top) return true;
  return TOP_RESOURCE_NAMES.has(resource.name.toLowerCase().trim());
}

const APP_DEEPLINK_SCHEMES = ['ufsasemobile:', 'ufsase:'];

/**
 * Determines whether a URL is an internal app deeplink or relative in-app path.
 */
export function isInternalUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();

  // Relative path (e.g., /resources/freshman-faqs)
  if (trimmed.startsWith('/')) {
    return true;
  }

  // App custom scheme deeplink (e.g., ufsasemobile://resources/freshman-faqs)
  if (APP_DEEPLINK_SCHEMES.some((scheme) => trimmed.startsWith(scheme))) {
    return true;
  }

  // Universal link / domain link matching in-app screen
  if (trimmed.includes('ufsase.com/freshman-faq')) {
    return true;
  }

  return false;
}

/**
 * Resolves an internal route path from a deeplink or relative URL.
 */
export function resolveInternalPath(url: string): string {
  const trimmed = url.trim();

  // Already a relative path
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Custom scheme: ufsasemobile://resources/freshman-faqs -> /resources/freshman-faqs
  for (const scheme of APP_DEEPLINK_SCHEMES) {
    if (trimmed.toLowerCase().startsWith(scheme)) {
      const withoutScheme = trimmed.slice(scheme.length);
      return '/' + withoutScheme.replace(/^\/+/, '');
    }
  }

  // Universal link fallback for website domain
  if (trimmed.toLowerCase().includes('freshman-faq')) {
    return '/resources/freshman-faqs';
  }

  return trimmed;
}

/**
 * A resource is considered internal (having a right chevron) if its URL is an in-app deeplink.
 */
export function isInternalResource(resource: ResourceRow): boolean {
  return isInternalUrl(resource.url);
}

const TOP_ORDER: Record<string, number> = {
  'freshmen faqs': 1,
  'freshman faqs': 1,
  linktree: 2,
  "sase's gcal": 3,
  '26-27 google calendar': 3,
  'sase resume template': 4,
  'resume template': 4,
};

export function getTopResourceOrder(resource: ResourceRow): number {
  const key = resource.name.toLowerCase().trim();
  return TOP_ORDER[key] ?? resource.display_order ?? 99;
}
