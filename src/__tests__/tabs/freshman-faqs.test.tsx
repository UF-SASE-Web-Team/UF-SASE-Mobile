import React from 'react';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import FreshmanFaqsPage from '@/app/resources/freshman-faqs';
import { ThemeProvider } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';

function renderFreshmanFaqsPage() {
  return render(
    <ThemeProvider>
      <FreshmanFaqsPage />
    </ThemeProvider>,
  );
}

describe('FreshmanFaqsPage', () => {
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders page title and back button', async () => {
    await renderFreshmanFaqsPage();

    expect(screen.getByText('Freshmen FAQS')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });

  it('navigates back when back button is pressed', async () => {
    const user = userEvent.setup();
    await renderFreshmanFaqsPage();

    const backButton = screen.getByRole('button', { name: 'Go back' });
    await user.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('displays Academic category by default with first question expanded', async () => {
    await renderFreshmanFaqsPage();

    // Academic tab should be selected
    const academicTab = screen.getByRole('tab', { name: 'Academic' });
    expect(academicTab.props.accessibilityState.selected).toBe(true);

    // Category heading should show Academic
    expect(screen.getByText('Academic')).toBeTruthy();

    // First academic question should be visible
    expect(
      screen.getByRole('button', {
        name: 'How do I find study groups for STEM classes?',
      }),
    ).toBeTruthy();

    // First question answer should be expanded
    expect(
      screen.getByText(
        'SASE hosts regular Study Hours throughout the semester and maintains the Class Connector sheet where you can connect with peers taking the same engineering, science, and math courses.',
      ),
    ).toBeTruthy();
  });

  it('switches category when another tab is pressed', async () => {
    const user = userEvent.setup();
    await renderFreshmanFaqsPage();

    const profTab = screen.getByRole('tab', { name: 'Professional' });
    await user.press(profTab);

    expect(profTab.props.accessibilityState.selected).toBe(true);
    expect(screen.getByText('Professional')).toBeTruthy();

    // Professional question should be visible
    expect(screen.getByRole('button', { name: 'What is the SASE Resume Template?' })).toBeTruthy();
  });

  it('toggles question expansion when tapped', async () => {
    const user = userEvent.setup();
    await renderFreshmanFaqsPage();

    const questionButton = screen.getByRole('button', {
      name: 'Where is the SASE Pi Room / Marston study room?',
    });

    // Initially collapsed
    expect(questionButton.props.accessibilityState.expanded).toBe(false);
    expect(
      screen.queryByText(
        'The Pi Room is located in the Marston Science Library. SASE members can reserve it for study sessions and group projects using the Pi Room Booking link in Resources.',
      ),
    ).toBeNull();

    // Press to expand
    await user.press(questionButton);

    expect(questionButton.props.accessibilityState.expanded).toBe(true);
    expect(
      screen.getByText(
        'The Pi Room is located in the Marston Science Library. SASE members can reserve it for study sessions and group projects using the Pi Room Booking link in Resources.',
      ),
    ).toBeTruthy();

    // Press again to collapse
    await user.press(questionButton);

    expect(questionButton.props.accessibilityState.expanded).toBe(false);
    expect(
      screen.queryByText(
        'The Pi Room is located in the Marston Science Library. SASE members can reserve it for study sessions and group projects using the Pi Room Booking link in Resources.',
      ),
    ).toBeNull();
  });
});
