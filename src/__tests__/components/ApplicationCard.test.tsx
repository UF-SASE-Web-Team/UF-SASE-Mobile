import React from 'react';
import { Linking } from 'react-native';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { ApplicationCard } from '@/components/programs/ApplicationCard';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProgramWithPoCs } from '@/types/programs';

describe('ApplicationCard', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  const baseProgram: ProgramWithPoCs = {
    id: 'prog-intramural',
    name: 'Intramural Sports',
    slug: 'intramural-sports',
    category: 'community',
    display_order: 1,
    short_description: 'Join our intramural volleyball, basketball, and soccer teams.',
    description: 'Full description of intramural sports with UF SASE.',
    image_url: 'https://example.com/volleyball.jpg',
    is_active: true,
    application_url: null,
    opens_at: null,
    closes_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parent_id: null,
    pocs: [],
  };

  it('renders apply button and triggers URL when open', async () => {
    const openProgram: ProgramWithPoCs = {
      ...baseProgram,
      application_url: 'https://example.com/apply',
      opens_at: new Date(Date.now() - 86400000).toISOString(),
      closes_at: new Date(Date.now() + 86400000).toISOString(),
    };

    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <ApplicationCard program={openProgram} />
      </ThemeProvider>,
    );

    const applyButton = screen.getByRole('button', { name: 'Apply to Intramural Sports' });
    await user.press(applyButton);

    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/apply');
  });

  it('offers to join, not apply, when the link is a Discord invite', async () => {
    const joinProgram: ProgramWithPoCs = {
      ...baseProgram,
      application_url: 'https://discord.gg/G6bYG6gkd2',
    };

    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <ApplicationCard program={joinProgram} />
      </ThemeProvider>,
    );

    expect(screen.queryByRole('button', { name: /^Apply/ })).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Join Intramural Sports' }));

    expect(Linking.openURL).toHaveBeenCalledWith('https://discord.gg/G6bYG6gkd2');
  });

  it('shows waiting status when applications open in the future', async () => {
    const upcomingProgram: ProgramWithPoCs = {
      ...baseProgram,
      application_url: 'https://example.com/apply',
      opens_at: new Date(Date.now() + 86400000).toISOString(),
      closes_at: new Date(Date.now() + 172800000).toISOString(),
    };

    await render(
      <ThemeProvider>
        <ApplicationCard program={upcomingProgram} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Waiting')).toBeTruthy();
    expect(screen.getByText(/Applications open/)).toBeTruthy();
  });
});
