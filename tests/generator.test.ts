import { describe, expect, it } from 'vitest';
import committed from '@/data/payments.json';
import { isPayment, type Payment } from '@/domain/payment';
import {
  DATA_ANCHOR,
  DEFAULT_COUNT,
  DEFAULT_DAYS,
  generatePayments,
  mulberry32,
} from '../scripts/lib/payments-generator';

const DAY_MS = 86_400_000;
const payments = generatePayments();

function share(rows: Payment[], predicate: (p: Payment) => boolean): number {
  return rows.filter(predicate).length / rows.length;
}

describe('mulberry32', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const values = Array.from({ length: 1000 }, () => a());
    expect(Array.from({ length: 1000 }, () => b())).toEqual(values);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(mulberry32(43)()).not.toBe(values[0]);
  });
});

describe('generatePayments', () => {
  it('is deterministic across runs', () => {
    expect(generatePayments()).toEqual(payments);
  });

  it('matches the committed src/data/payments.json', () => {
    expect(committed).toEqual(payments);
  });

  it('produces a different dataset for a different seed', () => {
    expect(generatePayments({ seed: 1 })[0].id).not.toBe(payments[0].id);
  });

  it('produces the default number of rows with unique ids', () => {
    expect(payments).toHaveLength(DEFAULT_COUNT);
    expect(new Set(payments.map((p) => p.id)).size).toBe(DEFAULT_COUNT);
  });

  it('makes every row match the Payment type', () => {
    const invalid = payments.filter((p) => !isPayment(p));
    expect(invalid).toEqual([]);
  });

  it('places every payment within the window before the anchor', () => {
    const anchor = Date.parse(DATA_ANCHOR);
    for (const p of payments) {
      const created = Date.parse(p.created);
      expect(created).toBeLessThanOrEqual(anchor);
      expect(created).toBeGreaterThan(anchor - (DEFAULT_DAYS + 1) * DAY_MS);
      if (p.refundedAt) expect(Date.parse(p.refundedAt)).toBeLessThanOrEqual(anchor);
    }
  });

  it('is sorted by created desc', () => {
    for (let i = 1; i < payments.length; i++) {
      expect(payments[i - 1].created >= payments[i].created).toBe(true);
    }
  });

  it('has more volume per day on weekdays than on weekends', () => {
    const isWeekend = (p: Payment) => [0, 6].includes(new Date(p.created).getUTCDay());
    const weekendPerDay = share(payments, isWeekend) / 2;
    const weekdayPerDay = (1 - share(payments, isWeekend)) / 5;
    expect(weekdayPerDay).toBeGreaterThan(weekendPerDay * 1.5);
  });

  it.each([
    ['succeeded', 0.78],
    ['pending', 0.08],
    ['failed', 0.09],
    ['refunded', 0.05],
  ] as const)('has about %s at %d', (status, target) => {
    expect(share(payments, (p) => p.status === status)).toBeCloseTo(target, 1);
  });

  it.each([
    ['card', 0.75],
    ['ach', 0.12],
    ['wallet', 0.13],
  ] as const)('has about %s at %d', (type, target) => {
    expect(share(payments, (p) => p.method.type === type)).toBeCloseTo(target, 1);
  });

  it('uses usd for most payments and includes every currency', () => {
    const usd = share(payments, (p) => p.currency === 'usd');
    expect(usd).toBeGreaterThan(0.45);
    for (const currency of ['eur', 'gbp', 'cad', 'brl', 'aud', 'jpy'] as const) {
      const s = share(payments, (p) => p.currency === currency);
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(usd);
    }
  });

  it('uses usd for every ACH debit', () => {
    expect(payments.filter((p) => p.method.type === 'ach' && p.currency !== 'usd')).toEqual([]);
  });

  it('keeps most amounts between 10 and 500 major units with a tail up to 5,000', () => {
    const majors = payments.filter((p) => p.currency !== 'jpy').map((p) => p.amount / 100);
    expect(majors.filter((a) => a >= 10 && a <= 500).length / majors.length).toBeGreaterThan(0.8);
    expect(Math.max(...majors)).toBeGreaterThan(500);
    expect(Math.max(...majors)).toBeLessThanOrEqual(5_000);
  });

  it('uses whole yen for jpy, scaled to realistic yen prices', () => {
    const yen = payments.filter((p) => p.currency === 'jpy');
    expect(yen.length).toBeGreaterThan(0);
    for (const p of yen) {
      expect(Number.isInteger(p.amount)).toBe(true);
      expect(p.amount).toBeGreaterThanOrEqual(100);
    }
  });

  it('includes 4242 cards so last-4 search has matches', () => {
    expect(payments.some((p) => p.method.last4 === '4242')).toBe(true);
  });
});
