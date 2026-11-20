export const INVALID_UF_EMAIL_MESSAGE = 'Use your @ufl.edu email address.';

/** Trims and lowercases a UF email as typed. */
export function normalizeUfEmail(text: string): string {
  return text.trim().toLowerCase();
}

export function isValidUfEmail(email: string): boolean {
  return /^[^@\s]+@ufl\.edu$/i.test(email.trim());
}

/** The login email, when it is already a UF address (used to prefill). */
export function ufEmailFromLogin(loginEmail: string | null | undefined): string {
  return loginEmail && isValidUfEmail(loginEmail) ? normalizeUfEmail(loginEmail) : '';
}
