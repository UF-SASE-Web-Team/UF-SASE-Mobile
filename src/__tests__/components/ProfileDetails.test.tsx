import { render, screen, userEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ProfileDetails } from '@/components/profile/ProfileDetails';
import { ThemeProvider } from '@/context/ThemeContext';
import type { Profile } from '@/types/profiles';

const mockProfile: Profile = {
  id: 'user-alice',
  full_name: 'Alice Gator',
  pronouns: null,
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
};

describe('ProfileDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderDetails = async (profile: Profile = mockProfile) =>
    await render(
      <ThemeProvider initialMode="light">
        <ProfileDetails profile={profile} />
      </ThemeProvider>,
    );

  it('renders academic details, bio, and social labels', async () => {
    await renderDetails();
    expect(screen.getByText('Alice Gator')).toBeTruthy();
    expect(screen.getByText('Computer Science')).toBeTruthy();
    expect(screen.getByText('Digital Arts and Sciences')).toBeTruthy();
    expect(screen.getByText('2029')).toBeTruthy();
    expect(screen.getByText('I enjoy building things with SASE.')).toBeTruthy();
    expect(screen.getByText('Discord:')).toBeTruthy();
    expect(screen.getByText('Instagram:')).toBeTruthy();
    expect(screen.getByText('LinkedIn:')).toBeTruthy();
  });

  it('copies Discord handle to clipboard without altering display text', async () => {
    const setStringSpy = jest.spyOn(Clipboard, 'setStringAsync').mockResolvedValue(true);
    await renderDetails();

    const copyBtn = screen.getByLabelText(/Copy Discord handle alice\.gator/i);
    expect(copyBtn).toBeTruthy();

    const user = userEvent.setup();
    await user.press(copyBtn);

    expect(setStringSpy).toHaveBeenCalledWith('alice.gator');
    expect(screen.queryByText('Copied!')).toBeNull();
    expect(screen.getAllByText('alice.gator')).toHaveLength(2);
  });

  it('opens Instagram profile URL when tapped', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

    await renderDetails();

    const user = userEvent.setup();
    const igLink = screen.getByLabelText(/Open Instagram profile alice\.gator/i);
    expect(igLink).toBeTruthy();

    await user.press(igLink);

    expect(canOpenSpy).toHaveBeenCalledWith('https://www.instagram.com/alice.gator');
    expect(openURLSpy).toHaveBeenCalledWith('https://www.instagram.com/alice.gator');
  });

  it('strips leading @ symbol when opening Instagram profile', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

    await renderDetails({
      ...mockProfile,
      instagram_handle: '@gator_nation',
    });

    const user = userEvent.setup();
    const igLink = screen.getByLabelText(/Open Instagram profile @gator_nation/i);
    await user.press(igLink);

    expect(canOpenSpy).toHaveBeenCalledWith('https://www.instagram.com/gator_nation');
    expect(openURLSpy).toHaveBeenCalledWith('https://www.instagram.com/gator_nation');
  });

  it('opens normalized LinkedIn URL when tapped', async () => {
    const canOpenSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);

    await renderDetails({
      ...mockProfile,
      linkedin_url: 'alice-slug',
    });

    const user = userEvent.setup();
    const linkedInLink = screen.getByLabelText(/Open LinkedIn profile/i);
    expect(linkedInLink).toBeTruthy();
    expect(screen.getByText('in/alice-slug')).toBeTruthy();

    await user.press(linkedInLink);

    expect(canOpenSpy).toHaveBeenCalledWith('https://www.linkedin.com/in/alice-slug');
    expect(openURLSpy).toHaveBeenCalledWith('https://www.linkedin.com/in/alice-slug');
  });

  it('displays LinkedIn social field as in/<username>', async () => {
    await renderDetails({
      ...mockProfile,
      linkedin_url: 'https://www.linkedin.com/in/john-doe?utm_source=share',
    });
    expect(screen.getByText('in/john-doe')).toBeTruthy();
  });

  it('shows Not set for unset social fields and does not make them buttons', async () => {
    await renderDetails({
      ...mockProfile,
      discord_handle: null,
      instagram_handle: null,
      linkedin_url: null,
    });

    const notSetElements = screen.getAllByText('Not set');
    expect(notSetElements.length).toBeGreaterThanOrEqual(3);

    expect(screen.queryByLabelText(/Copy Discord handle/i)).toBeNull();
    expect(screen.queryByLabelText(/Open Instagram profile/i)).toBeNull();
    expect(screen.queryByLabelText(/Open LinkedIn profile/i)).toBeNull();
  });
});
