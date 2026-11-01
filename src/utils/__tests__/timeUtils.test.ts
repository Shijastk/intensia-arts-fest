import { describe, it, expect } from 'vitest';
import {
  parseScheduleTime,
  toStoredTime,
  formatTime,
  formatDate,
  formatDateTime,
  compareScheduleTimes,
  compareScheduleTimesDesc,
  addMinutes,
  toDateTimeLocalValue,
} from '../timeUtils';

// Local wall-time helper (tests are timezone independent).
const local = (y: number, m: number, d: number, h = 0, mi = 0) => new Date(y, m - 1, d, h, mi, 0, 0);

describe('parseScheduleTime', () => {
  it('returns null for empty / garbage values', () => {
    expect(parseScheduleTime(undefined)).toBeNull();
    expect(parseScheduleTime(null)).toBeNull();
    expect(parseScheduleTime('')).toBeNull();
    expect(parseScheduleTime('not a time')).toBeNull();
  });

  it('parses UTC ISO strings with Z', () => {
    expect(parseScheduleTime('2026-11-05T04:00:00.000Z')!.toISOString()).toBe('2026-11-05T04:00:00.000Z');
  });

  it('parses ISO strings with an explicit offset', () => {
    expect(parseScheduleTime('2026-11-05T09:30:00+05:30')!.toISOString()).toBe('2026-11-05T04:00:00.000Z');
  });

  it('treats zone-less ISO (old cascade format) as local wall time', () => {
    expect(parseScheduleTime('2026-11-05T09:30:00.000')!.getTime()).toBe(local(2026, 11, 5, 9, 30).getTime());
    expect(parseScheduleTime('2026-11-05T09:30')!.getTime()).toBe(local(2026, 11, 5, 9, 30).getTime());
  });

  it("parses legacy 'YYYY-MM-DD HH:mm' as local time", () => {
    expect(parseScheduleTime('2026-11-05 09:30')!.getTime()).toBe(local(2026, 11, 5, 9, 30).getTime());
    expect(parseScheduleTime('2026-11-05 14:05:00')!.getTime()).toBe(local(2026, 11, 5, 14, 5).getTime());
  });

  it('parses legacy AM/PM forms with a date', () => {
    expect(parseScheduleTime('2026-11-05 9:30 PM')!.getTime()).toBe(local(2026, 11, 5, 21, 30).getTime());
    expect(parseScheduleTime('2026-11-05 12:15 AM')!.getTime()).toBe(local(2026, 11, 5, 0, 15).getTime());
    expect(parseScheduleTime('2026-11-05 12:15 PM')!.getTime()).toBe(local(2026, 11, 5, 12, 15).getTime());
  });

  it('parses time-only AM/PM strings as today', () => {
    const d = parseScheduleTime('09:30 AM')!;
    const today = new Date();
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
    expect(d.getDate()).toBe(today.getDate());
    expect(parseScheduleTime('2:05 pm')!.getHours()).toBe(14);
  });

  it('date-only strings are local midnight, not UTC midnight', () => {
    expect(parseScheduleTime('2026-11-05')!.getTime()).toBe(local(2026, 11, 5).getTime());
  });
});

describe('toStoredTime round trip', () => {
  it('stores UTC ISO and parses back to the same instant', () => {
    const d = local(2026, 11, 5, 9, 30);
    const stored = toStoredTime(d);
    expect(stored).toMatch(/Z$/);
    expect(parseScheduleTime(stored)!.getTime()).toBe(d.getTime());
  });

  it('old zone-less values re-stored as ISO keep the same wall time', () => {
    const old = '2026-11-05T09:30:00.000';
    const restored = parseScheduleTime(toStoredTime(parseScheduleTime(old)!))!;
    expect(restored.getHours()).toBe(9);
    expect(restored.getMinutes()).toBe(30);
  });

  it('addMinutes', () => {
    expect(addMinutes(local(2026, 11, 5, 9, 30), 45).getTime()).toBe(local(2026, 11, 5, 10, 15).getTime());
  });
});

describe('sorting', () => {
  it('sorts chronologically across days and mixed formats, unscheduled last', () => {
    const values = [
      undefined,
      toStoredTime(local(2026, 11, 6, 9, 0)), // day 2 09:00 (ISO Z)
      '2026-11-05 14:00', // day 1 14:00 (legacy)
      '', // unscheduled
      '2026-11-05T09:30:00.000', // day 1 09:30 (zone-less)
      '2026-11-05 10:00 AM', // day 1 10:00 (AM/PM)
    ];
    const sorted = [...values].sort(compareScheduleTimes);
    expect(sorted.slice(0, 4)).toEqual([
      '2026-11-05T09:30:00.000',
      '2026-11-05 10:00 AM',
      '2026-11-05 14:00',
      toStoredTime(local(2026, 11, 6, 9, 0)),
    ]);
    expect(sorted.slice(4).every(v => !v)).toBe(true);
  });

  it('string order would be wrong; compareScheduleTimes is not', () => {
    // '2026-11-05T10:00' vs a UTC string for 09:00 local on the same day in a +05:30 zone etc.
    const a = toStoredTime(local(2026, 11, 5, 23, 0));
    const b = '2026-11-06T08:00:00.000';
    expect(compareScheduleTimes(a, b)).toBeLessThan(0);
  });

  it('descending comparator keeps unscheduled last', () => {
    const sorted = ['', '2026-11-05 09:00', '2026-11-06 09:00'].sort(compareScheduleTimesDesc);
    expect(sorted).toEqual(['2026-11-06 09:00', '2026-11-05 09:00', '']);
  });
});

describe('display', () => {
  it('formats time as hh:mm AM/PM in local time', () => {
    expect(formatTime(local(2026, 11, 5, 9, 30))).toBe('09:30 AM');
    expect(formatTime(local(2026, 11, 5, 0, 5))).toBe('12:05 AM');
    expect(formatTime(local(2026, 11, 5, 12, 0))).toBe('12:00 PM');
    expect(formatTime('2026-11-05T21:45:00.000')).toBe('09:45 PM');
    expect(formatTime(toStoredTime(local(2026, 11, 5, 9, 30)))).toBe('09:30 AM');
  });

  it('formats date as "Thu, 5 Nov"', () => {
    expect(formatDate('2026-11-05T09:30:00.000')).toBe('Thu, 5 Nov');
    expect(formatDateTime('2026-11-05 09:30')).toBe('Thu, 5 Nov · 09:30 AM');
  });

  it('fallbacks: empty -> fallback, unparseable -> raw', () => {
    expect(formatTime('', '--:--')).toBe('--:--');
    expect(formatDateTime(undefined, 'TBA')).toBe('TBA');
    expect(formatTime('After lunch')).toBe('After lunch');
  });

  it('datetime-local input value', () => {
    expect(toDateTimeLocalValue(toStoredTime(local(2026, 11, 5, 9, 5)))).toBe('2026-11-05T09:05');
    expect(toDateTimeLocalValue('')).toBe('');
  });
});
