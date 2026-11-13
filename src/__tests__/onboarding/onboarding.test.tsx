import { cleanup, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import OnboardingPage from '@/app/onboarding';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import { saveUfid, updateProfile } from '@/services/profiles';
import { profileFixture } from '@/test-utils/profile';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@/services/profiles');
jest.mock('@/context/ProfileContext', () => ({
  ...jest.requireActual('@/context/ProfileContext'),
  useProfile: jest.fn(),
}));

describe('Onboarding', () => {
  const save = jest.fn();
  const signOut = jest.fn();
  const renderOnboarding = () =>
    render(
      <ThemeProvider initialMode="light">
        <OnboardingPage />
      </ThemeProvider>,
    );
  const completeRequiredStep = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText('UFID'), '12345678');
    await user.press(screen.getByRole('button', { name: 'Continue' }));
    return screen.findByRole('button', { name: 'Finish' });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    save.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
    (saveUfid as jest.Mock).mockResolvedValue('12345678');
    (updateProfile as jest.Mock).mockResolvedValue(profileFixture);
    (useAuth as jest.Mock).mockReturnValue({ user: { id: profileFixture.id }, signOut });
    (useProfile as jest.Mock).mockReturnValue({ profile: profileFixture, ufid: null, save });
  });
  afterEach(async () => {
    await cleanup();
  });

  it('starts from the name given at sign-up', async () => {
    await renderOnboarding();
    expect(screen.getByLabelText('Full name')).toHaveDisplayValue(profileFixture.full_name);
  });

  it('requires a full name and an 8-digit UFID before continuing', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await user.clear(screen.getByLabelText('Full name'));
    await user.type(screen.getByLabelText('UFID'), '1234');
    await user.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Full name').props['aria-invalid']).toBe(true);
    expect(screen.getByLabelText('UFID').props['aria-invalid']).toBe(true);
    expect(saveUfid).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
  });

  it('keeps only the digits of a typed UFID', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await user.type(screen.getByLabelText('UFID'), '1234-5678');
    expect(screen.getByLabelText('UFID')).toHaveDisplayValue('12345678');
  });

  it('stays on the required step when the UFID is rejected', async () => {
    (saveUfid as jest.Mock).mockRejectedValueOnce(new Error('UFID in use'));
    const user = userEvent.setup();
    await renderOnboarding();
    await user.type(screen.getByLabelText('UFID'), '12345678');
    await user.press(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('UFID in use');
    expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
    expect(updateProfile).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('saves the required details on continue, before finish or skip', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await completeRequiredStep(user);
    expect(saveUfid).toHaveBeenCalledWith(profileFixture.id, '12345678');
    expect(updateProfile).toHaveBeenCalledWith(profileFixture.id, {
      full_name: profileFixture.full_name,
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('saves the required and optional details on finish', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await completeRequiredStep(user);
    expect(saveUfid).toHaveBeenCalledWith(profileFixture.id, '12345678');
    await user.clear(screen.getByLabelText('Bio'));
    await user.type(screen.getByLabelText('Bio'), 'Hello SASE');
    await user.press(screen.getByRole('button', { name: 'Finish' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: profileFixture.full_name,
          ufid: '12345678',
          bio: 'Hello SASE',
        }),
      ),
    );
  });

  it('saves only the required details when personalization is skipped', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await completeRequiredStep(user);
    await user.clear(screen.getByLabelText('Bio'));
    await user.type(screen.getByLabelText('Bio'), 'Discarded');
    await user.press(screen.getByRole('button', { name: 'Skip for now' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({ full_name: profileFixture.full_name, ufid: '12345678' }),
    );
  });

  it('enters the app without the optional details when personalization is closed', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await completeRequiredStep(user);
    await user.clear(screen.getByLabelText('Bio'));
    await user.type(screen.getByLabelText('Bio'), 'Discarded');
    await user.press(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({ full_name: profileFixture.full_name, ufid: '12345678' }),
    );
  });

  it('does not ask for the required fields again while personalizing', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await completeRequiredStep(user);
    expect(screen.queryByLabelText('UFID')).toBeNull();
    expect(screen.queryByLabelText('Full Name')).toBeNull();
  });

  it('lets a member log out instead of onboarding', async () => {
    const user = userEvent.setup();
    await renderOnboarding();
    await user.press(screen.getByRole('button', { name: 'Log Out' }));
    expect(signOut).toHaveBeenCalled();
  });

  it('shows a loading state until the profile is available', async () => {
    (useProfile as jest.Mock).mockReturnValue({ profile: null, ufid: null, save });
    await renderOnboarding();
    expect(screen.getByLabelText('Loading profile')).toBeTruthy();
    expect(screen.queryByLabelText('UFID')).toBeNull();
  });
});
