import React from 'react';
import { View } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Text } from '@/components/ui/Text';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function renderSheet(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>);
}

describe('ModalSheet', () => {
  it('renders title and children when visible', async () => {
    await renderSheet(
      <ModalSheet title="Test Sheet" visible onClose={jest.fn()}>
        <View testID="sheet-content">
          <Text variant="body">Sheet body content</Text>
        </View>
      </ModalSheet>,
    );

    expect(screen.getByRole('header')).toHaveTextContent('Test Sheet');
    expect(screen.getByTestId('sheet-content')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    await renderSheet(
      <ModalSheet title="Test Sheet" visible onClose={handleClose}>
        <Text variant="body">Content</Text>
      </ModalSheet>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close Test Sheet' });
    await user.press(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when scrim is pressed', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    await renderSheet(
      <ModalSheet title="Test Sheet" visible onClose={handleClose}>
        <Text variant="body">Content</Text>
      </ModalSheet>,
    );

    const scrim = screen.getByTestId('modal-sheet-scrim', { includeHiddenElements: true });
    await user.press(scrim);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables close button and scrim when busy is true', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    await renderSheet(
      <ModalSheet title="Test Sheet" visible onClose={handleClose} busy>
        <Text variant="body">Content</Text>
      </ModalSheet>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close Test Sheet' });
    const scrim = screen.getByTestId('modal-sheet-scrim', { includeHiddenElements: true });

    expect(closeButton).toBeDisabled();
    expect(scrim).toBeDisabled();

    await user.press(closeButton);
    expect(handleClose).not.toHaveBeenCalled();

    await user.press(scrim);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
