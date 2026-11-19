import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  formatFullTimestamp,
  formatLocalDate,
  formatRelative,
  isInDateRange,
  isValidCustomRange,
  parseLocalDate,
  rebaseToNow,
  resolveDateRange,
  type DateFilter,
} from '@/domain/dates';
import { iso, local, makePayment } from './fixtures';

// Tests run in America/Sao_Paulo (UTC-3), see vitest.config.mts.
const now = local(2026, 11, 19, 14, 41);

function inRange(filter: DateFilter, date: Date): boolean {
  const range = resolveDateRange(filter, now);
  return range === null || isInDateRange(iso(date), range);
}

describe('resolveDateRange', () => {
  it('returns null for no date filter', () => {
    expect(resolveDateRange({ kind: 'all' }, now)).toBeNull();
    expect(resolveDateRange({ kind: 'custom', from: null, to: null }, now)).toBeNull();
  });

  it('Today covers the local day, both ends inclusive', () => {
    const today: DateFilter = { kind: 'preset', preset: 'today' };
    expect(inRange(today, local(2026, 11, 19, 0, 0))).toBe(true);
    expect(inRange(today, local(2026, 11, 19, 23, 59, 59, 999))).toBe(true);
    expect(inRange(today, local(2026, 11, 18, 23, 59, 59, 999))).toBe(false);
    expect(inRange(today, local(2026, 11, 20, 0, 0))).toBe(false);
  });

  it('uses local day boundaries, not UTC', () => {
    // 01:00 UTC on Nov 20 is still Nov 19 at 22:00 in Sao Paulo.
    const lateLocal = new Date('2026-11-20T01:00:00.000Z');
    expect(inRange({ kind: 'preset', preset: 'today' }, lateLocal)).toBe(true);
    // 02:00 UTC on Nov 19 is Nov 18 at 23:00 in Sao Paulo.
    const earlyUtc = new Date('2026-11-19T02:00:00.000Z');
    expect(inRange({ kind: 'preset', preset: 'today' }, earlyUtc)).toBe(false);
  });

  it('Last 7 days is today plus the 6 previous local days', () => {
    const last7: DateFilter = { kind: 'preset', preset: '7d' };
    expect(inRange(last7, local(2026, 11, 13, 0, 0))).toBe(true);
    expect(inRange(last7, local(2026, 11, 12, 23, 59, 59, 999))).toBe(false);
    expect(inRange(last7, local(2026, 11, 19, 23, 59))).toBe(true);
  });

  it('Last 30 days is today plus the 29 previous local days', () => {
    const last30: DateFilter = { kind: 'preset', preset: '30d' };
    expect(inRange(last30, local(2026, 10, 21, 0, 0))).toBe(true);
    expect(inRange(last30, local(2026, 10, 20, 23, 59, 59, 999))).toBe(false);
  });

  it('custom range is inclusive of both full local days', () => {
    const custom: DateFilter = { kind: 'custom', from: '2026-11-01', to: '2026-11-15' };
    expect(inRange(custom, local(2026, 11, 1, 0, 0))).toBe(true);
    expect(inRange(custom, local(2026, 11, 15, 23, 59, 59, 999))).toBe(true);
    expect(inRange(custom, local(2026, 10, 31, 23, 59, 59, 999))).toBe(false);
    expect(inRange(custom, local(2026, 11, 16, 0, 0))).toBe(false);
  });

  it('custom range with a single day covers that whole day', () => {
    const single: DateFilter = { kind: 'custom', from: '2026-11-10', to: '2026-11-10' };
    expect(inRange(single, local(2026, 11, 10, 0, 0))).toBe(true);
    expect(inRange(single, local(2026, 11, 10, 23, 59))).toBe(true);
    expect(inRange(single, local(2026, 11, 11, 0, 0))).toBe(false);
  });

  it('supports open-ended custom ranges', () => {
    expect(inRange({ kind: 'custom', from: '2026-11-10', to: null }, local(2030, 1, 1))).toBe(true);
    expect(inRange({ kind: 'custom', from: '2026-11-10', to: null }, local(2026, 11, 9))).toBe(
      false,
    );
    expect(inRange({ kind: 'custom', from: null, to: '2026-11-10' }, local(2020, 1, 1))).toBe(true);
    expect(inRange({ kind: 'custom', from: null, to: '2026-11-10' }, local(2026, 11, 11))).toBe(
      false,
    );
  });
});

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    expect(parseLocalDate('2026-11-01')?.getTime()).toBe(local(2026, 11, 1).getTime());
  });

  it.each(['2026-02-30', '2026-13-01', '2026-1-01', '11/01/2026', '', 'today'])(
    'rejects %j',
    (value) => {
      expect(parseLocalDate(value)).toBeNull();
    },
  );
});

