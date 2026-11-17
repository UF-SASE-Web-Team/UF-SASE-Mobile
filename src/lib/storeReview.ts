import * as SecureStore from 'expo-secure-store';
import * as StoreReview from 'expo-store-review';
import { posthog } from '@/lib/posthog';

/**
 * Native App Store / Play Store review prompt.
 *
 * Trigger: the user dismisses the "Check-in successful!" alert. That is the
 * clearest "this app just worked for me" moment we have — they scanned in,
 * earned points, and are done with the task (not mid-flow).
 *
 * Guardrails on top of the OS's own throttling (iOS shows the sheet at most
 * 3 times per 365 days regardless of how often we ask):
 * - Only after the user's Nth successful check-in, so first-timers aren't asked.
 * - At most once per cooldown window, so we don't burn the yearly quota.
 */
export const REVIEW_MIN_CHECK_INS = 2;
export const REVIEW_COOLDOWN_MS = 120 * 24 * 60 * 60 * 1000;

export const STORE_REVIEW_KEYS = {
  checkInCount: 'store_review_check_in_count',
  lastRequestedAt: 'store_review_last_requested_at',
} as const;

async function readNumber(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(key);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Records a successful check-in and, if the user is eligible, shows the
 * native review prompt. Never throws — a review prompt must never break
 * the check-in flow.
 */
export async function recordCheckInAndMaybeRequestReview(now: number = Date.now()) {
  try {
    const count = (await readNumber(STORE_REVIEW_KEYS.checkInCount)) + 1;
    await SecureStore.setItemAsync(STORE_REVIEW_KEYS.checkInCount, String(count));

    if (count < REVIEW_MIN_CHECK_INS) return;

    const lastRequestedAt = await readNumber(STORE_REVIEW_KEYS.lastRequestedAt);
    if (lastRequestedAt && now - lastRequestedAt < REVIEW_COOLDOWN_MS) return;

    if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;

    await SecureStore.setItemAsync(STORE_REVIEW_KEYS.lastRequestedAt, String(now));
    await StoreReview.requestReview();
    posthog?.capture('store_review_requested', { check_in_count: count });
  } catch {
    // Swallow: storage or native failures should never surface to the user.
  }
}
