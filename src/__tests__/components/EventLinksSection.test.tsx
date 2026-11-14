import React from 'react';
import { Alert, Linking } from 'react-native';
import { render, screen, cleanup, userEvent } from '@testing-library/react-native';
import {
  EventLinksSection,
  getLinkIcon,
  normalizeUrl,
} from '@/components/events/EventLinksSection';
import { ThemeProvider } from '@/context/ThemeContext';

async function renderSection(props: React.ComponentProps<typeof EventLinksSection>) {
  return render(
    <ThemeProvider>
      <EventLinksSection {...props} />
    </ThemeProvider>,
  );
}

describe('EventLinksSection', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  describe('normalizeUrl', () => {
    it('returns empty string for empty or whitespace-only inputs', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('   ')).toBe('');
    });

    it('preserves existing https:// or http:// or custom schemes', () => {
      expect(normalizeUrl('https://saseuf.org')).toBe('https://saseuf.org');
      expect(normalizeUrl('http://saseuf.org')).toBe('http://saseuf.org');
      expect(normalizeUrl('mailto:contact@saseuf.org')).toBe('mailto:contact@saseuf.org');
    });

    it('prefixes https:// when scheme is absent', () => {
      expect(normalizeUrl('forms.gle/xyz')).toBe('https://forms.gle/xyz');
      expect(normalizeUrl('google.com')).toBe('https://google.com');
    });
  });

  describe('getLinkIcon', () => {
    it('selects appropriate icon based on URL and title keywords', () => {
      expect(getLinkIcon('https://discord.gg/abc')).toBe('logo-discord');
      expect(getLinkIcon('https://github.com/uf-sase')).toBe('logo-github');
      expect(getLinkIcon('https://instagram.com/ufsase')).toBe('logo-instagram');
      expect(getLinkIcon('https://linkedin.com/in/ufsase')).toBe('logo-linkedin');
      expect(getLinkIcon('https://youtube.com/watch')).toBe('logo-youtube');
      expect(getLinkIcon('https://zoom.us/j/123')).toBe('videocam-outline');
      expect(getLinkIcon('https://docs.google.com/document/d/123')).toBe('document-text-outline');
      expect(getLinkIcon('https://example.com', 'Carpool Sheet')).toBe('document-text-outline');
      expect(getLinkIcon('https://maps.google.com')).toBe('map-outline');
      expect(getLinkIcon('https://randomsite.com')).toBe('link-outline');
    });
  });

  describe('Component rendering & interaction', () => {
    it('renders null when links is undefined or empty', async () => {
      const { toJSON } = await renderSection({ links: [] });
      expect(toJSON()).toBeNull();

      const { toJSON: toJSONUndefined } = await renderSection({ links: undefined });
      expect(toJSONUndefined()).toBeNull();
    });

    it('renders links and handles tap to open URL', async () => {
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const user = userEvent.setup();

      await renderSection({
        links: [
          {
            id: 'l1',
            event_id: 'e1',
            title: 'Carpool Sign Up',
            url: 'https://docs.google.com/forms/d/123',
          },
          {
            id: 'l2',
            event_id: 'e1',
            title: 'Discord Server',
            url: 'discord.gg/ufsase',
          },
        ],
      });

      expect(screen.getByText('Links')).toBeTruthy();
      expect(screen.getByText('Carpool Sign Up')).toBeTruthy();
      expect(screen.getByText('Discord Server')).toBeTruthy();

      await user.press(screen.getByText('Carpool Sign Up'));
      expect(openURLSpy).toHaveBeenCalledWith('https://docs.google.com/forms/d/123');

      await user.press(screen.getByText('Discord Server'));
      expect(openURLSpy).toHaveBeenCalledWith('https://discord.gg/ufsase');
    });

    it('shows alert if URL is unsupported', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const alertSpy = jest.spyOn(Alert, 'alert');
      const user = userEvent.setup();

      await renderSection({
        links: [
          {
            id: 'l1',
            event_id: 'e1',
            title: 'Unsupported Link',
            url: 'invalid://url',
          },
        ],
      });

      await user.press(screen.getByText('Unsupported Link'));
      expect(alertSpy).toHaveBeenCalledWith('Unable to open link', 'Could not open this URL.');
    });

    it('supports custom title', async () => {
      await renderSection({
        title: 'Meeting Resources',
        links: [
          {
            id: 'l1',
            event_id: 'e1',
            title: 'Slides',
            url: 'https://docs.google.com/presentation',
          },
        ],
      });

      expect(screen.getByText('Meeting Resources')).toBeTruthy();
      expect(screen.queryByText('Links')).toBeNull();
    });
  });
});
