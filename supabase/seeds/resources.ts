import type { Database } from '../../src/types/supabase.ts';
import type { SeedOptions, SeedResult, SupabaseAdminClient } from './types.ts';

export type ResourceCategory = Database['public']['Enums']['resource_category'];
export type ResourceInsert = Database['public']['Tables']['resources']['Insert'];

export const RESOURCES_SEED: readonly ResourceInsert[] = [
  {
    name: 'Linktree',
    category: 'general',
    url: 'https://linktr.ee/ufsase',
    is_top: true,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/linktree.png',
  },
  {
    name: 'Discord',
    category: 'general',
    url: 'http://discord.gg/q3HBeC5',
    is_top: false,
    image_url: null,
  },
  {
    name: "SASE's Gcal",
    category: 'general',
    url: 'https://calendar.google.com/calendar/u/3?cid=ZTI0YTQ0ZWUyMDBlZjc3OTc2NjY5ZWQzNGIxNTM2NDk4NTIzNTcwNjZhMjEzN2M5YTlmYjZlMDg4OGZhZDAwY0Bncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
    is_top: true,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/gcal.png',
  },
  {
    name: 'Photo Albums',
    category: 'general',
    url: 'https://docs.google.com/spreadsheets/d/1LNNINwA_oXcNuKiVTpikccGX-QcF5Gnp_KB00j1lG1Y/edit?usp=sharing',
    is_top: false,
    image_url: null,
  },
  {
    name: 'Freshmen FAQs',
    category: 'sase',
    url: 'ufsasemobile://resources/freshman-faqs',
    is_top: true,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/freshman-faq.png',
  },
  {
    name: 'Pi Room Booking',
    category: 'sase',
    url: 'https://docs.google.com/spreadsheets/d/1ERqFWhNp5rtnSTy3aD8WhlVVRAJlHl7X-MUFAAVtxhA/edit?gid=892345678#gid=892345678',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/marston-booking.png',
  },
  {
    name: 'Board OH',
    category: 'sase',
    url: 'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/board-office-hours.png',
  },
  {
    name: 'Class Connector Form',
    category: 'sase',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSfmL0xHfKMK-7x-ACH3ea98V0F1JS7lyK8s3v62eygY4105uQ/viewform',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/class-connector-form.png',
  },
  {
    name: 'Class Connector Finder',
    category: 'sase',
    url: 'https://docs.google.com/spreadsheets/d/1pGzTTaZK6Xc1MoQFwOWRms8l5K2zeIn2_K_K_KZ5XrE/edit?usp=sharing',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/class-connector-sheet.png',
  },
  {
    name: 'Research Resources',
    category: 'academic',
    url: 'https://docs.google.com/spreadsheets/d/1QlZsZNBDsmBO8gRVXnzLHra_at9kqfQmmSVV4i827lU/edit?usp=sharing',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/research.png',
  },
  {
    name: 'Pre-Med Resources',
    category: 'academic',
    url: 'https://drive.google.com/drive/folders/1nFlB8M0RVqi5e0s7QtOsnJ4gSEWwaJvA',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/premed.png',
  },
  {
    name: 'Design Team List',
    category: 'academic',
    url: 'https://docs.google.com/document/d/1gcITx3IKn6HnJ1bcA4TVTlh27wP6jSFf/edit#heading=h.o9rwupa35f1a',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/design-teams.png',
  },
  {
    name: 'SASE Resume Template',
    category: 'professional',
    url: 'https://drive.google.com/drive/folders/1EcDL-qyRxkPOfUxYuQGBNKkDVh7ylray',
    is_top: true,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/resume-template.png',
  },
  {
    name: 'Internship Resources',
    category: 'professional',
    url: 'https://drive.google.com/drive/folders/1ODgUWyr_5Zl3oLwiXUSgbKVggyx8Qxjq',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/internship.png',
  },
  {
    name: 'Interview Resources',
    category: 'professional',
    url: 'https://drive.google.com/drive/folders/1Ziv21RfRcjXxGj84_feg1Y3JUVRCdjnX',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/interview.png',
  },
  {
    name: 'Networking Resources',
    category: 'professional',
    url: 'https://drive.google.com/drive/folders/14FTXWDmX-X-FlNe5mEfM0C5D-xf9oN2d',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/networking.png',
  },
  {
    name: 'Experience Tracker',
    category: 'professional',
    url: 'https://docs.google.com/document/d/1rxYm5SCaX--ANEcCqRQFCgHLKbwZPqwU/edit',
    is_top: false,
    image_url:
      'https://yoazhfliefswktpszaob.supabase.co/storage/v1/object/public/public-assets/resources/experiences-tracker.png',
  },
] as const;

export async function seedResources(
  supabase: SupabaseAdminClient,
  options: SeedOptions = {},
): Promise<SeedResult> {
  const result: SeedResult = {
    entity: 'resources',
    inserted: 0,
    updated: 0,
    skipped: 0,
    total: RESOURCES_SEED.length,
    details: [],
  };

  const { data: existingRows, error: fetchErr } = await supabase
    .from('resources')
    .select('id, name, category, url, is_top, image_url');

  if (fetchErr) {
    throw new Error(`Failed to query existing resources: ${fetchErr.message}`);
  }

  const existingByName = new Map((existingRows ?? []).map((row) => [row.name, row]));

  for (const resource of RESOURCES_SEED) {
    const existing = existingByName.get(resource.name);

    if (!existing) {
      if (options.dryRun) {
        result.inserted++;
        result.details?.push(`[DRY RUN] Would insert resource: ${resource.name}`);
        continue;
      }

      const { error: insertErr } = await supabase.from('resources').insert(resource);
      if (insertErr) {
        throw new Error(`Failed to insert resource "${resource.name}": ${insertErr.message}`);
      }
      result.inserted++;
      result.details?.push(`Inserted resource: ${resource.name}`);
    } else {
      const needsUpdate =
        existing.category !== resource.category ||
        existing.url !== resource.url ||
        existing.is_top !== resource.is_top ||
        (resource.image_url !== null && existing.image_url !== resource.image_url);

      if (needsUpdate) {
        if (options.dryRun) {
          result.updated++;
          result.details?.push(`[DRY RUN] Would update resource: ${resource.name}`);
          continue;
        }

        const { error: updateErr } = await supabase
          .from('resources')
          .update({
            category: resource.category,
            url: resource.url,
            is_top: resource.is_top,
            image_url: resource.image_url ?? existing.image_url,
          })
          .eq('name', resource.name);

        if (updateErr) {
          throw new Error(`Failed to update resource "${resource.name}": ${updateErr.message}`);
        }
        result.updated++;
        result.details?.push(`Updated resource: ${resource.name}`);
      } else {
        result.skipped++;
      }
    }
  }

  return result;
}
