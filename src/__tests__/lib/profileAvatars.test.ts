import {
  getProfileAvatarSource,
  isProfileAvatarPreset,
  profileAvatars,
} from '@/lib/profileAvatars';

describe('profileAvatars', () => {
  describe('isProfileAvatarPreset', () => {
    it('returns true for known mascot preset IDs', () => {
      for (const mascot of profileAvatars) {
        expect(isProfileAvatarPreset(mascot.id)).toBe(true);
      }
    });

    it('returns false for remote URLs or custom strings', () => {
      expect(isProfileAvatarPreset('https://example.com/avatar.png')).toBe(false);
      expect(isProfileAvatarPreset('custom-mascot')).toBe(false);
    });

    it('returns false for null, undefined, or empty string', () => {
      expect(isProfileAvatarPreset(null)).toBe(false);
      expect(isProfileAvatarPreset(undefined)).toBe(false);
      expect(isProfileAvatarPreset('')).toBe(false);
    });
  });

  describe('getProfileAvatarSource', () => {
    it('returns the bundled asset source for a known preset', () => {
      expect(getProfileAvatarSource('sase-shark')).toEqual(profileAvatars[0].source);
      expect(getProfileAvatarSource('sase-cat')).toEqual(profileAvatars[1].source);
    });

    it('returns a uri source object for a remote avatar URL', () => {
      const url = 'https://example.com/photo.jpg';
      expect(getProfileAvatarSource(url)).toEqual({ uri: url });
    });

    it('defaults to sase-shark when avatar is null or undefined', () => {
      expect(getProfileAvatarSource(null)).toEqual(profileAvatars[0].source);
      expect(getProfileAvatarSource(undefined)).toEqual(profileAvatars[0].source);
    });
  });
});
