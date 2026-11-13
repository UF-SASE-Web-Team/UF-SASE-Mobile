import { act, cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import EditProfilePage from '@/app/profile/edit';
import { ThemeProvider } from '@/context/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import { profileFixture } from '@/test-utils/profile';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router/react-navigation', () => ({ usePreventRemove: jest.fn() }));
jest.mock('@/context/ProfileContext', () => ({
  ...jest.requireActual('@/context/ProfileContext'),
  useProfile: jest.fn(),
}));

describe('Edit profile', () => {
  const save = jest.fn();
  const back = jest.fn();
  const dispatch = jest.fn();
  const alertSpy = jest.spyOn(Alert, 'alert');
  const renderEditor = () =>
    render(
      <ThemeProvider initialMode="light">
        <EditProfilePage />
      </ThemeProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    save.mockResolvedValue(undefined);
    (useRouter as jest.Mock).mockReturnValue({ back, canGoBack: () => true });
    (useNavigation as jest.Mock).mockReturnValue({ dispatch });
    (useProfile as jest.Mock).mockReturnValue({ profile: profileFixture, ufid: '12345678', save });
  });
  afterEach(async () => {
    await cleanup();
  });

  it('saves edited fields and returns after success', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.clear(screen.getByLabelText('Full Name'));
    await user.type(screen.getByLabelText('Full Name'), '  Alice Updated  ');
    await user.clear(screen.getByLabelText('Bio'));
    await user.type(screen.getByLabelText('Bio'), 'A new introduction.');
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Alice Updated', bio: 'A new introduction.' }),
    );
    await waitFor(() => expect(back).toHaveBeenCalled());
  });

  it('clears an input field when the clear icon is pressed', async () => {
    const user = userEvent.setup();
    await renderEditor();
    expect(screen.getByLabelText('Full Name')).toHaveDisplayValue(profileFixture.full_name);
    await user.press(screen.getByLabelText('Clear full name'));
    expect(screen.getByLabelText('Full Name')).toHaveDisplayValue('');
  });

  it('selects a mascot and a new academic value before saving', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.press(screen.getByRole('button', { name: 'Change profile picture' }));
    await user.press(screen.getByRole('radio', { name: 'SASE Cat' }));
    await user.press(screen.getByRole('button', { name: 'Major' }));
    await user.press(screen.getByRole('checkbox', { name: 'Mechanical Engineering' }));
    await user.press(screen.getByRole('button', { name: 'Done' }));
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        avatar_url: 'sase-cat',
        majors: ['Computer Science', 'Mechanical Engineering'],
      }),
    );
  });

  it('removes a selected minor and adds a custom one through Other', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.press(screen.getByRole('button', { name: 'Minor' }));
    await user.press(screen.getByRole('checkbox', { name: 'Digital Arts and Sciences' }));
    await user.press(screen.getByRole('button', { name: 'Other' }));
    await user.type(screen.getByLabelText('Enter your minor'), ' Linguistics ');
    await user.press(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('checkbox', { name: 'Linguistics' })).toBeChecked();
    await user.press(screen.getByRole('button', { name: 'Done' }));
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ minors: ['Linguistics'] }));
  });

  it('stops accepting majors once the limit is reached', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.press(screen.getByRole('button', { name: 'Major' }));
    await user.press(screen.getByRole('checkbox', { name: 'Mechanical Engineering' }));
    await user.press(screen.getByRole('checkbox', { name: 'Electrical Engineering' }));
    expect(screen.getByRole('checkbox', { name: 'Computer Engineering' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Other' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Electrical Engineering' })).toBeEnabled();
  });

  it('rejects blank names and invalid LinkedIn URLs', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.clear(screen.getByLabelText('Full Name'));
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your name.');
    await user.type(screen.getByLabelText('Full Name'), 'Alice');
    await user.clear(screen.getByLabelText('LinkedIn'));
    await user.type(screen.getByLabelText('LinkedIn'), 'https://linkedin.com.example.com/alice');
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid LinkedIn URL/);
    expect(save).not.toHaveBeenCalled();
  });

  it('saves a changed UFID and leaves an untouched one out of the save', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.type(screen.getByLabelText('Full Name'), ' Jr');
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(save.mock.calls[0][0]).not.toHaveProperty('ufid');

    await user.clear(screen.getByLabelText('UFID'));
    await user.type(screen.getByLabelText('UFID'), '8765-4321');
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ ufid: '87654321' }));
  });

  it('rejects an incomplete UFID', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.clear(screen.getByLabelText('UFID'));
    await user.type(screen.getByLabelText('UFID'), '1234');
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it('preserves entered changes if saving fails', async () => {
    save.mockRejectedValueOnce(new Error('Connection lost'));
    const user = userEvent.setup();
    await renderEditor();
    await user.type(screen.getByLabelText('Full Name'), ' Jr');
    await user.press(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Connection lost');
    expect(screen.getByLabelText('Full Name')).toHaveDisplayValue('Alice Gator Jr');
    expect(back).not.toHaveBeenCalled();
  });

  it('protects unsaved edits when navigating back', async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.type(screen.getByLabelText('Full Name'), ' Jr');
    const guardCalls = (usePreventRemove as jest.Mock).mock.calls;
    const [prevented, handler] = guardCalls[guardCalls.length - 1];
    expect(prevented).toBe(true);
    const action = { type: 'GO_BACK' };
    await act(() => handler({ data: { action } }));
    expect(dispatch).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2];
    await act(() => buttons?.find((button) => button.text === 'Discard')?.onPress?.());
    expect(dispatch).toHaveBeenCalledWith(action);
    expect(save).not.toHaveBeenCalled();
  });
});
