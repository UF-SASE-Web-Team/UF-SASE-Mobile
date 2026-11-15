import React from 'react';
import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { CloseButton } from '@/components/ui/CloseButton';
import { ThemeProvider } from '@/context/ThemeContext';

function renderCloseButton(props = {}) {
  return render(
    <ThemeProvider>
      <CloseButton {...props} />
    </ThemeProvider>,
  );
}

describe('CloseButton', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('renders with default accessibility label and role', async () => {
    await renderCloseButton();

    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('renders with custom accessibility label', async () => {
    await renderCloseButton({ accessibilityLabel: 'Dismiss modal' });

    expect(screen.getByRole('button', { name: 'Dismiss modal' })).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const handlePress = jest.fn();
    const user = userEvent.setup();
    await renderCloseButton({ onPress: handlePress });

    await user.press(screen.getByRole('button', { name: 'Close' }));

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressed', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    await renderCloseButton({ onClose: handleClose });

    await user.press(screen.getByRole('button', { name: 'Close' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not call handler when disabled', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();
    await renderCloseButton({ onClose: handleClose, disabled: true });

    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toBeDisabled();

    await user.press(button);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders onMedia variant without crashing', async () => {
    await renderCloseButton({ variant: 'onMedia' });

    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });
});
