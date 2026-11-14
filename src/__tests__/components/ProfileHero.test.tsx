import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { ThemeProvider } from '@/context/ThemeContext';
import { profileFixture } from '@/test-utils/profile';
import type { ProfileWithPrograms } from '@/types/profiles';

describe('ProfileHero', () => {
  const renderHero = async (profile: ProfileWithPrograms, onEditAvatar?: () => void) =>
    await render(
      <ThemeProvider initialMode="light">
        <ProfileHero profile={profile} onEditAvatar={onEditAvatar} />
      </ThemeProvider>,
    );

  it('uses contain contentFit and fixed dimensions for preset mascots', async () => {
    await renderHero({ ...profileFixture, avatar_url: 'sase-cat' });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('contain');
    expect(image.props.style).toEqual(expect.objectContaining({ width: 123, height: 123 }));
  });

  it('uses cover contentFit and full width/height for non-preset URLs', async () => {
    const customUrl = 'https://example.com/custom-avatar.webp';
    await renderHero({ ...profileFixture, avatar_url: customUrl });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('cover');
    expect(image.props.style).toEqual(expect.objectContaining({ width: '100%', height: '100%' }));
  });

  it('defaults to contain and fixed dimensions when avatar_url is null', async () => {
    await renderHero({ ...profileFixture, avatar_url: null });
    const image = screen.getByLabelText("Alice Gator's profile picture");
    expect(image.props.contentFit).toBe('contain');
    expect(image.props.style).toEqual(expect.objectContaining({ width: 123, height: 123 }));
  });

  it('falls back to contain and fixed dimensions if remote image loading fails', async () => {
    const customUrl = 'https://example.com/broken-avatar.png';
    await renderHero({ ...profileFixture, avatar_url: customUrl });
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
