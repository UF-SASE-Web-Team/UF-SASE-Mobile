import React from 'react';
import { cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import ProgramDetailScreen from '@/app/programs/[slug]';
import { ThemeProvider } from '@/context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as programsService from '@/services/programs';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/services/programs', () => ({
  ...jest.requireActual('@/services/programs'),
  getProgramBySlug: jest.fn(),
}));

function renderScreen() {
  return render(
    <ThemeProvider>
      <ProgramDetailScreen />
    </ThemeProvider>,
  );
}

describe('ProgramDetailScreen', () => {
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      canGoBack: () => true,
    });
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      slug: 'sase-interns',
      name: 'SASE Interns',
    });
    (programsService.getProgramBySlug as jest.Mock).mockResolvedValue({
      id: 'prog-interns',
      name: 'SASE Interns',
      slug: 'sase-interns',
      description:
        '**SASE Interns** collaborate with other members to execute a project for the SASE community.',
      pocs: [
        {
          id: 'poc-1',
          user_id: 'u-1',
          display_name: 'Lead Coordinator',
          academic_term: 'Fall 2026',
          is_poc: true,
          profile: {
            id: 'u-1',
            full_name: 'Jane Doe',
            avatar_url: null,
          },
        },
      ],
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders back button and program name', async () => {
    await renderScreen();

    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    expect(screen.getAllByText('SASE Interns').length).toBeGreaterThanOrEqual(1);
  });

  it('renders description card and formats bold markdown segments', async () => {
    await renderScreen();

    await waitFor(() => {
      expect(
        screen.getByText(
          /collaborate with other members to execute a project for the SASE community/,
        ),
      ).toBeTruthy();
    });
  });

  it('renders program contacts section when pocs are present', async () => {
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Contacts')).toBeTruthy();
      expect(screen.getByText('Lead Coordinator')).toBeTruthy();
    });
  });

  it('formats slug into title when name param is not passed', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'intramural-sports' });
    (programsService.getProgramBySlug as jest.Mock).mockResolvedValue({
      id: 'prog-intramural',
      slug: 'intramural-sports',
      name: '',
      description: 'Intramural sports at UF',
      pocs: [],
    });
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText('Intramural Sports')).toBeTruthy();
    });
  });

  it('renders loading indicator initially with back button present', async () => {
    (programsService.getProgramBySlug as jest.Mock).mockReturnValue(new Promise(() => {}));
    await renderScreen();

    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    expect(screen.getByLabelText('Loading program details')).toBeTruthy();
  });

  it('renders error state when program is not found while keeping back button visible', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ slug: 'nonexistent-program' });
    (programsService.getProgramBySlug as jest.Mock).mockResolvedValue(null);
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Couldn't load program")).toBeTruthy();
      expect(screen.getByText('Program not found.')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });

  it('renders error state and retries fetching when error occurs', async () => {
    (programsService.getProgramBySlug as jest.Mock).mockRejectedValueOnce(
      new Error('fetch failed: network error'),
    );
    const user = userEvent.setup();
    await renderScreen();

    await waitFor(() => {
      expect(screen.getByText("Couldn't load program")).toBeTruthy();
      expect(
        screen.getByText(
          'Unable to connect to SASE servers. Please check your internet connection and try again.',
        ),
      ).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();

    (programsService.getProgramBySlug as jest.Mock).mockResolvedValueOnce({
      id: 'prog-interns',
      name: 'SASE Interns',
      slug: 'sase-interns',
      description: 'Interns program description',
      pocs: [],
    });

    const retryBtn = screen.getByRole('button', { name: 'Try again' });
    await user.press(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Interns program description')).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    const user = userEvent.setup();
    await renderScreen();

    const backButton = screen.getByRole('button', { name: 'Go back' });
    await user.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  describe('join link', () => {
    const mockProgram = (fields: object) =>
      (programsService.getProgramBySlug as jest.Mock).mockResolvedValue({
        id: 'prog-sports',
        name: 'Sports',
        slug: 'sports',
        description: 'Play intramurals with SASE.',
        pocs: [],
        opens_at: null,
        closes_at: null,
        ...fields,
      });

    it('opens the invite from the Join button', async () => {
      mockProgram({ application_url: 'https://discord.gg/sase' });
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
      const user = userEvent.setup();
      await renderScreen();

      await user.press(await screen.findByRole('button', { name: 'Join Sports' }));
      expect(openURL).toHaveBeenCalledWith('https://discord.gg/sase');
    });

    it('labels application forms as Apply', async () => {
      mockProgram({ application_url: 'https://forms.gle/apply' });
      await renderScreen();
      expect(await screen.findByRole('button', { name: 'Apply to Sports' })).toBeTruthy();
    });

    it('hides the button without a link or outside the application window', async () => {
      mockProgram({ application_url: null });
      await renderScreen();
      await screen.findByText('Play intramurals with SASE.');
      expect(screen.queryByRole('button', { name: /Join|Apply/ })).toBeNull();
      await cleanup();

      mockProgram({
        application_url: 'https://discord.gg/sase',
        closes_at: '2000-01-01T00:00:00Z',
      });
      await renderScreen();
      await screen.findByText('Play intramurals with SASE.');
      expect(screen.queryByRole('button', { name: /Join|Apply/ })).toBeNull();
    });
  });
});
