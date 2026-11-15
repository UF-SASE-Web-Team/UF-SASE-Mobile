/**
 * Normalizes user input into a canonical LinkedIn profile URL:
 * https://www.linkedin.com/in/<username>
 *
 * Accepts:
 * - Full URLs with or without http(s) / www / tracking params:
 *   "https://www.linkedin.com/in/john-doe?utm_source=share"
 *   "linkedin.com/in/john-doe/"
 * - In-path shortcuts:
 *   "in/john-doe", "/in/john-doe"
 * - Bare usernames / handles:
 *   "john-doe", "@john-doe"
 *
 * Returns null if the input is empty or not a valid LinkedIn profile.
 */
export function normalizeLinkedInUrl(rawInput: string): string | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  let cleaned = trimmed.replace(/^@/, '');

  // If it's a URL or domain-like string containing linkedin.com
  if (cleaned.includes('linkedin.com')) {
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }

    try {
      const parsed = new URL(cleaned);
      const hostname = parsed.hostname.toLowerCase();
      // Must be linkedin.com or its subdomain (e.g., www.linkedin.com, ca.linkedin.com)
      if (hostname !== 'linkedin.com' && !hostname.endsWith('.linkedin.com')) {
        return null;
      }

      // Path should match /in/<username>
      const match = parsed.pathname.match(/^\/in\/([a-zA-Z0-9_\-%]+)\/?$/i);
      if (!match || !match[1]) {
        return null;
      }
      return `https://www.linkedin.com/in/${match[1]}`;
    } catch {
      return null;
    }
  }

  // Handle "in/<username>" or "/in/<username>"
  const inMatch = cleaned.match(/^\/?in\/([a-zA-Z0-9_\-%]+)\/?$/i);
  if (inMatch && inMatch[1]) {
    return `https://www.linkedin.com/in/${inMatch[1]}`;
  }

  // Handle bare username: 3-100 characters of letters, numbers, underscores, hyphens
  if (/^[a-zA-Z0-9_\-%]{3,100}$/.test(cleaned)) {
    return `https://www.linkedin.com/in/${cleaned}`;
  }

  return null;
}

/**
 * Formats a LinkedIn URL or handle for display in the profile UI:
 * "in/<username>"
 */
export function formatLinkedInDisplay(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  const canonical = normalizeLinkedInUrl(trimmed);
  if (canonical) {
    const match = canonical.match(/\/in\/([a-zA-Z0-9_\-%]+)\/?$/i);
    if (match && match[1]) {
      return `in/${match[1]}`;
    }
  }

  // Fallback if not canonical but has in/<username>
  const inMatch = trimmed.match(/^\/?in\/([a-zA-Z0-9_\-%]+)\/?$/i);
  if (inMatch && inMatch[1]) {
    return `in/${inMatch[1]}`;
  }

  const clean = trimmed.replace(/^@/, '');
  if (!clean.includes('/')) {
    return `in/${clean}`;
  }

  return trimmed;
}
