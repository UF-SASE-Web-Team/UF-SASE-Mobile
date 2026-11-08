import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { getProfile, updateProfile } from '@/services/profiles';
import { profileFixture } from '@/test-utils/profile';

jest.mock('@/services/profiles');

function ProfileConsumer() {
  const { profile, error, isLoading, reload, save } = useProfile();
  return (
    <View>
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
});
