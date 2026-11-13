import { Alert, Linking } from 'react-native';

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
export async function openExternalLink(rawUrl: string): Promise<void> {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    Alert.alert('Invalid link', 'No URL provided.');
    return;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Unable to open link', 'Could not open this URL.');
    }
  } catch (err: any) {
    Alert.alert('Link error', err.message || 'Failed to open link.');
  }
}
