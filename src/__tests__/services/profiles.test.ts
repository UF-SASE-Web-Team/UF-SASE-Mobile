import { getProfile, updateProfile } from '@/services/profiles';
import { supabase } from '@/lib/supabase';
import { profileFixture } from '@/test-utils/profile';

describe('Profile service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the member and current program memberships', async () => {
    const single = jest.fn().mockResolvedValue({
      data: {
        ...profileFixture,
        program_members: [{ program: { name: 'SWEET' } }, { program: { name: 'SWEET' } }],
      },
      error: null,
    });
    const query = { eq: jest.fn(), single };
    query.eq.mockReturnValue(query);
    const select = jest.fn().mockReturnValue(query);
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select });
    const result = await getProfile(profileFixture.id);
    expect(query.eq).toHaveBeenCalledWith('id', profileFixture.id);
    expect(query.eq).toHaveBeenCalledWith('program_members.term.is_current', true);
    expect(result.programNames).toEqual(['SWEET']);
  });

  it('updates only editable fields for the specified member', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { ...profileFixture, full_name: 'Alice Updated' }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ update });
    const result = await updateProfile(profileFixture.id, {
      full_name: 'Alice Updated',
      bio: null,
    });
    expect(eq).toHaveBeenCalledWith('id', profileFixture.id);
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
    await expect(updateProfile(profileFixture.id, { full_name: 'Alice' })).rejects.toThrow(
      'Update failed',
    );
  });
});
