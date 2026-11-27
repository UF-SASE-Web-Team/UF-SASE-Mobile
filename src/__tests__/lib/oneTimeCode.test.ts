import { findCode, nextCode } from '@/lib/oneTimeCode';

describe('one-time codes', () => {
  it('finds a code in pasted text, with or without separators', () => {
    expect(findCode('Your SASE code is 123456.')).toBe('123456');
    expect(findCode('123 456')).toBe('123456');
    expect(findCode('123-456')).toBe('123456');
    expect(findCode('Call 3525551234')).toBeNull();
    expect(findCode('12345')).toBeNull();
  });

  it('keeps typed digits in order and ignores non-digits', () => {
    expect(nextCode('12', '123')).toBe('123');
    expect(nextCode('', 'a')).toBe('');
    expect(nextCode('12345', '1234')).toBe('1234');
  });

  it('uses the pasted code, even over a half-typed one', () => {
    expect(nextCode('', 'Your code is 654321, expires in 10 minutes')).toBe('654321');
    expect(nextCode('12', '12654321')).toBe('654321');
    expect(nextCode('', '987 654')).toBe('987654');
  });

  it('still takes the first six digits of an unusual paste', () => {
    expect(nextCode('', '1234567')).toBe('123456');
  });
});
