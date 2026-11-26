export const CODE_LENGTH = 6;

// Six digits, optionally split by spaces or dashes ("123 456", "123-456").
// No lookbehind, so it runs on every JS engine React Native ships with.
const CODE_PATTERN = new RegExp(`(?:^|\\D)(\\d(?:[\\s-]?\\d){${CODE_LENGTH - 1}})(?!\\d)`);

/** The first standalone 6-digit code in some text, e.g. a pasted email line. */
export function findCode(text: string): string | null {
  const match = text.match(CODE_PATTERN);
  return match ? match[1].replace(/\D/g, '') : null;
}

/**
 * The code after the input's text changes. Typing keeps the digits in order.
 * A paste or autofill (more than one character at once) is searched for a full
 * code first, so "Your code is 123 456" or pasting over a half-typed code
 * gives 123456.
 */
export function nextCode(previous: string, text: string): string {
  const inserted = text.startsWith(previous) ? text.slice(previous.length) : text;
  if (inserted.length > 1) {
    const code = findCode(inserted) ?? findCode(text);
    if (code) return code;
  }
  return text.replace(/\D/g, '').slice(0, CODE_LENGTH);
}
