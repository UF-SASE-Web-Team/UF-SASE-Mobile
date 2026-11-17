import * as SecureStore from 'expo-secure-store';
import * as StoreReview from 'expo-store-review';
import {
  recordCheckInAndMaybeRequestReview,
  REVIEW_COOLDOWN_MS,
  REVIEW_MIN_CHECK_INS,
  STORE_REVIEW_KEYS,
} from '@/lib/storeReview';

jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(),
  hasAction: jest.fn(),
  requestReview: jest.fn(),
}));

const DAY = 24 * 60 * 60 * 1000;

async function checkIn(times: number, now = 0) {
  for (let i = 0; i < times; i++) await recordCheckInAndMaybeRequestReview(now);
}

describe('recordCheckInAndMaybeRequestReview', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await SecureStore.deleteItemAsync(STORE_REVIEW_KEYS.checkInCount);
    await SecureStore.deleteItemAsync(STORE_REVIEW_KEYS.lastRequestedAt);
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (StoreReview.hasAction as jest.Mock).mockResolvedValue(true);
    (StoreReview.requestReview as jest.Mock).mockResolvedValue(undefined);
  });

  it('does not prompt before the minimum number of check-ins', async () => {
    await checkIn(REVIEW_MIN_CHECK_INS - 1);
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  it('prompts once the minimum is reached, then respects the cooldown', async () => {
    const start = 1_000 * DAY;
    await checkIn(REVIEW_MIN_CHECK_INS, start);
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);

    await recordCheckInAndMaybeRequestReview(start + REVIEW_COOLDOWN_MS - 1);
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);

    await recordCheckInAndMaybeRequestReview(start + REVIEW_COOLDOWN_MS);
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(2);
  });

  it('skips the prompt when the store review action is unavailable', async () => {
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    await checkIn(REVIEW_MIN_CHECK_INS);
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  it('never throws when the native call fails', async () => {
    (StoreReview.requestReview as jest.Mock).mockRejectedValue(new Error('boom'));
    await expect(checkIn(REVIEW_MIN_CHECK_INS)).resolves.toBeUndefined();
  });
});
