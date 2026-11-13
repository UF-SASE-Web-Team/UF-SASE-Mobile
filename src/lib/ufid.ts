export const UFID_LENGTH = 8;

/** Keeps only digits so pasted values like `1234-5678` still work. */
export function sanitizeUfid(text: string): string {
  return text.replace(/\D/g, '').slice(0, UFID_LENGTH);
}

export function isValidUfid(ufid: string): boolean {
  return new RegExp(`^\\d{${UFID_LENGTH}}$`).test(ufid);
}
