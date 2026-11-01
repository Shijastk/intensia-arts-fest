// Shared schedule time helpers.
//
// Storage rule: always STORE `toStoredTime(date)` (UTC ISO with Z).
// Reading must stay backward compatible with values already in the database:
//   - UTC/offset ISO strings          "2026-11-05T04:00:00.000Z", "...+05:30"
//   - zone-less ISO (local wall time) "2026-11-05T09:30:00.000", "2026-11-05T09:30"
//   - legacy "YYYY-MM-DD HH:mm"       "2026-11-05 09:30", "2026-11-05 9:30 AM"
//   - time-only AM/PM / 24h strings   "09:30 AM", "14:15"  (assumed to be today)
// Display is always in the browser's local time zone.

const DEFAULT_DURATION_MINUTES = 30;

const LOCAL_DATE_TIME_RE =
  /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?\s*(AM|PM)?)?$/i;
const HAS_ZONE_RE = /(Z|[+-]\d{2}:?\d{2})$/i;
const TIME_ONLY_RE = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;

const to24h = (hours: number, ampm?: string) => {
  const marker = ampm?.toUpperCase();
  if (marker === 'PM' && hours < 12) return hours + 12;
  if (marker === 'AM' && hours === 12) return 0;
  return hours;
};

const isValid = (d: Date) => !isNaN(d.getTime());

/** Parse any stored schedule value into a Date (null when empty/unparseable). */
export const parseScheduleTime = (value?: string | Date | null): Date | null => {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return isValid(value) ? new Date(value.getTime()) : null;
  const str = String(value).trim();
  if (!str) return null;

  // Zone-less date / date-time: interpret as local wall time (explicitly, so that
  // date-only strings are not read as UTC midnight by the JS engine).
  if (!HAS_ZONE_RE.test(str)) {
    const m = str.match(LOCAL_DATE_TIME_RE);
    if (m) {
      const [, y, mo, d, h, mi, s, ms, ampm] = m;
      const date = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        h ? to24h(Number(h), ampm) : 0,
        mi ? Number(mi) : 0,
        s ? Number(s) : 0,
        ms ? Number(ms.padEnd(3, '0')) : 0
      );
      return isValid(date) ? date : null;
    }
  }

  // ISO with zone, or any other format the engine understands.
  const native = new Date(str);
  if (isValid(native)) return native;

  // Legacy time-only strings ("09:30 AM", "14:15"): assume today (previous behaviour).
  const t = str.match(TIME_ONLY_RE);
  if (t) {
    const d = new Date();
    d.setHours(to24h(parseInt(t[1], 10), t[3]), parseInt(t[2], 10), 0, 0);
    return d;
  }
  return null;
};

/** The single format used when writing times to the database. */
export const toStoredTime = (date: Date): string => date.toISOString();

export const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60_000);

export const getDurationMinutes = (duration?: number | null): number =>
  duration && duration > 0 ? duration : DEFAULT_DURATION_MINUTES;

const pad = (n: number) => String(n).padStart(2, '0');
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "09:30 AM" in the browser's local zone. Empty -> fallback; unparseable -> raw value. */
export const formatTime = (value?: string | Date | null, fallback = ''): string => {
  const d = parseScheduleTime(value);
  if (!d) return value ? String(value) : fallback;
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad(h12)}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
};

/** "Thu, 5 Nov" in the browser's local zone. Empty -> fallback; unparseable -> raw value. */
export const formatDate = (value?: string | Date | null, fallback = ''): string => {
  const d = parseScheduleTime(value);
  if (!d) return value ? String(value) : fallback;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "Thu, 5 Nov · 09:30 AM". Empty -> fallback; unparseable -> raw value. */
export const formatDateTime = (value?: string | Date | null, fallback = ''): string => {
  const d = parseScheduleTime(value);
  if (!d) return value ? String(value) : fallback;
  return `${formatDate(d)} · ${formatTime(d)}`;
};

/** Value for an <input type="datetime-local"> ("YYYY-MM-DDTHH:mm", local time). */
export const toDateTimeLocalValue = (value?: string | Date | null): string => {
  const d = parseScheduleTime(value);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Chronological comparator; unscheduled/unparseable values sort last. */
export const compareScheduleTimes = (a?: string | Date | null, b?: string | Date | null): number => {
  const da = parseScheduleTime(a);
  const db = parseScheduleTime(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da.getTime() - db.getTime();
};

/** Reverse-chronological comparator; unscheduled/unparseable values still sort last. */
export const compareScheduleTimesDesc = (a?: string | Date | null, b?: string | Date | null): number => {
  const da = parseScheduleTime(a);
  const db = parseScheduleTime(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return db.getTime() - da.getTime();
};
