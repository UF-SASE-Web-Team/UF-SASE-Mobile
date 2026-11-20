import { schoolYearLabel } from '@/lib/schoolYear';
import { isValidUfEmail, normalizeUfEmail, ufEmailFromLogin } from '@/lib/ufEmail';

describe('ufEmail', () => {
  it('accepts only @ufl.edu addresses', () => {
    expect(isValidUfEmail(' gator@UFL.edu ')).toBe(true);
    expect(isValidUfEmail('gator@gmail.com')).toBe(false);
    expect(isValidUfEmail('gator@ufl.edu.com')).toBe(false);
  });

  it('normalizes and prefills from a UF login email only', () => {
    expect(normalizeUfEmail(' Gator@UFL.edu ')).toBe('gator@ufl.edu');
    expect(ufEmailFromLogin('Gator@ufl.edu')).toBe('gator@ufl.edu');
    expect(ufEmailFromLogin('gator@gmail.com')).toBe('');
    expect(ufEmailFromLogin(undefined)).toBe('');
  });
});

describe('schoolYearLabel', () => {
  it('starts the school year in August', () => {
    expect(schoolYearLabel(new Date(2026, 10, 17))).toBe('2026–2027');
    expect(schoolYearLabel(new Date(2027, 2, 1))).toBe('2026–2027');
    expect(schoolYearLabel(new Date(2026, 6, 31))).toBe('2025–2026');
  });
});
