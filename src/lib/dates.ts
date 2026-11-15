/**
 * Computes a user-friendly relative date label for upcoming events.
 *
 * Rules:
 * - Same calendar day: "Today"
 * - Next calendar day: "Tomorrow"
 * - Within 2-6 calendar days: Short weekday (e.g., "Wed", "Thu")
 * - 7 or more calendar days (or past): Short month + day (e.g., "Nov 20")
 */
export function getRelativeEventDate(
  startsAt?: string | null,
  referenceDate: Date = new Date(),
): { label: string; isToday: boolean } | null {
  if (!startsAt) return null;
  const target = new Date(startsAt);
  if (Number.isNaN(target.getTime())) return null;

  // Normalize both dates to midnight local time for calendar day comparison
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );

  const diffMs = targetMidnight.getTime() - refMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Today', isToday: true };
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', isToday: false };
  }
  if (diffDays > 1 && diffDays < 7) {
    return {
      label: target.toLocaleDateString(undefined, { weekday: 'short' }),
      isToday: false,
    };
  }
  return {
    label: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    isToday: false,
  };
}

/**
 * Computes an overline string combining the relative date and event time.
 * E.g., "Today • 6:30 PM", "Tomorrow • 7:00 PM", "Wed • 6:00 PM", "Nov 22 • 5:00 PM".
 */
export function getRelativeEventOverline(
  startsAt?: string | null,
  referenceDate: Date = new Date(),
): { text: string; isToday: boolean } | null {
  if (!startsAt) return null;
  const target = new Date(startsAt);
  if (Number.isNaN(target.getTime())) return null;

  const dateInfo = getRelativeEventDate(startsAt, referenceDate);
  if (!dateInfo) return null;

  const time = target.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const text = time ? `${dateInfo.label} • ${time}` : dateInfo.label;
  return {
    text,
    isToday: dateInfo.isToday,
  };
}
