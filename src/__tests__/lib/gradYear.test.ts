import {
  INVALID_GRAD_YEAR_MESSAGE,
  MAX_GRAD_YEAR,
  MIN_GRAD_YEAR,
  isValidGradYear,
  sanitizeGradYear,
} from '@/lib/gradYear';

describe('gradYear helpers', () => {
  it('sanitizes input to at most 4 digits', () => {
    expect(sanitizeGradYear('2028')).toBe('2028');
    expect(sanitizeGradYear('20285')).toBe('2028');
    expect(sanitizeGradYear('ab20c28d')).toBe('2028');
    expect(sanitizeGradYear('')).toBe('');
  });

  it('validates 4-digit years within 1980 and 2040', () => {
    expect(MIN_GRAD_YEAR).toBe(1980);
    expect(MAX_GRAD_YEAR).toBe(2040);
    expect(INVALID_GRAD_YEAR_MESSAGE).toBe('Enter a valid 4-digit graduation year.');

    expect(isValidGradYear('1980')).toBe(true);
    expect(isValidGradYear('2015')).toBe(true);
    expect(isValidGradYear('2028')).toBe(true);
    expect(isValidGradYear('2040')).toBe(true);

    // Below min
    expect(isValidGradYear('1979')).toBe(false);
    expect(isValidGradYear('1900')).toBe(false);

    // Above max
    expect(isValidGradYear('2041')).toBe(false);
    expect(isValidGradYear('2100')).toBe(false);

    // Non-4-digit or invalid formats
    expect(isValidGradYear('202')).toBe(false);
    expect(isValidGradYear('20288')).toBe(false);
    expect(isValidGradYear('')).toBe(false);
    expect(isValidGradYear('abcd')).toBe(false);
  });
});
