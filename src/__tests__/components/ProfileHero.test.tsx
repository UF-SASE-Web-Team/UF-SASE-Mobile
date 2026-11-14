import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ThemeProvider } from '@/context/ThemeContext';
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

describe('ProfileHero', () => {
  const renderHero = async (profile: ProfileWithPrograms, onEditAvatar?: () => void) =>
    await render(
      <ThemeProvider initialMode="light">
        <ProfileHero profile={profile} onEditAvatar={onEditAvatar} />
      </ThemeProvider>,
    );

  it('uses contain contentFit and fixed dimensions for preset mascots', async () => {
    await renderHero({ ...mockProfile, avatar_url: 'sase-cat' });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('contain');
    expect(image.props.style).toEqual(expect.objectContaining({ width: 123, height: 123 }));
  });

  it('uses cover contentFit and full width/height for non-preset URLs', async () => {
    const customUrl = 'https://example.com/custom-avatar.webp';
    await renderHero({ ...mockProfile, avatar_url: customUrl });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('cover');
    expect(image.props.style).toEqual(expect.objectContaining({ width: '100%', height: '100%' }));
  });

  it('defaults to contain and fixed dimensions when avatar_url is null', async () => {
    await renderHero({ ...mockProfile, avatar_url: null });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('contain');
    expect(image.props.style).toEqual(expect.objectContaining({ width: 123, height: 123 }));
  });

  it('falls back to contain and fixed dimensions if remote image loading fails', async () => {
    const customUrl = 'https://example.com/broken-avatar.png';
    await renderHero({ ...mockProfile, avatar_url: customUrl });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('cover');

    // Trigger onError
    fireEvent(image, 'error', { nativeEvent: { error: 'Failed to load' } });

    await waitFor(() => {
      const updatedImage = screen.getByLabelText("Alice Gator's profile picture");
      expect(updatedImage.props.contentFit).toBe('contain');
      expect(updatedImage.props.style).toEqual(
        expect.objectContaining({ width: 123, height: 123 }),
      );
    });
  });
});
