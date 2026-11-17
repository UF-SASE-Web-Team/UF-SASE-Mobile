import { submitAppFeedback } from '@/services/feedback';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('submitAppFeedback', () => {
  const insertMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue({
      insert: insertMock,
    });
  });

  it('throws an error if the message is empty or only whitespace', async () => {
    await expect(
      submitAppFeedback({
        userId: 'u1',
        category: 'bug',
        message: '   ',
      }),
    ).rejects.toThrow('Please enter a message before submitting.');
  });

  it('submits feedback with platform metadata', async () => {
    insertMock.mockResolvedValue({ error: null });

    await submitAppFeedback({
      userId: 'u1',
      category: 'feature',
      message: 'Add dark mode widget',
    });

    expect(supabase.from).toHaveBeenCalledWith('app_feedback');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        category: 'feature',
        message: 'Add dark mode widget',
        metadata: expect.objectContaining({
          platform: expect.any(String),
        }),
      }),
    );
  });

  it('throws when supabase returns an error', async () => {
    insertMock.mockResolvedValue({ error: new Error('Database down') });

    await expect(
      submitAppFeedback({
        userId: 'u1',
        category: 'general',
        message: 'Great app',
      }),
    ).rejects.toThrow('Database down');
  });
});
