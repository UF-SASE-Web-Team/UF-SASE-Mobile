import { getResources, getResourceSections, organizeResourceSections } from '@/services/resources';
import { supabase } from '@/lib/supabase';
import { ResourceRow } from '@/types/resources';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockData: ResourceRow[] = [
  {
    id: 'res-faq',
    name: 'Freshmen FAQs',
    category: 'sase',
    url: 'ufsasemobile://resources/freshman-faqs',
    is_top: true,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-linktree',
    name: 'Linktree',
    category: 'general',
    url: 'https://linktr.ee/ufsase',
    is_top: true,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-resume',
    name: 'Resume Template',
    category: 'professional',
    url: 'https://drive.google.com/resume',
    is_top: true,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-research',
    name: 'Research Resources',
    category: 'academic',
    url: 'https://docs.google.com/research',
    is_top: false,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'res-other',
    name: 'Other Tool',
    category: 'general',
    url: 'https://example.com/other',
    is_top: false,
    image_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('resources service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResources', () => {
    it('fetches resources from table', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await getResources();

      expect(supabase.from).toHaveBeenCalledWith('resources');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockData);
    });

    it('throws error when query fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(getResources()).rejects.toThrow('DB Error');
    });
  });

  describe('organizeResourceSections', () => {
    it('organizes items into Top, SASE, Academic, Professional, and Other sections', () => {
      const sections = organizeResourceSections(mockData);

      expect(sections.map((s) => s.key)).toEqual([
        'top',
        'sase',
        'academic',
        'professional',
        'other',
      ]);

      const topSection = sections.find((s) => s.key === 'top')!;
      expect(topSection.items.some((i) => i.name === 'Freshmen FAQs')).toBe(true);
      expect(topSection.items.some((i) => i.name === 'Linktree')).toBe(true);
      expect(topSection.items.some((i) => i.name === 'Resume Template')).toBe(true);

      const otherSection = sections.find((s) => s.key === 'other')!;
      expect(otherSection.items.some((i) => i.name === 'Other Tool')).toBe(true);
    });
  });

  describe('getResourceSections', () => {
    it('fetches data and returns organized sections', async () => {
      const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const sections = await getResourceSections();

      expect(sections.length).toBeGreaterThan(0);
      expect(sections[0].key).toBe('top');
    });
  });
});
