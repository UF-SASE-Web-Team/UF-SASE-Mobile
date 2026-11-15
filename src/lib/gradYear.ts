export const MIN_GRAD_YEAR = 1980;
export const MAX_GRAD_YEAR = 2040;
export const INVALID_GRAD_YEAR_MESSAGE = 'Enter a valid 4-digit graduation year.';

/** Keeps only digits up to 4 characters. */
export function sanitizeGradYear(text: string): string {
  return text.replace(/\D/g, '').slice(0, 4);
}

/**
 * Validates that a string is a 4-digit year within [1980, 2040].
 * Empty strings are considered invalid by this check; if grad year is optional,
 * callers should guard with `if (value.trim())`.
 */
export function isValidGradYear(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{4}$/.test(trimmed)) return false;
  const year = Number(trimmed);
  return year >= MIN_GRAD_YEAR && year <= MAX_GRAD_YEAR;
}
