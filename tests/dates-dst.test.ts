import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isInDateRange, resolveDateRange, type DateFilter } from '@/domain/dates';

// Sao Paulo (the default test zone) has no DST, so check local-day boundaries in a
// zone that does. Node re-reads process.env.TZ for local Date math at runtime.
const ORIGINAL_TZ = process.env.TZ;

beforeAll(() => {
  process.env.TZ = 'America/New_York';
});

afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

function rangeFor(filter: DateFilter, now: Date) {
  const range = resolveDateRange(filter, now);
  if (!range) throw new Error('expected a range');
  return range;
}

describe('date ranges across DST (America/New_York)', () => {
  it('runs in the DST zone', () => {
    expect(new Date('2026-07-01T12:00:00Z').getTimezoneOffset()).toBe(240);
    expect(new Date('2026-12-01T12:00:00Z').getTimezoneOffset()).toBe(300);
  });

  it('Last 7 days starts at local midnight across the November DST end', () => {
    // DST ends Nov 1, 2026. Now: Nov 5, 10:00 EST. Range starts Oct 30, 00:00 EDT.
    const now = new Date('2026-11-05T15:00:00.000Z');
    const range = rangeFor({ kind: 'preset', preset: '7d' }, now);
    expect(new Date(range.start ?? 0).toISOString()).toBe('2026-10-30T04:00:00.000Z');
    expect(new Date(range.end ?? 0).toISOString()).toBe('2026-11-06T04:59:59.999Z');
  });

  it('custom range over the March DST start covers both full local days', () => {
    // DST starts Mar 8, 2026: that local day has 23 hours.
    const range = rangeFor({ kind: 'custom', from: '2026-03-08', to: '2026-03-08' }, new Date());
    expect(new Date(range.start ?? 0).toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(new Date(range.end ?? 0).toISOString()).toBe('2026-03-09T03:59:59.999Z');
    expect(isInDateRange('2026-03-09T03:30:00.000Z', range)).toBe(true);
    expect(isInDateRange('2026-03-09T04:00:00.000Z', range)).toBe(false);
  });
});
