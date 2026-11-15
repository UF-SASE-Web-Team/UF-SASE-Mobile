import { getRelativeEventDate, getRelativeEventOverline } from '@/lib/dates';

describe('getRelativeEventDate', () => {
  const refDate = new Date(2026, 10, 15, 14, 0, 0); // Sunday Nov 15, 2026, 2:00 PM local

  it('returns null for null, undefined, or empty string', () => {
    expect(getRelativeEventDate(null, refDate)).toBeNull();
    expect(getRelativeEventDate(undefined, refDate)).toBeNull();
    expect(getRelativeEventDate('', refDate)).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(getRelativeEventDate('invalid-date', refDate)).toBeNull();
  });

  it('returns "Today" with isToday: true for events on the same calendar day', () => {
    // Event earlier or later the same day
    const sameDayLater = new Date(2026, 10, 15, 19, 30, 0).toISOString();
    const result = getRelativeEventDate(sameDayLater, refDate);
    expect(result).toEqual({ label: 'Today', isToday: true });
  });

  it('returns "Tomorrow" with isToday: false for events on the next calendar day', () => {
    const nextDay = new Date(2026, 10, 16, 18, 0, 0).toISOString();
    const result = getRelativeEventDate(nextDay, refDate);
    expect(result).toEqual({ label: 'Tomorrow', isToday: false });
  });

  it('returns short weekday for events 2 to 6 days away', () => {
    // 2 days away: Tuesday Nov 17
    const twoDaysAway = new Date(2026, 10, 17, 18, 0, 0).toISOString();
    const result2 = getRelativeEventDate(twoDaysAway, refDate);
    expect(result2?.isToday).toBe(false);
    expect(result2?.label).toBe('Tue');

    // 5 days away: Friday Nov 20
    const fiveDaysAway = new Date(2026, 10, 20, 18, 0, 0).toISOString();
    const result5 = getRelativeEventDate(fiveDaysAway, refDate);
    expect(result5?.isToday).toBe(false);
    expect(result5?.label).toBe('Fri');

    // 6 days away: Saturday Nov 21
    const sixDaysAway = new Date(2026, 10, 21, 18, 0, 0).toISOString();
    const result6 = getRelativeEventDate(sixDaysAway, refDate);
    expect(result6?.isToday).toBe(false);
    expect(result6?.label).toBe('Sat');
  });

  it('returns short month and day for events 7 or more days away', () => {
    // 7 days away: Sunday Nov 22
    const sevenDaysAway = new Date(2026, 10, 22, 18, 0, 0).toISOString();
    const result7 = getRelativeEventDate(sevenDaysAway, refDate);
    expect(result7?.isToday).toBe(false);
    expect(result7?.label).toBe('Nov 22');

    // 14 days away: Sunday Nov 29
    const fourteenDaysAway = new Date(2026, 10, 29, 18, 0, 0).toISOString();
    const result14 = getRelativeEventDate(fourteenDaysAway, refDate);
    expect(result14?.isToday).toBe(false);
    expect(result14?.label).toBe('Nov 29');
  });
});

describe('getRelativeEventOverline', () => {
  const refDate = new Date(2026, 10, 15, 14, 0, 0); // Sunday Nov 15, 2026, 2:00 PM local

  it('returns null for null, undefined, or invalid dates', () => {
    expect(getRelativeEventOverline(null, refDate)).toBeNull();
    expect(getRelativeEventOverline('bad-date', refDate)).toBeNull();
  });

  it('returns formatted overline with time for today', () => {
    const today = new Date(2026, 10, 15, 18, 30, 0).toISOString();
    const result = getRelativeEventOverline(today, refDate);
    expect(result?.isToday).toBe(true);
    expect(result?.text).toMatch(/^Today • /);
  });

  it('returns formatted overline with time for tomorrow', () => {
    const tomorrow = new Date(2026, 10, 16, 19, 0, 0).toISOString();
    const result = getRelativeEventOverline(tomorrow, refDate);
    expect(result?.isToday).toBe(false);
    expect(result?.text).toMatch(/^Tomorrow • /);
  });

  it('returns formatted overline with weekday for events this week', () => {
    const wednesday = new Date(2026, 10, 18, 17, 0, 0).toISOString();
    const result = getRelativeEventOverline(wednesday, refDate);
    expect(result?.isToday).toBe(false);
    expect(result?.text).toMatch(/^Wed • /);
  });
});
