export const profileAvatars = [
  {
    id: 'sase-shark',
    label: 'SASE Shark',
    source: require('@/assets/images/profile/sase-shark.png'),
  },
  {
    id: 'sase-cat',
    label: 'SASE Cat',
    source: require('@/assets/images/profile/sase-cat.png'),
  },
  {
    id: 'saseski',
    label: 'SASEski',
    source: require('@/assets/images/profile/saseski.png'),
  },
  {
    id: 'sase-gator',
    label: 'SASE Gator',
    source: require('@/assets/images/profile/sase-gator.png'),
  },
  {
    id: 'sase-mantis',
    label: 'SASE Mantis',
    source: require('@/assets/images/profile/sase-mantis.png'),
  },
  {
    id: 'sase-sweeter',
    label: 'SASE Sweeter',
    source: require('@/assets/images/profile/sase-sweeter.png'),
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
