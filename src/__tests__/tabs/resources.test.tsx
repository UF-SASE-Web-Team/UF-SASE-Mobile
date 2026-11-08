import React from 'react';
import { Linking } from 'react-native';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import ResourcesPage from '@/app/(tabs)/resources';
import { ThemeProvider } from '@/context/ThemeContext';
import * as resourcesService from '@/services/resources';
import { ResourceRow } from '@/types/resources';
import { useRouter } from 'expo-router';

jest.mock('@/services/resources');

function renderResourcesPage() {
  return render(
    <ThemeProvider>
      <ResourcesPage />
    </ThemeProvider>,
  );
}

const mockResources: ResourceRow[] = [
  {
    id: 'res-faq',
    name: 'Freshmen FAQs',
    category: 'sase',
    url: 'https://ufsase.com/freshman-faq',
    display_order: 10,
    image_url: 'https://example.com/freshman-faq.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-linktree',
    name: 'Linktree',
    category: 'general',
    url: 'https://linktr.ee/ufsase',
    display_order: 20,
    image_url: 'https://example.com/linktree.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-gcal',
    name: "SASE's Gcal",
    category: 'general',
    url: 'https://calendar.google.com',
    display_order: 30,
    image_url: 'https://example.com/gcal.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-resume',
    name: 'SASE Resume Template',
    category: 'professional',
    url: 'https://drive.google.com/resume',
    display_order: 40,
    image_url: 'https://example.com/resume.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-pi-room',
    name: 'Pi Room Booking',
    category: 'sase',
    url: 'https://docs.google.com/marston',
    display_order: 20,
    image_url: 'https://example.com/marston.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-board-oh',
    name: 'Board OH',
    category: 'sase',
    url: 'https://docs.google.com/board-oh',
    display_order: 30,
    image_url: 'https://example.com/board.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-research',
    name: 'Research Resources',
    category: 'academic',
    url: 'https://docs.google.com/research',
    display_order: 10,
    image_url: 'https://example.com/research.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-internship',
    name: 'Internship Resources',
    category: 'professional',
    url: 'https://drive.google.com/internship',
    display_order: 20,
    image_url: 'https://example.com/internship.png',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('ResourcesPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (resourcesService.getResources as jest.Mock).mockResolvedValue(mockResources);
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders display title and Top Resources by default', async () => {
    await renderResourcesPage();

    expect(screen.getByText('Resources')).toBeTruthy();
    expect(screen.getByText('Top Resources')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Freshmen FAQs' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Linktree' })).toBeTruthy();
    expect(screen.getByRole('button', { name: "SASE's Gcal" })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'SASE Resume Template' })).toBeTruthy();
  });

  it('has collapsible sections closed by default', async () => {
    await renderResourcesPage();

    // Section headers should exist
    expect(screen.getByRole('button', { name: 'Toggle SASE Resources' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Toggle Academic' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Toggle Professional' })).toBeTruthy();

    // Items inside collapsed sections should NOT be rendered
    expect(screen.queryByRole('button', { name: 'Pi Room Booking' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Board OH' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Research Resources' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Internship Resources' })).toBeNull();
  });

  it('expands and collapses a section when toggled', async () => {
    const user = userEvent.setup();
    await renderResourcesPage();

    const saseHeader = screen.getByRole('button', { name: 'Toggle SASE Resources' });
    expect(saseHeader.props.accessibilityState.expanded).toBe(false);

    // Expand SASE Resources
    await user.press(saseHeader);

    expect(saseHeader.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByRole('button', { name: 'Pi Room Booking' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Board OH' })).toBeTruthy();

    // Collapse SASE Resources again
    await user.press(saseHeader);

    expect(saseHeader.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByRole('button', { name: 'Pi Room Booking' })).toBeNull();
  });

  it('navigates internally when an internal resource like Freshmen FAQs is pressed', async () => {
    const user = userEvent.setup();
    await renderResourcesPage();

    const faqButton = screen.getByRole('button', { name: 'Freshmen FAQs' });
    await user.press(faqButton);

    expect(mockPush).toHaveBeenCalledWith('/resources/freshman-faqs');
  });

  it('opens external URL when an external resource like Linktree is pressed', async () => {
    const user = userEvent.setup();
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(null as any);

    await renderResourcesPage();

    const linktreeButton = screen.getByRole('button', { name: 'Linktree' });
    await user.press(linktreeButton);

    expect(Linking.canOpenURL).toHaveBeenCalledWith('https://linktr.ee/ufsase');
    expect(openURLSpy).toHaveBeenCalledWith('https://linktr.ee/ufsase');
  });

  it('displays error state when fetching fails', async () => {
    (resourcesService.getResources as jest.Mock).mockRejectedValue(new Error('Network error'));

    await renderResourcesPage();

    expect(screen.getByText('Failed to load resources: Network error')).toBeTruthy();
  });
});
