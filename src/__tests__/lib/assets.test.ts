import { GRAPHICS, RESOURCE_ICONS, getResourceIconSource, resolveAssetUrl } from '@/lib/assets';

describe('GRAPHICS', () => {
  it('defines valid graphics assets for illustrations', () => {
    expect(GRAPHICS.rings).toBeDefined();
    expect(GRAPHICS.starLeft).toBeDefined();
    expect(GRAPHICS.starRight).toBeDefined();
  });
});

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

describe('getResourceIconSource', () => {
  const storageUrl = (path: string) =>
    `https://lbauzxflhubvbnrkbprp.supabase.co/storage/v1/object/public/public-assets/${path}`;

  it('uses the bundled icon for a full Storage URL', () => {
    expect(getResourceIconSource(storageUrl('resources/linktree.webp'))).toBe(
      RESOURCE_ICONS.linktree,
    );
  });

  it('uses the bundled icon for a bucket path', () => {
    expect(getResourceIconSource('resources/gcal.webp')).toBe(RESOURCE_ICONS.gcal);
    expect(getResourceIconSource('/resources/gcal.webp')).toBe(RESOURCE_ICONS.gcal);
  });

  it('loads icons that are not bundled from Storage', () => {
    expect(getResourceIconSource('resources/brand-new.webp')).toEqual({
      uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-assets/resources/brand-new.webp`,
    });
  });

  it('loads other absolute URLs remotely', () => {
    expect(getResourceIconSource('https://example.com/icon.png')).toEqual({
      uri: 'https://example.com/icon.png',
    });
  });

  it('returns null when there is no icon', () => {
    expect(getResourceIconSource(null)).toBeNull();
    expect(getResourceIconSource('  ')).toBeNull();
  });

  it('bundles every icon the seed data references', () => {
    expect(Object.keys(RESOURCE_ICONS)).toHaveLength(15);
  });
});
