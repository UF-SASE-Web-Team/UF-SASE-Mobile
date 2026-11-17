export const profileAvatars = [
  {
    id: 'sase-shark',
    label: 'SASE Shark',
    source: require('@/assets/avatars/sase-shark.webp'),
  },
  {
    id: 'sase-cat',
    label: 'SASE Cat',
    source: require('@/assets/avatars/sase-cat.webp'),
  },
  {
    id: 'saseski',
    label: 'SASEski',
    source: require('@/assets/avatars/saseski.webp'),
  },
  {
    id: 'sase-gator',
    label: 'SASE Gator',
    source: require('@/assets/avatars/sase-gator.webp'),
  },
  {
    id: 'sase-mantis',
    label: 'SASE Mantis',
    source: require('@/assets/avatars/sase-mantis.webp'),
  },
  {
    id: 'sase-sweeter',
    label: 'SASE Sweeter',
    source: require('@/assets/avatars/sase-sweeter.webp'),
  },
] as const;

export type ProfileAvatarId = (typeof profileAvatars)[number]['id'];

export function isProfileAvatarPreset(avatarUrl?: string | null): avatarUrl is ProfileAvatarId {
  if (!avatarUrl) return false;
  return profileAvatars.some((avatar) => avatar.id === avatarUrl);
}

export function getProfileAvatarSource(avatarUrl?: string | null) {
  const preset = profileAvatars.find((avatar) => avatar.id === avatarUrl);
  return preset?.source ?? (avatarUrl ? { uri: avatarUrl } : profileAvatars[0].source);
}
