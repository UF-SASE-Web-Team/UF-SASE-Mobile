import React from 'react';
import { render, screen, userEvent, cleanup } from '@testing-library/react-native';
import { ProgramCard } from '@/components/programs/ProgramCard';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProgramWithPoCs } from '@/types/programs';

describe('ProgramCard', () => {
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

  it('renders the program name and handles press', async () => {
    const onPressMock = jest.fn();
    const user = userEvent.setup();

    await render(
      <ThemeProvider>
        <ProgramCard program={baseProgram} onPress={onPressMock} />
      </ThemeProvider>,
    );

    const card = screen.getByRole('button', { name: 'Intramural Sports' });
    expect(card).toBeTruthy();
    expect(screen.getByText('Intramural Sports')).toBeTruthy();

    await user.press(card);
    expect(onPressMock).toHaveBeenCalledWith(baseProgram);
  });

  it('renders image banner with accessible label', async () => {
    await render(
      <ThemeProvider>
        <ProgramCard program={baseProgram} />
      </ThemeProvider>,
    );

    expect(screen.getByLabelText('Intramural Sports banner')).toBeTruthy();
  });

  it('renders fallback icon without crashing when image is missing', async () => {
    const programNoImage: ProgramWithPoCs = {
      ...baseProgram,
      image_url: null,
    };

    await render(
      <ThemeProvider>
        <ProgramCard program={programNoImage} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Intramural Sports')).toBeTruthy();
    expect(screen.queryByRole('image')).toBeNull();
  });
});
