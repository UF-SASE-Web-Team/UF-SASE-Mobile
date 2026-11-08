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

  it('renders back button and category tabs', async () => {
    await renderFreshmanFaqsPage();

    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
    expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
  });

  it('navigates back when back button is pressed', async () => {
    const user = userEvent.setup();
    await renderFreshmanFaqsPage();

    const backButton = screen.getByRole('button', { name: 'Go back' });
    await user.press(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it('selects first category by default with first question expanded', async () => {
    await renderFreshmanFaqsPage();

    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].props.accessibilityState.selected).toBe(true);

    const questions = screen
      .getAllByRole('button')
      .filter((btn) => btn.props.accessibilityState?.expanded !== undefined);

    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].props.accessibilityState.expanded).toBe(true);
  });

  it('switches category when another tab is pressed', async () => {
    const user = userEvent.setup();
    await renderFreshmanFaqsPage();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(1);
    expect(tabs[0].props.accessibilityState.selected).toBe(true);
    expect(tabs[1].props.accessibilityState.selected).toBe(false);

    await user.press(tabs[1]);

    expect(tabs[0].props.accessibilityState.selected).toBe(false);
    expect(tabs[1].props.accessibilityState.selected).toBe(true);
  });

  it('toggles question expansion when tapped', async () => {
    const user = userEvent.setup();
    await renderFreshmanFaqsPage();

    const questions = screen
      .getAllByRole('button')
      .filter((btn) => btn.props.accessibilityState?.expanded !== undefined);

    expect(questions.length).toBeGreaterThan(1);
    const secondQuestion = questions[1];

    // Initially collapsed
    expect(secondQuestion.props.accessibilityState.expanded).toBe(false);

    // Press to expand
    await user.press(secondQuestion);
    expect(secondQuestion.props.accessibilityState.expanded).toBe(true);

    // Press again to collapse
    await user.press(secondQuestion);
    expect(secondQuestion.props.accessibilityState.expanded).toBe(false);
  });
});
