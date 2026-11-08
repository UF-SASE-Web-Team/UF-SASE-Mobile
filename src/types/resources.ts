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

const INTERNAL_RESOURCE_NAMES = new Set(['freshmen faqs', 'freshman faqs']);

export function isInternalResource(resource: ResourceRow): boolean {
  if ((resource as any).is_internal || (resource as any).internal_route) return true;
  return INTERNAL_RESOURCE_NAMES.has(resource.name.toLowerCase().trim());
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
