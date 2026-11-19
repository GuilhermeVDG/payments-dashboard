/**
 * Date helpers. Payments store UTC ISO strings; ranges and display use the
 * user's local time zone. Every function that depends on "now" takes it as input.
 */
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInYears,
  endOfDay,
  format,
  isValid,
  parse,
  startOfDay,
  subDays,
} from 'date-fns';
import type { Payment } from './payment';

const LOCALE = 'en-US';
const DAY_MS = 86_400_000;

export const DATE_PRESETS = ['today', '7d', '30d'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

/** Local calendar date, `YYYY-MM-DD`. */
export type LocalDate = string;

export type DateFilter =
  | { kind: 'all' }
  | { kind: 'preset'; preset: DatePreset }
  | { kind: 'custom'; from: LocalDate | null; to: LocalDate | null };

/** Inclusive range in epoch ms. A null bound is open. */
export interface DateRange {
  start: number | null;
  end: number | null;
}

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_FORMAT = 'yyyy-MM-dd';

/** Parses `YYYY-MM-DD` as local midnight. Rejects malformed and impossible dates (Feb 30). */
export function parseLocalDate(value: string): Date | null {
  if (!LOCAL_DATE_RE.test(value)) return null;
  const date = parse(value, LOCAL_DATE_FORMAT, new Date(0));
  return isValid(date) && format(date, LOCAL_DATE_FORMAT) === value ? date : null;
}

export function toLocalDate(date: Date): LocalDate {
  return format(date, LOCAL_DATE_FORMAT);
}

const PRESET_DAYS: Record<DatePreset, number> = { today: 1, '7d': 7, '30d': 30 };

/**
 * Resolves a filter to an inclusive local-day range. Presets count today as one
 * of their days: "Last 7 days" is today plus the 6 days before, from local midnight.
 * Returns null when the filter does not restrict dates.
 */
export function resolveDateRange(filter: DateFilter, now: Date): DateRange | null {
  switch (filter.kind) {
    case 'all':
      return null;
    case 'preset': {
      const days = PRESET_DAYS[filter.preset];
      return {
        start: startOfDay(subDays(now, days - 1)).getTime(),
        end: endOfDay(now).getTime(),
      };
    }
    case 'custom': {
      const from = filter.from ? parseLocalDate(filter.from) : null;
      const to = filter.to ? parseLocalDate(filter.to) : null;
      if (!from && !to) return null;
      return {
        start: from ? startOfDay(from).getTime() : null,
        end: to ? endOfDay(to).getTime() : null,
      };
    }
  }
}

export function isInDateRange(iso: string, range: DateRange): boolean {
  const time = Date.parse(iso);
  return (range.start === null || time >= range.start) && (range.end === null || time <= range.end);
}

/** A custom range is valid when both dates parse and from <= to (when both are set). */
export function isValidCustomRange(from: LocalDate | null, to: LocalDate | null): boolean {
  const start = from ? parseLocalDate(from) : null;
  const end = to ? parseLocalDate(to) : null;
  if ((from && !start) || (to && !end)) return false;
  return !start || !end || start.getTime() <= end.getTime();
}

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const fullFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'long',
});

const shortDateFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'always' });
const nowFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

/** Table date: `Nov 19, 2:41 PM` in local time. */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/** Full timestamp for tooltips: `Nov 19, 2026, 2:41:07 PM GMT-3`. */
export function formatFullTimestamp(iso: string): string {
  return fullFormat.format(new Date(iso));
}

/** Local date for chips: `Nov 1, 2026`. */
export function formatLocalDate(value: LocalDate): string {
  const date = parseLocalDate(value);
  return date ? shortDateFormat.format(date) : value;
}

/** Relative time: `3 hours ago`, `in 2 days`, `now`. */
export function formatRelative(iso: string, now: Date): string {
  const date = new Date(iso);
  const units = [
    ['year', differenceInYears(date, now)],
    ['month', differenceInMonths(date, now)],
    ['day', differenceInDays(date, now)],
    ['hour', differenceInHours(date, now)],
    ['minute', differenceInMinutes(date, now)],
  ] as const;
  for (const [unit, value] of units) {
    if (value !== 0) return relativeFormat.format(value, unit);
  }
  const seconds = differenceInSeconds(date, now);
  // Intl with numeric: "auto" renders 0 seconds as "now" instead of "in 0 seconds".
  return seconds === 0 ? nowFormat.format(0, 'second') : relativeFormat.format(seconds, 'second');
}

/**
 * Shifts every payment forward by whole days so the dataset, generated relative to a
 * fixed anchor, stays recent: the newest payment lands within the last 24 hours and
 * never in the future. Returns the input unchanged when `now` is not past the anchor.
 * Shifts are exact 24-hour blocks in UTC, so across a DST change local wall-clock
 * times move by an hour; acceptable for mock data.
 */
export function rebaseToNow(payments: readonly Payment[], anchor: string, now: Date): Payment[] {
  const days = Math.floor((now.getTime() - Date.parse(anchor)) / DAY_MS);
  if (days <= 0) return [...payments];
  const shift = (iso: string) => new Date(Date.parse(iso) + days * DAY_MS).toISOString();
  return payments.map((p) => ({
    ...p,
    created: shift(p.created),
    ...(p.refundedAt ? { refundedAt: shift(p.refundedAt) } : {}),
  }));
}
