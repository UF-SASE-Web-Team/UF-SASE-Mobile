import { formatLinkedInDisplay, normalizeLinkedInUrl } from '@/lib/linkedin';

describe('normalizeLinkedInUrl', () => {
  it('normalizes full URLs and strips query parameters or trailing slashes', () => {
    expect(
      normalizeLinkedInUrl(
        'https://www.linkedin.com/in/john-doe?utm_source=share&utm_medium=member_ios',
      ),
    ).toBe('https://www.linkedin.com/in/john-doe');

    expect(normalizeLinkedInUrl('https://linkedin.com/in/alice-gator/')).toBe(
      'https://www.linkedin.com/in/alice-gator',
    );

    expect(normalizeLinkedInUrl('http://ca.linkedin.com/in/carol')).toBe(
      'https://www.linkedin.com/in/carol',
    );
  });

  it('normalizes domain inputs without protocol', () => {
    expect(normalizeLinkedInUrl('linkedin.com/in/john-doe')).toBe(
      'https://www.linkedin.com/in/john-doe',
    );
    expect(normalizeLinkedInUrl('www.linkedin.com/in/john-doe/')).toBe(
      'https://www.linkedin.com/in/john-doe',
    );
  });

  it('normalizes in/ path shortcuts', () => {
    expect(normalizeLinkedInUrl('in/john-doe')).toBe('https://www.linkedin.com/in/john-doe');
    expect(normalizeLinkedInUrl('/in/john-doe/')).toBe('https://www.linkedin.com/in/john-doe');
  });

  it('normalizes bare usernames and @ handles', () => {
    expect(normalizeLinkedInUrl('johndoe')).toBe('https://www.linkedin.com/in/johndoe');
    expect(normalizeLinkedInUrl('@johndoe')).toBe('https://www.linkedin.com/in/johndoe');
    expect(normalizeLinkedInUrl('john-doe-123')).toBe('https://www.linkedin.com/in/john-doe-123');
  });

  it('rejects invalid domains, other websites, or malformed formats', () => {
    expect(normalizeLinkedInUrl('https://linkedin.com.example.com/alice')).toBeNull();
    expect(normalizeLinkedInUrl('https://notlinkedin.com/in/alice')).toBeNull();
    expect(normalizeLinkedInUrl('https://github.com/alice')).toBeNull();
    expect(normalizeLinkedInUrl('ab')).toBeNull(); // Less than 3 characters
    expect(normalizeLinkedInUrl('')).toBeNull();
    expect(normalizeLinkedInUrl('   ')).toBeNull();
  });
});

describe('formatLinkedInDisplay', () => {
  it('formats full LinkedIn URLs to in/<username>', () => {
    expect(
      formatLinkedInDisplay(
        'https://www.linkedin.com/in/john-doe?utm_source=share&utm_medium=member_ios',
      ),
    ).toBe('in/john-doe');
    expect(formatLinkedInDisplay('https://linkedin.com/in/alice-gator/')).toBe('in/alice-gator');
    expect(formatLinkedInDisplay('linkedin.com/in/alice-gator')).toBe('in/alice-gator');
  });

  it('formats in/ shortcuts and bare handles to in/<username>', () => {
    expect(formatLinkedInDisplay('in/john-doe')).toBe('in/john-doe');
    expect(formatLinkedInDisplay('/in/john-doe/')).toBe('in/john-doe');
    expect(formatLinkedInDisplay('john-doe')).toBe('in/john-doe');
    expect(formatLinkedInDisplay('@john-doe')).toBe('in/john-doe');
  });

  it('returns empty string for empty or whitespace inputs', () => {
    expect(formatLinkedInDisplay('')).toBe('');
    expect(formatLinkedInDisplay('   ')).toBe('');
  });
});
