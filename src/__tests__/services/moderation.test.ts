import { blockMember, isMemberBlocked, reportMember, unblockMember } from '@/services/moderation';
import { supabase } from '@/lib/supabase';

describe('Moderation service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('files a report against the named member without sending a reporter', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ insert });

    await reportMember('user-bob', 'spam', '  Promo links  ');

    expect(supabase.from).toHaveBeenCalledWith('profile_reports');
    expect(insert).toHaveBeenCalledWith({
      reported_id: 'user-bob',
      reason: 'spam',
      details: 'Promo links',
    });
    expect(insert.mock.calls[0][0]).not.toHaveProperty('reporter_id');
  });

  it('stores blank report details as null', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ insert });

    await reportMember('user-bob', 'other', '   ');

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ details: null }));
  });

  it('surfaces a failed report', async () => {
    const insert = jest.fn().mockResolvedValue({ error: new Error('Insert failed') });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ insert });

    await expect(reportMember('user-bob', 'spam')).rejects.toThrow('Insert failed');
  });

  it.each([
    [{ blocked_id: 'user-bob' }, true],
    [null, false],
  ])('reports whether a member is blocked (%p)', async (row, expected) => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: row, error: null });
    const eq = jest.fn().mockReturnValue({ maybeSingle });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ select });

    await expect(isMemberBlocked('user-bob')).resolves.toBe(expected);
    expect(supabase.from).toHaveBeenCalledWith('profile_blocks');
    expect(eq).toHaveBeenCalledWith('blocked_id', 'user-bob');
  });

  it('blocks a member idempotently', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ upsert });

    await blockMember('user-bob');

    expect(supabase.from).toHaveBeenCalledWith('profile_blocks');
    expect(upsert).toHaveBeenCalledWith(
      { blocked_id: 'user-bob' },
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });

  it('unblocks only the named member', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ delete: del });

    await unblockMember('user-bob');

    expect(eq).toHaveBeenCalledWith('blocked_id', 'user-bob');
  });

  it('surfaces a failed block', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: new Error('Block failed') });
    (supabase.from as jest.Mock) = jest.fn().mockReturnValue({ upsert });

    await expect(blockMember('user-bob')).rejects.toThrow('Block failed');
  });
});
