/**
 * Transforms technical or native errors into clean, user-friendly copy.
 * Ensures low-level network or platform traces (e.g. Swift runtime exceptions,
 * internal PostgREST codes) are never presented directly to end users.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!error) return fallback;

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);

  const lower = raw.toLowerCase();

  // Network / server connection issues
  if (
    lower.includes('fetch failed') ||
    lower.includes('could not connect') ||
    lower.includes('network request failed') ||
    lower.includes('network error') ||
    lower.includes('unexpectedexception') ||
    lower.includes('failed to fetch') ||
    lower.includes('network down') ||
    lower.includes('offline') ||
    lower.includes('load failed')
  ) {
    return 'Unable to connect to SASE servers. Please check your internet connection and try again.';
  }

  // Request timeout
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'The request took too long to complete. Please try again in a moment.';
  }

  // Filter out stack traces, file paths, or raw PostgREST error codes
  if (
    raw.includes('.swift:') ||
    raw.includes('.tsx:') ||
    raw.includes('.ts:') ||
    raw.includes('.jsx:') ||
    raw.includes('.js:') ||
    raw.includes('at ExpoModulesCore') ||
    raw.includes('PGRST')
  ) {
    return fallback;
  }

  return raw || fallback;
}
