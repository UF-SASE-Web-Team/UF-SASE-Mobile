import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProgramsPage from '@/app/(tabs)/programs';
import { ThemeProvider } from '@/context/ThemeContext';
import * as programsService from '@/services/programs';
import { ProgramWithPoCs } from '@/types/programs';

jest.mock('@/services/programs', () => ({
  ...jest.requireActual('@/services/programs'),
  getPrograms: jest.fn(),
  getProgramBySlug: jest.fn(),
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderScreen() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <ThemeProvider>
        <ProgramsPage />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

const mockPrograms: ProgramWithPoCs[] = [
  {
    id: 'prog-1',
    name: 'Mentorship Program',
    slug: 'mentorship',
    category: 'community',
    display_order: 1,
    short_description: 'Connect with mentors in STEM.',
    description: 'A full year mentorship program for STEM students.',
    image_url: 'https://example.com/mentorship.png',
    is_active: true,
    application_url: 'https://example.com/apply-mentorship',
    opens_at: new Date(Date.now() - 86400000).toISOString(),
    closes_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: null,
    pocs: [],
  },
  {
    id: 'prog-2',
    name: 'Web Dev Committee',
    slug: 'web-dev',
    category: 'events_and_committees',
    display_order: 2,
    short_description: 'Build web applications for SASE.',
    description: 'Work on real web projects.',
    image_url: null,
    is_active: true,
    application_url: null,
    opens_at: null,
    closes_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: null,
    pocs: [],
  },
];

describe('ProgramsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state and then programs', async () => {
    (programsService.getPrograms as jest.Mock).mockResolvedValue(mockPrograms);

    renderScreen();

    await waitFor(() => {
      expect(screen.getAllByText('Mentorship Program').length).toBe(2);
      expect(screen.getByText('Web Dev Committee')).toBeTruthy();
    });
  });

  it('renders error message when fetch fails', async () => {
    (programsService.getPrograms as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load programs: Network error/)).toBeTruthy();
    });
  });

  it('renders empty state when no programs are returned', async () => {
    (programsService.getPrograms as jest.Mock).mockResolvedValue([]);

    renderScreen();

    await waitFor(() => {
      expect(screen.getByText('No programs found.')).toBeTruthy();
    });
  });
});
