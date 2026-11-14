import { resolveAssetUrl } from '@/lib/assets';

describe('resolveAssetUrl', () => {
  it('resolves bucket paths against the configured Supabase project', () => {
    const expected = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/programs/interns.webp`;
    expect(resolveAssetUrl('programs/interns.webp')).toBe(expected);
    expect(resolveAssetUrl('/programs/interns.webp')).toBe(expected);
  });

  it('leaves absolute URLs untouched', () => {
    expect(resolveAssetUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
  });

  it('returns null when there is no image', () => {
    expect(resolveAssetUrl(null)).toBeNull();
    expect(resolveAssetUrl('  ')).toBeNull();
  });
});
