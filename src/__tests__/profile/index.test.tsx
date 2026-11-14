import { cleanup, render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import ProfilePage from '@/app/profile';
import { ThemeProvider } from '@/context/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import type { ProfileWithPrograms } from '@/types/profiles';

const mockProfile: ProfileWithPrograms = {
  id: 'user-alice',
  full_name: 'Alice Gator',
  username: 'alice',
  role: 'member',
  avatar_url: 'sase-shark',
  majors: ['Computer Science'],
  minors: ['Digital Arts and Sciences'],
  grad_time: '2029',
  discord_handle: 'alice.gator',
  instagram_handle: 'alice.gator',
  linkedin_url: 'https://www.linkedin.com/in/alice-gator',
  bio: 'I enjoy building things with SASE.',
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  programNames: ['SWEET', 'SASEHacks'],
};

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@/context/ProfileContext', () => ({ useProfile: jest.fn() }));

const push = jest.fn();
const back = jest.fn();
const reload = jest.fn();

describe('Profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push, back, canGoBack: () => true });
    (useProfile as jest.Mock).mockReturnValue({
      profile: mockProfile,
      isLoading: false,
      error: null,
      reload,
    });
  });
  afterEach(async () => {
    await cleanup();
  });

  const renderProfile = () =>
    render(
      <ThemeProvider initialMode="light">
        <ProfilePage />
      </ThemeProvider>,
    );

  it('shows the member, current programs, profile details, and bio', async () => {
    await renderProfile();
    expect(screen.getByText('@alice')).toBeTruthy();
    expect(screen.getByText('Member')).toBeTruthy();
    expect(screen.getByText('SWEET | SASEHacks')).toBeTruthy();
    expect(screen.getByText('Alice Gator')).toBeTruthy();
    expect(screen.getByText('Computer Science')).toBeTruthy();
    expect(screen.getByText(mockProfile.bio!)).toBeTruthy();
    expect(screen.getByLabelText("Alice Gator's profile picture")).toBeTruthy();
  });

  it('navigates to edit profile, account settings, and back', async () => {
    const user = userEvent.setup();
    await renderProfile();
    await user.press(screen.getByRole('button', { name: 'Edit profile' }));
    expect(push).toHaveBeenCalledWith('/profile/edit');
    await user.press(screen.getByRole('button', { name: 'Account Settings' }));
    expect(push).toHaveBeenCalledWith('/profile/settings');
    await user.press(screen.getByRole('button', { name: 'Back' }));
    expect(back).toHaveBeenCalled();
  });

  it('handles missing optional details without showing draft placeholder data', async () => {
    (useProfile as jest.Mock).mockReturnValue({
      profile: { ...mockProfile, bio: null, majors: [], programNames: [] },
    });
    await renderProfile();
    expect(screen.getByText('Not set')).toBeTruthy();
    expect(screen.getByText('UF SASE')).toBeTruthy();
    expect(screen.queryByText(mockProfile.bio!)).toBeNull();
  });

  it('shows loading and allows retrying a failed load', async () => {
    (useProfile as jest.Mock).mockReturnValue({ profile: null, isLoading: true });
    const view = await renderProfile();
    expect(screen.getByLabelText('Loading profile')).toBeTruthy();
    (useProfile as jest.Mock).mockReturnValue({
      profile: null,
      isLoading: false,
      error: 'Network unavailable',
      reload,
    });
    await view.rerender(
      <ThemeProvider>
        <ProfilePage />
      </ThemeProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    await userEvent.setup().press(screen.getByRole('button', { name: 'Try again' }));
    expect(reload).toHaveBeenCalled();
  });
});
