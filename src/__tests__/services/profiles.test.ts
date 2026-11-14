import {
  getProfile,
  getProfilesByIds,
  getUfid,
  saveUfid,
  updateProfile,
} from '@/services/profiles';
import { supabase } from '@/lib/supabase';
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

describe('Profile service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the member and current program memberships', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        ...mockProfile,
        program_members: [{ program: { name: 'SWEET' } }, { program: { name: 'SWEET' } }],
      },
      error: null,
    });
    const query = { eq: jest.fn(), single };
    query.eq.mockReturnValue(query);
    const select = jest.fn().mockReturnValue(query);
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select });
    const result = await getProfile(mockProfile.id);
    expect(query.eq).toHaveBeenCalledWith('id', mockProfile.id);
    expect(query.eq).toHaveBeenCalledWith('program_members.term.is_current', true);
    expect(result.programNames).toEqual(['SWEET']);
  });

  it('updates only editable fields for the specified member', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { ...mockProfile, full_name: 'Alice Updated' }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ update });
    const result = await updateProfile(mockProfile.id, {
      full_name: 'Alice Updated',
      bio: null,
    });
    expect(eq).toHaveBeenCalledWith('id', mockProfile.id);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Alice Updated', bio: null }),
    );
    expect(update.mock.calls[0][0]).not.toHaveProperty('role');
    expect(result.full_name).toBe('Alice Updated');
  });

  it('reports failed saves', async () => {
    const single = jest.fn().mockResolvedValue({ data: null, error: new Error('Update failed') });
    const query = { eq: jest.fn(), select: jest.fn(), single };
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ update: () => query });
    await expect(updateProfile(mockProfile.id, { full_name: 'Alice' })).rejects.toThrow(
      'Update failed',
    );
  });

  it('reads the UFID from the owner-only table, not the public profile', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { ufid: '12345678' }, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select });
    await expect(getUfid(mockProfile.id)).resolves.toBe('12345678');
    expect(supabase.from).toHaveBeenCalledWith('profile_private');
    expect(eq).toHaveBeenCalledWith('user_id', mockProfile.id);
  });

  it('reports no UFID for a member who has not onboarded', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select: () => ({ eq }) });
    await expect(getUfid(mockProfile.id)).resolves.toBeNull();
  });

  it('saves the UFID for the specified member', async () => {
    const single = jest.fn().mockResolvedValue({ data: { ufid: '12345678' }, error: null });
    const upsert = jest.fn().mockReturnValue({ select: () => ({ single }) });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ upsert });
    await expect(saveUfid(mockProfile.id, '12345678')).resolves.toBe('12345678');
    expect(supabase.from).toHaveBeenCalledWith('profile_private');
    expect(upsert).toHaveBeenCalledWith({ user_id: mockProfile.id, ufid: '12345678' });
  });

  it('rejects a UFID that another account already uses', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } });
    const upsert = jest.fn().mockReturnValue({ select: () => ({ single }) });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ upsert });
    await expect(saveUfid(mockProfile.id, '12345678')).rejects.toThrow(/already/);
  });

  it('fetches multiple profiles by userIds', async () => {
    const mockProfiles = [
      { id: 'u1', full_name: 'Alice User', avatar_url: 'https://example.com/a.png' },
      { id: 'u2', full_name: 'Bob User', avatar_url: null },
    ];
    const inMock = jest.fn().mockResolvedValue({ data: mockProfiles, error: null });
    const select = jest.fn().mockReturnValue({ in: inMock });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select });

    const result = await getProfilesByIds(['u1', 'u2']);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(select).toHaveBeenCalledWith('id, full_name, avatar_url');
    expect(inMock).toHaveBeenCalledWith('id', ['u1', 'u2']);
    expect(result).toEqual(mockProfiles);
  });

  it('returns empty array when userIds is empty', async () => {
    const result = await getProfilesByIds([]);
    expect(result).toEqual([]);
  });
});
