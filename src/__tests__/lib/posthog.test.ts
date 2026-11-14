import { posthog } from '@/lib/posthog';

describe('PostHog Client Library', () => {
  it('exports posthog instance or null safely', () => {
    // When no key is set or mocked, posthog is either an instance or null
    expect(posthog === null || typeof posthog === 'object').toBe(true);
  });
});
