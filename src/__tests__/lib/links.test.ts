import { Alert, Linking, Platform } from 'react-native';
import { openExternalLink, openMapLocation } from '@/lib/links';
import { posthog } from '@/lib/posthog';

jest.mock('@/lib/posthog', () => ({
  posthog: {
    capture: jest.fn(),
  },
}));

describe('lib/links', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  describe('openMapLocation', () => {
    it('does nothing when address is empty or whitespace', async () => {
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

      await openMapLocation('');
      await openMapLocation('   ');

      expect(openURLSpy).not.toHaveBeenCalled();
      expect(posthog?.capture).not.toHaveBeenCalled();
    });

    it('opens Apple Maps URL with address on iOS', async () => {
      Platform.OS = 'ios';
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

      await openMapLocation('Gainesville, FL');

      expect(openURLSpy).toHaveBeenCalledWith('https://maps.apple.com/?q=Gainesville%2C%20FL');
      expect(posthog?.capture).toHaveBeenCalledWith('outbound_map_clicked', {
        address: 'Gainesville, FL',
      });
    });

    it('opens Google Maps URL with address on Android', async () => {
      Platform.OS = 'android';
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

      await openMapLocation('Gainesville, FL');

      expect(openURLSpy).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=Gainesville%2C%20FL',
      );
      expect(posthog?.capture).toHaveBeenCalledWith('outbound_map_clicked', {
        address: 'Gainesville, FL',
      });
    });

    it('shows alert if opening map throws an error', async () => {
      Platform.OS = 'ios';
      jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Cannot open'));

      await openMapLocation('Gainesville, FL');

      expect(Alert.alert).toHaveBeenCalledWith(
        'Unable to open map',
        'Could not open map application.',
      );
    });
  });

  describe('openExternalLink', () => {
    it('alerts on invalid link', async () => {
      await openExternalLink('');
      expect(Alert.alert).toHaveBeenCalledWith('Invalid link', 'No URL provided.');
    });

    it('normalizes and opens valid URL', async () => {
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
      await openExternalLink('ufsase.com', 'SASE');
      expect(openURLSpy).toHaveBeenCalledWith('https://ufsase.com');
    });
  });
});
