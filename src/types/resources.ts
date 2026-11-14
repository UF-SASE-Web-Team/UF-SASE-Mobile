import { Database } from '@/types/supabase';

export type ResourceRow = Database['public']['Tables']['resources']['Row'];
export type ResourceCategory = Database['public']['Enums']['resource_category'];

export interface ResourceSection {
  key: string;
  title: string;
  collapsible: boolean;
  items: ResourceRow[];
}

export function isTopResource(resource: ResourceRow): boolean {
  return Boolean(resource.is_top);
}

const APP_DEEPLINK_SCHEMES = ['ufsasemobile:'];

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
