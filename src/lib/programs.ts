import { ProgramWithPoCs } from '@/types/programs';

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
