import { resolveAssetUrl } from '@/lib/assets';
import { supabase } from '@/lib/supabase';
import { ProgramWithPoCs } from '@/types/programs';

export async function getPrograms(): Promise<ProgramWithPoCs[]> {
  // Left-join program_members so programs without PoCs (or viewed by anon users) still load
  const { data, error: fetchError } = await supabase
    .from('programs')
    .select(
      `
      id,
      parent_id,
      name,
      slug,
      category,
      display_order,
      short_description,
      description,
      image_url,
      is_active,
      application_url,
      opens_at,
      closes_at,
      created_at,
      updated_at,
      program_members (
        id,
        user_id,
        display_name,
        is_poc,
        academic_term,
        profile:profiles (
          id,
          full_name,
          avatar_url
        ),
        term:academic_terms (
          is_current
        )
      )
    `,
    )
    .eq('is_active', true)
    .is('parent_id', null)
    .eq('program_members.is_poc', true)
    .eq('program_members.term.is_current', true)
    .order('display_order', { ascending: true });

  if (fetchError) throw fetchError;

  return (data || []).map((prog: any) => {
    // Filter out any member rows where the nested current term didn't match
    const activePocs = (prog.program_members || []).filter(
      (m: any) => m.is_poc && m.term?.is_current,
    );
    return {
      ...prog,
      image_url: resolveAssetUrl(prog.image_url),
      pocs: activePocs,
    };
  });
}

export async function getProgramBySlug(slug: string): Promise<ProgramWithPoCs | null> {
  const { data, error: fetchError } = await supabase
    .from('programs')
    .select(
      `
      id,
      parent_id,
      name,
      slug,
      category,
      display_order,
      short_description,
      description,
      image_url,
      is_active,
      application_url,
      opens_at,
      closes_at,
      created_at,
      updated_at,
      program_members (
        id,
        user_id,
        display_name,
        is_poc,
        academic_term,
        profile:profiles (
          id,
          full_name,
          avatar_url
        ),
        term:academic_terms (
          is_current
        )
      )
    `,
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!data) return null;

  const activePocs = (data.program_members || []).filter(
    (m: any) => m.is_poc && m.term?.is_current,
  );
  return {
    ...data,
    image_url: resolveAssetUrl(data.image_url),
    pocs: activePocs,
  };
}

/**
 * Programs with application info that have not closed yet (open now or opening soon),
 * ordered by nearest deadline, then by nearest opening date.
 */
export function getOpenApplicationPrograms(
  programs: ProgramWithPoCs[],
  now: Date = new Date(),
): ProgramWithPoCs[] {
  return programs
    .filter((p) => {
      const hasAppInfo = Boolean(p.application_url || p.opens_at || p.closes_at);
      if (!hasAppInfo) return false;

      const isClosed = p.closes_at ? new Date(p.closes_at) <= now : false;
      return !isClosed;
    })
    .sort((a, b) => {
      const deadlineA = a.closes_at ? new Date(a.closes_at).getTime() : Infinity;
      const deadlineB = b.closes_at ? new Date(b.closes_at).getTime() : Infinity;

      if (deadlineA !== deadlineB) {
        return deadlineA - deadlineB;
      }

      const opensA = a.opens_at ? new Date(a.opens_at).getTime() : Infinity;
      const opensB = b.opens_at ? new Date(b.opens_at).getTime() : Infinity;
      return opensA - opensB;
    });
}

/**
 * A Discord invite is something members join directly rather than apply to, so
 * the program card says "Join" for these links.
 */
export function isJoinLink(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname, pathname } = new URL(url);
    return (
      hostname === 'discord.gg' ||
      ((hostname === 'discord.com' || hostname === 'www.discord.com') &&
        pathname.startsWith('/invite/'))
    );
  } catch {
    return false;
  }
}

/**
 * The Join/Apply link for a program that can be joined right now, or `null` when
 * there is no link or its application window is not open.
 */
export function getProgramAction(
  program: Pick<ProgramWithPoCs, 'name' | 'application_url' | 'opens_at' | 'closes_at'>,
  now: Date = new Date(),
) {
  const url = program.application_url;
  if (!url) return null;
  if (program.opens_at && new Date(program.opens_at) > now) return null;
  if (program.closes_at && new Date(program.closes_at) <= now) return null;
  const isJoin = isJoinLink(url);
  return {
    url,
    label: isJoin ? 'Join' : 'Apply',
    accessibilityLabel: isJoin ? `Join ${program.name}` : `Apply to ${program.name}`,
  };
}