describe('isValidCustomRange', () => {
  it('accepts ordered, equal and open ranges', () => {
    expect(isValidCustomRange('2026-11-01', '2026-11-15')).toBe(true);
    expect(isValidCustomRange('2026-11-01', '2026-11-01')).toBe(true);
    expect(isValidCustomRange('2026-11-01', null)).toBe(true);
    expect(isValidCustomRange(null, null)).toBe(true);
  });

  it('rejects reversed and malformed ranges', () => {
    expect(isValidCustomRange('2026-11-15', '2026-11-01')).toBe(false);
    expect(isValidCustomRange('2026-02-30', null)).toBe(false);
  });
});

describe('formatting', () => {
  it('formats table dates in local time as `Nov 19, 2:41 PM`', () => {
    expect(formatDateTime('2026-11-19T17:41:00.000Z')).toMatch(/^Nov 19, 2:41\sPM$/);
  });

  it('formats the full timestamp with seconds, year and zone', () => {
    expect(formatFullTimestamp('2026-11-19T17:41:07.000Z')).toMatch(
      /^Nov 19, 2026, 2:41:07\sPM GMT-3$/,
    );
  });

  it('formats local dates for chips', () => {
    expect(formatLocalDate('2026-11-01')).toBe('Nov 1, 2026');
  });
});

describe('formatRelative', () => {
  it.each([
    [local(2026, 11, 19, 11, 41), '3 hours ago'],
    [local(2026, 11, 19, 14, 40), '1 minute ago'],
    [local(2026, 11, 19, 14, 40, 30), '30 seconds ago'],
    [local(2026, 11, 17, 14, 41), '2 days ago'],
    [local(2026, 9, 19, 14, 41), '2 months ago'],
    [local(2024, 11, 19, 14, 41), '2 years ago'],
    [local(2026, 11, 19, 16, 41), 'in 2 hours'],
    [local(2026, 11, 19, 14, 41), 'now'],
    [local(2026, 11, 19, 14, 40, 59, 600), 'now'],
  ])('formats %s as %s', (date, expected) => {
    expect(formatRelative(iso(date), now)).toBe(expected);
  });
});

describe('rebaseToNow', () => {
  const anchor = '2026-11-19T18:00:00.000Z';
  const payments = [
    makePayment({ created: '2026-11-19T17:52:00.000Z' }),
    makePayment({
      status: 'refunded',
      created: '2026-11-10T12:00:00.000Z',
      refundedAt: '2026-11-12T12:00:00.000Z',
    }),
  ];

  it('returns the same dates when now is not past the anchor', () => {
    expect(rebaseToNow(payments, anchor, new Date(anchor))).toEqual(payments);
  });

  it('shifts created and refundedAt by whole days and never into the future', () => {
    const later = new Date('2026-11-25T09:30:00.000Z');
    const rebased = rebaseToNow(payments, anchor, later);
    expect(rebased[0].created).toBe('2026-11-24T17:52:00.000Z');
    expect(rebased[1].created).toBe('2026-11-15T12:00:00.000Z');
    expect(rebased[1].refundedAt).toBe('2026-11-17T12:00:00.000Z');
    expect(rebased.every((p) => Date.parse(p.created) <= later.getTime())).toBe(true);
  });

  it('does not mutate the input', () => {
    rebaseToNow(payments, anchor, new Date('2026-12-01T00:00:00.000Z'));
    expect(payments[0].created).toBe('2026-11-19T17:52:00.000Z');
  });

  it('does not add refundedAt to payments without one', () => {
    const rebased = rebaseToNow(payments, anchor, new Date('2026-12-01T00:00:00.000Z'));
    expect(rebased[0]).not.toHaveProperty('refundedAt');
  });
});
