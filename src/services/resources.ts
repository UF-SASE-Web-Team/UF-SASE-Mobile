import { resolveAssetUrl } from '@/lib/assets';
import { supabase } from '@/lib/supabase';
import { ResourceRow, ResourceSection, isTopResource } from '@/types/resources';

export async function getResources(): Promise<ResourceRow[]> {
  const { data, error: fetchError } = await supabase.from('resources').select('*');

  if (fetchError) throw fetchError;
  return (data || []).map((resource) => ({
    ...resource,
    image_url: resolveAssetUrl(resource.image_url),
  }));
}

export function organizeResourceSections(resources: ResourceRow[]): ResourceSection[] {
  const topItems = resources.filter((r) => isTopResource(r));

  const nonTopItems = resources.filter((r) => !isTopResource(r));
  const saseItems = nonTopItems.filter((r) => r.category === 'sase');
  const academicItems = nonTopItems.filter((r) => r.category === 'academic');
  const professionalItems = nonTopItems.filter((r) => r.category === 'professional');

  const otherItems = nonTopItems.filter(
    (r) => !r.category || !['sase', 'academic', 'professional'].includes(r.category as string),
  );

  const result: ResourceSection[] = [
    {
      key: 'top',
      title: 'Top Resources',
      collapsible: false,
      items: topItems,
    },
    {
      key: 'sase',
      title: 'SASE Resources',
      collapsible: true,
      items: saseItems,
    },
    {
      key: 'academic',
      title: 'Academic',
      collapsible: true,
      items: academicItems,
    },
    {
      key: 'professional',
      title: 'Professional',
      collapsible: true,
      items: professionalItems,
    },
  ];

  if (otherItems.length > 0) {
    result.push({
      key: 'other',
      title: 'Other Resources',
      collapsible: true,
      items: otherItems,
    });
  }

  return result;
}

export async function getResourceSections(): Promise<ResourceSection[]> {
  const resources = await getResources();
  return organizeResourceSections(resources);
}
