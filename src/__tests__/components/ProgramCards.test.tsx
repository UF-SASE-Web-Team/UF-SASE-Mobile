import React from 'react';
import { Linking } from 'react-native';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { StandardProgramCard, ApplicationProgramCard } from '@/components/ProgramCards';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProgramWithPoCs } from '@/types/programs';

describe('ProgramCards', () => {
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

  describe('StandardProgramCard', () => {
    it('renders the program name and handles press', async () => {
      const onPressMock = jest.fn();
      const user = userEvent.setup();

      await render(
        <ThemeProvider>
          <StandardProgramCard program={baseProgram} onPress={onPressMock} />
        </ThemeProvider>,
      );

      const card = screen.getByRole('button', { name: 'Intramural Sports' });
      expect(card).toBeTruthy();

      await user.press(card);
      expect(onPressMock).toHaveBeenCalledWith(baseProgram);
    });

    it('does not render description text or "Read More" button', async () => {
      await render(
        <ThemeProvider>
          <StandardProgramCard program={baseProgram} />
        </ThemeProvider>,
      );

      expect(screen.queryByText(/Join our intramural/i)).toBeNull();
      expect(screen.queryByText(/Read More/i)).toBeNull();
    });

    it('renders without an image_url gracefully using placeholder', async () => {
      const programNoImage: ProgramWithPoCs = {
        ...baseProgram,
        image_url: null,
      };

      await render(
        <ThemeProvider>
          <StandardProgramCard program={programNoImage} />
        </ThemeProvider>,
      );

      expect(screen.getByText('Intramural Sports')).toBeTruthy();
      expect(screen.queryByRole('image')).toBeNull();
    });
  });

  describe('ApplicationProgramCard', () => {
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
          <ApplicationProgramCard program={openProgram} />
        </ThemeProvider>,
      );

      const applyButton = screen.getByRole('button', { name: 'Apply to Intramural Sports' });
      await user.press(applyButton);

      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/apply');
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
          <ApplicationProgramCard program={upcomingProgram} />
        </ThemeProvider>,
      );

      expect(screen.getByText('Waiting')).toBeTruthy();
      expect(screen.getByText(/Applications open/)).toBeTruthy();
    });
  });
});
