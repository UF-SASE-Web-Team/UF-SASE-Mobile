import type { ProfileWithPrograms } from '@/types/profiles';

export const profileFixture: ProfileWithPrograms = {
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
