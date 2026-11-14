import React from 'react';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { BackButton } from '@/components/ui/BackButton';
import { ThemeProvider } from '@/context/ThemeContext';

function renderBackButton(props = {}) {
  return render(
    <ThemeProvider>
      <BackButton {...props} />
    </ThemeProvider>,
  );
}

describe('BackButton', () => {
  const mockBack = jest.fn();
  const mockCanGoBack = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      canGoBack: mockCanGoBack,
      replace: mockReplace,
    });
  });

  afterEach(async () => {
    await cleanup();
  });

  it('renders with default accessibility label and role', async () => {
    await renderBackButton();

    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });

  it('renders with custom accessibility label', async () => {
    await renderBackButton({ accessibilityLabel: 'Cancel' });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
  });

  it('calls router.back when canGoBack is true and no custom onPress is provided', async () => {
    mockCanGoBack.mockReturnValue(true);
    const user = userEvent.setup();
    await renderBackButton();

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(mockCanGoBack).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('calls router.replace with fallbackRoute when canGoBack is false', async () => {
    mockCanGoBack.mockReturnValue(false);
    const user = userEvent.setup();
    await renderBackButton({ fallbackRoute: '/(tabs)/events' });

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(mockCanGoBack).toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/events');
  });

  it('calls custom onPress instead of default navigation when provided', async () => {
    const customPress = jest.fn();
    const user = userEvent.setup();
    await renderBackButton({ onPress: customPress });

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(customPress).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('renders onMedia variant without crashing', async () => {
    await renderBackButton({ variant: 'onMedia' });

    expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy();
  });
});
