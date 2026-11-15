import { render, screen, userEvent } from '@testing-library/react-native';
import { DeleteAccountSheet } from '@/components/profile/DeleteAccountSheet';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { deleteAccount } from '@/services/profiles';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/profiles', () => ({
  deleteAccount: jest.fn(),
}));

describe('DeleteAccountSheet', () => {
  const mockSignOut = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });
    (deleteAccount as jest.Mock).mockResolvedValue(undefined);
  });

  const renderSheet = async (visible = true) =>
    await render(
      <ThemeProvider>
        <DeleteAccountSheet visible={visible} onClose={mockOnClose} />
      </ThemeProvider>,
    );

  it('renders modal content with explanation and disabled delete button', async () => {
    await renderSheet();

    expect(screen.getByRole('header', { name: 'Delete Account' })).toBeTruthy();
    expect(
      screen.getByText(/permanently delete your account, event attendance, and profile data/i),
    ).toBeTruthy();

    const deleteButton = screen.getByRole('button', { name: 'Delete Account' });
    expect(deleteButton).toBeDisabled();
  });

  it('enables the delete button only when typing "confirm" (case-insensitive)', async () => {
    const user = userEvent.setup();
    await renderSheet();

    const input = screen.getByPlaceholderText('confirm');
    const deleteButton = screen.getByRole('button', { name: 'Delete Account' });

    // Incomplete or wrong string
    await user.type(input, 'delete');
    expect(deleteButton).toBeDisabled();

    // Uppercase CONFIRM
    await user.clear(input);
    await user.type(input, 'CONFIRM');
    expect(deleteButton).toBeEnabled();

    // Lowercase confirm
    await user.clear(input);
    await user.type(input, 'confirm');
    expect(deleteButton).toBeEnabled();
  });

  it('calls deleteAccount, signOut, and onClose on successful deletion', async () => {
    const user = userEvent.setup();
    await renderSheet();

    await user.type(screen.getByPlaceholderText('confirm'), 'confirm');
    await user.press(screen.getByRole('button', { name: 'Delete Account' }));

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays error and does not sign out if deleteAccount fails', async () => {
    (deleteAccount as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));
    const user = userEvent.setup();
    await renderSheet();

    await user.type(screen.getByPlaceholderText('confirm'), 'confirm');
    await user.press(screen.getByRole('button', { name: 'Delete Account' }));

    expect(deleteAccount).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Network failure')).toBeTruthy();
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel button is pressed', async () => {
    const user = userEvent.setup();
    await renderSheet();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
