import PostHog from 'posthog-react-native';

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

/**
 * Shared PostHog client instance.
 * If no API key is provided, this remains null and all `posthog?.` calls are safe no-ops.
 */
export const posthog = posthogApiKey
  ? new PostHog(posthogApiKey, {
      host: 'https://us.i.posthog.com',
      flushInterval: 30,
      flushAt: 20,
      captureAppLifecycleEvents: true,
    })
  : null;
