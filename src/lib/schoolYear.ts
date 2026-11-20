/** The school year a date falls in, e.g. "2026–2027". School years start August 1. */
export function schoolYearLabel(date: Date = new Date()): string {
  const start = date.getMonth() >= 7 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}–${start + 1}`;
}
