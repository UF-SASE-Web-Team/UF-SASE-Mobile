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
] as const;

export function getProfileAvatarSource(avatarUrl?: string | null) {
  const preset = profileAvatars.find((avatar) => avatar.id === avatarUrl);
  return preset?.source ?? (avatarUrl ? { uri: avatarUrl } : profileAvatars[0].source);
}
