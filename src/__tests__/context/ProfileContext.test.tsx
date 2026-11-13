import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { getProfile, getUfid, saveUfid, updateProfile } from '@/services/profiles';
import { profileFixture } from '@/test-utils/profile';

jest.mock('@/services/profiles');

function ProfileConsumer() {
  const { profile, error, isLoading, reload, save, onboarding } = useProfile();
  return (
    <View>
      <Text testID="onboarding">{onboarding}</Text>
      <Button title="Set UFID" onPress={() => save({ ufid: '12345678' })} />
      <Text>{isLoading ? 'Loading profile' : (profile?.full_name ?? error ?? 'No profile')}</Text>
      <Text>{profile?.programNames.join(' | ')}</Text>
      <Button title="Retry" onPress={reload} />
      <Button title="Rename" onPress={() => save({ full_name: 'Alice Updated' })} />
    </View>
  );
}

describe('Profile data shared across the profile flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { id: profileFixture.id } });
    (getProfile as jest.Mock).mockResolvedValue(profileFixture);
    (getUfid as jest.Mock).mockResolvedValue('12345678');
    (saveUfid as jest.Mock).mockImplementation(async (_userId: string, ufid: string) => ufid);
  });
  afterEach(async () => {
    await cleanup();
  });

  it('loads and propagates a saved profile without losing current memberships', async () => {
    (updateProfile as jest.Mock).mockResolvedValue({
      ...profileFixture,
      full_name: 'Alice Updated',
    });
    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    expect(await screen.findByText('Alice Gator')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Rename' }));
    expect(await screen.findByText('Alice Updated')).toBeTruthy();
    expect(screen.getByText('SWEET | SASEHacks')).toBeTruthy();
    expect(updateProfile).toHaveBeenCalledWith(profileFixture.id, { full_name: 'Alice Updated' });
    expect(getProfile).toHaveBeenCalledTimes(1);
  });

  it('requires onboarding until the member saves a UFID', async () => {
    (getUfid as jest.Mock).mockResolvedValue(null);
    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    await screen.findByText('Alice Gator');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('required');
    await userEvent.setup().press(screen.getByRole('button', { name: 'Set UFID' }));
    expect(saveUfid).toHaveBeenCalledWith(profileFixture.id, '12345678');
    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.getByTestId('onboarding')).toHaveTextContent('complete');
  });

  it('treats a member with a UFID as onboarded, even across reloads', async () => {
    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    await screen.findByText('Alice Gator');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('complete');
    (getProfile as jest.Mock).mockReturnValue(new Promise(() => {}));
    await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('Loading profile')).toBeTruthy();
    expect(screen.getByTestId('onboarding')).toHaveTextContent('complete');
  });

  it('does not lock members out when the profile fails to load', async () => {
    (getProfile as jest.Mock).mockRejectedValueOnce(new Error('Network unavailable'));
    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    await screen.findByText('Network unavailable');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('complete');
  });

  it('can retry a failed request', async () => {
    (getProfile as jest.Mock).mockRejectedValueOnce(new Error('Network unavailable'));
    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    expect(await screen.findByText('Network unavailable')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Alice Gator')).toBeTruthy();
  });

  it('clears profile data when the signed-in user changes', async () => {
    const view = await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    expect(await screen.findByText('Alice Gator')).toBeTruthy();
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    await view.rerender(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );
    expect(screen.queryByText('Alice Gator')).toBeNull();
    expect(screen.getByText('No profile')).toBeTruthy();
  });

  it('signs out automatically when the user profile is missing (database reset / PGRST116)', async () => {
    const mockSignOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: profileFixture.id },
      signOut: mockSignOut,
    });
    (getProfile as jest.Mock).mockRejectedValueOnce({
      code: 'PGRST116',
      message: 'JSON object requested, multiple (or no) rows returned',
    });

    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('signs out automatically when the session token is rejected (PGRST301 or 401)', async () => {
    const mockSignOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: profileFixture.id },
      signOut: mockSignOut,
    });
    (getProfile as jest.Mock).mockRejectedValueOnce({
      code: 'PGRST301',
      status: 401,
      message: 'JWT expired',
    });

    await render(
      <ProfileProvider>
        <ProfileConsumer />
      </ProfileProvider>,
    );

    expect(mockSignOut).toHaveBeenCalled();
  });
});
