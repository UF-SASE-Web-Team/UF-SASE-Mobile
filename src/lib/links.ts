import { Alert, Linking, Platform } from 'react-native';
import { posthog } from '@/lib/posthog';

/** Public legal pages, shown at sign-up and in account settings. */
export const legalLinks = {
  terms: 'https://ufsase.com/terms',
  privacy: 'https://ufsase.com/privacy',
} as const;

/**
 * Normalizes URL strings ensuring valid protocol schemes for Linking.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) || trimmed.startsWith('mailto:')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Opens a user-supplied link outside the app, alerting when it cannot be opened.
 */
export async function openExternalLink(rawUrl: string, label?: string): Promise<void> {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    Alert.alert('Invalid link', 'No URL provided.');
    return;
  }

  posthog?.capture('outbound_link_clicked', { url, ...(label ? { label } : {}) });

  try {
    const supported = await Linking.canOpenURL(url).catch(() => true);
    if (supported) {
      await Linking.openURL(url);
    } else if (/^https?:\/\//i.test(url)) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open link', 'Could not open this URL.');
    }
  } catch (err: any) {
    Alert.alert('Link error', err?.message || 'Failed to open link.');
  }
}

/**
 * Opens a map application searching for the given address.
 * Uses Apple Maps on iOS and Google Maps on Android/Web.
 */
export async function openMapLocation(address: string): Promise<void> {
  const trimmed = address.trim();
  if (!trimmed) return;

  const query = encodeURIComponent(trimmed);
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;

  posthog?.capture('outbound_map_clicked', { address: trimmed });

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open map', 'Could not open map application.');
  }
}
