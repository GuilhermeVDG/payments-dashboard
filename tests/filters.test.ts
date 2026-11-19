import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  applyFilters,
  isFilterActive,
  parseAmountInput,
  validateAmountRange,
  type FilterState,
} from '@/domain/filters';
import type { Payment } from '@/domain/payment';
import { iso, local, makePayment } from './fixtures';

const now = local(2026, 11, 19, 14, 41);
const ids = (rows: Payment[]) => rows.map((p) => p.id);
const withFilters = (patch: Partial<FilterState>): FilterState => ({ ...EMPTY_FILTERS, ...patch });

const usdCardToday = makePayment({
  amount: 1000,
  currency: 'usd',
  status: 'succeeded',
  method: { type: 'card', brand: 'visa', last4: '4242' },
  created: iso(local(2026, 11, 19, 9, 0)),
  customer: { name: 'Ada', email: 'ada@example.com' },
});
const usdAchWeekAgo = makePayment({
  amount: 50000,
  currency: 'usd',
  status: 'pending',
  method: { type: 'ach', bankName: 'STRIPE TEST BANK', last4: '6789' },
  created: iso(local(2026, 11, 13, 8, 0)),
  customer: { name: 'Grace', email: 'grace@example.com' },
});
const eurWalletOld = makePayment({
  amount: 1050,
  currency: 'eur',
  status: 'failed',
  failureReason: 'Insufficient funds',
  method: { type: 'wallet', wallet: 'apple_pay', brand: 'visa', last4: '1881' },
  created: iso(local(2026, 10, 1, 12, 0)),
  customer: { name: 'Linus', email: 'linus@example.com' },
});
const jpyCardRefunded = makePayment({
  amount: 5000,
  currency: 'jpy',
  status: 'refunded',
  refundedAt: iso(local(2026, 11, 18, 12, 0)),
  method: { type: 'card', brand: 'mastercard', last4: '4444' },
  created: iso(local(2026, 11, 18, 10, 0)),
  customer: { name: 'Yuki', email: 'yuki@example.com' },
});
const all = [usdCardToday, usdAchWeekAgo, eurWalletOld, jpyCardRefunded];

describe('applyFilters', () => {
  it('returns everything with empty filters', () => {
    expect(applyFilters(all, EMPTY_FILTERS, now)).toEqual(all);
  });

  it('handles an empty dataset', () => {
    expect(applyFilters([], withFilters({ status: ['failed'] }), now)).toEqual([]);
  });

  describe('date', () => {
    it.each([
      ['today', [usdCardToday]],
      ['7d', [usdCardToday, usdAchWeekAgo, jpyCardRefunded]],
      ['30d', [usdCardToday, usdAchWeekAgo, jpyCardRefunded]],
    ] as const)('filters the %s preset', (preset, expected) => {
      expect(
        ids(applyFilters(all, withFilters({ date: { kind: 'preset', preset } }), now)),
      ).toEqual(ids([...expected]));
    });

    it('filters a custom range inclusive of both days', () => {
      const date = { kind: 'custom', from: '2026-11-13', to: '2026-11-18' } as const;
      expect(ids(applyFilters(all, withFilters({ date }), now))).toEqual(
        ids([usdAchWeekAgo, jpyCardRefunded]),
      );
    });
  });

  it('filters by multiple statuses', () => {
    const result = applyFilters(all, withFilters({ status: ['failed', 'refunded'] }), now);
    expect(ids(result)).toEqual(ids([eurWalletOld, jpyCardRefunded]));
  });

  it('filters by multiple methods', () => {
    const result = applyFilters(all, withFilters({ method: ['ach', 'wallet'] }), now);
    expect(ids(result)).toEqual(ids([usdAchWeekAgo, eurWalletOld]));
  });

  describe('amount', () => {
    it('is inclusive of min and max, in major units of each payment currency', () => {
      const amount = { min: 10, max: 10.5, currency: null };
      // 10.00 usd and 10.50 eur match; 5,000 jpy and 500.00 usd do not.
      expect(ids(applyFilters(all, withFilters({ amount }), now))).toEqual(
        ids([usdCardToday, eurWalletOld]),
      );
    });

    it('restricts to a currency when one is selected', () => {
      const amount = { min: 10, max: 10.5, currency: 'eur' as const };
      expect(ids(applyFilters(all, withFilters({ amount }), now))).toEqual(ids([eurWalletOld]));
    });

    it('filters by currency alone', () => {
      const amount = { min: null, max: null, currency: 'jpy' as const };
      expect(ids(applyFilters(all, withFilters({ amount }), now))).toEqual(ids([jpyCardRefunded]));
    });

    it('treats jpy bounds as whole yen', () => {
      const amount = { min: 5000, max: 5000, currency: 'jpy' as const };
      expect(ids(applyFilters(all, withFilters({ amount }), now))).toEqual(ids([jpyCardRefunded]));
    });

    it('supports open-ended bounds', () => {
      expect(
        ids(
          applyFilters(all, withFilters({ amount: { min: 400, max: null, currency: null } }), now),
        ),
      ).toEqual(ids([usdAchWeekAgo, jpyCardRefunded]));
      expect(
        ids(
          applyFilters(all, withFilters({ amount: { min: null, max: 10, currency: null } }), now),
        ),
      ).toEqual(ids([usdCardToday]));
    });

    it('ignores an invalid range instead of returning nothing', () => {
      const amount = { min: 500, max: 10, currency: null };
      expect(applyFilters(all, withFilters({ amount }), now)).toEqual(all);
    });

    it('compares fractional bounds exactly in minor units', () => {
      const p1010 = makePayment({ amount: 1010, currency: 'usd' });
      const p1009 = makePayment({ amount: 1009, currency: 'usd' });
      const amount = { min: 10.1, max: 10.1, currency: null };
      expect(ids(applyFilters([p1010, p1009], withFilters({ amount }), now))).toEqual(ids([p1010]));
    });

    it('rounds a fractional jpy minimum up to whole yen', () => {
      const yen10 = makePayment({ amount: 10, currency: 'jpy' });
      const yen11 = makePayment({ amount: 11, currency: 'jpy' });
      const amount = { min: 10.5, max: null, currency: 'jpy' as const };
      expect(ids(applyFilters([yen10, yen11], withFilters({ amount }), now))).toEqual(ids([yen11]));
    });

    it('never widens a maximum: rounds it down to the minor unit', () => {
      const yen10 = makePayment({ amount: 10, currency: 'jpy' });
      const yen11 = makePayment({ amount: 11, currency: 'jpy' });
      const jpyMax = { min: null, max: 10.5, currency: 'jpy' as const };
      expect(ids(applyFilters([yen10, yen11], withFilters({ amount: jpyMax }), now))).toEqual(
        ids([yen10]),
      );
      const cents1000 = makePayment({ amount: 1000, currency: 'usd' });
      const cents1001 = makePayment({ amount: 1001, currency: 'usd' });
      const usdMax = { min: null, max: 10.005, currency: 'usd' as const };
      expect(
        ids(applyFilters([cents1000, cents1001], withFilters({ amount: usdMax }), now)),
      ).toEqual(ids([cents1000]));
    });

    it('never widens a minimum: rounds it up to the minor unit', () => {
      const cents1000 = makePayment({ amount: 1000, currency: 'usd' });
      const cents1001 = makePayment({ amount: 1001, currency: 'usd' });
      const usdMin = { min: 10.005, max: null, currency: 'usd' as const };
      expect(
        ids(applyFilters([cents1000, cents1001], withFilters({ amount: usdMin }), now)),
      ).toEqual(ids([cents1001]));
    });

    it('keeps the currency when the bounds are invalid', () => {
      const amount = { min: 500, max: 10, currency: 'eur' as const };
      expect(ids(applyFilters(all, withFilters({ amount }), now))).toEqual(ids([eurWalletOld]));
    });

    it('ignores non-finite bounds without throwing', () => {
      const amount = { min: Number.POSITIVE_INFINITY, max: null, currency: null };
      expect(applyFilters(all, withFilters({ amount }), now)).toEqual(all);
    });
  });

  it('filters by search query', () => {
    expect(ids(applyFilters(all, withFilters({ query: '4242' }), now))).toEqual(
      ids([usdCardToday]),
    );
    expect(ids(applyFilters(all, withFilters({ query: 'grace' }), now))).toEqual(
      ids([usdAchWeekAgo]),
    );
  });

  it('matches nothing on the Disputed and Uncaptured tabs', () => {
    expect(applyFilters(all, withFilters({ statusTab: 'disputed' }), now)).toEqual([]);
    expect(applyFilters(all, withFilters({ statusTab: 'uncaptured' }), now)).toEqual([]);
  });

  it('combines filters with AND', () => {
    const filters = withFilters({
      date: { kind: 'preset', preset: '7d' },
      method: ['card'],
      status: ['succeeded', 'refunded'],
      amount: { min: null, max: null, currency: 'usd' },
    });
    expect(ids(applyFilters(all, filters, now))).toEqual(ids([usdCardToday]));
  });

  it('returns nothing when filters exclude every row', () => {
    const filters = withFilters({ status: ['failed'], method: ['ach'] });
    expect(applyFilters(all, filters, now)).toEqual([]);
  });
});

describe('validateAmountRange', () => {
  it('accepts empty, open and ordered ranges', () => {
    expect(validateAmountRange(null, null)).toBeNull();
    expect(validateAmountRange(10, null)).toBeNull();
    expect(validateAmountRange(null, 10)).toBeNull();
    expect(validateAmountRange(10, 10)).toBeNull();
    expect(validateAmountRange(0, 500)).toBeNull();
  });

  it('rejects min greater than max', () => {
    expect(validateAmountRange(500, 10)).toBe('min-greater-than-max');
  });

  it('rejects non-finite amounts', () => {
    expect(validateAmountRange(Number.NaN, null)).toBe('invalid');
    expect(validateAmountRange(null, Number.POSITIVE_INFINITY)).toBe('invalid');
  });

  it('rejects non-finite amounts', () => {
    expect(validateAmountRange(Number.NaN, null)).toBe('invalid');
    expect(validateAmountRange(null, Number.POSITIVE_INFINITY)).toBe('invalid');
  });

  it('rejects negative amounts', () => {
    expect(validateAmountRange(-1, 10)).toBe('negative');
    expect(validateAmountRange(null, -5)).toBe('negative');
  });
});

describe('isFilterActive', () => {
  it('is false for empty filters and a blank query', () => {
    expect(isFilterActive(EMPTY_FILTERS)).toBe(false);
    expect(isFilterActive(withFilters({ query: '  ' }))).toBe(false);
  });

  it('is true when any filter is set', () => {
    expect(isFilterActive(withFilters({ status: ['failed'] }))).toBe(true);
    expect(isFilterActive(withFilters({ date: { kind: 'preset', preset: 'today' } }))).toBe(true);
    expect(isFilterActive(withFilters({ amount: { min: null, max: null, currency: 'usd' } }))).toBe(
      true,
    );
    expect(isFilterActive(withFilters({ query: '4242' }))).toBe(true);
    expect(isFilterActive(withFilters({ statusTab: 'disputed' }))).toBe(true);
  });
});

describe('parseAmountInput', () => {
  it('parses plain decimals and thousands separators', () => {
    expect(parseAmountInput('10')).toBe(10);
    expect(parseAmountInput(' 10.50 ')).toBe(10.5);
    expect(parseAmountInput('1,250.99')).toBe(1250.99);
    expect(parseAmountInput('12,345,678')).toBe(12345678);
  });

  it('treats empty input as no bound', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('   ')).toBeNull();
  });

  it.each(['abc', '-5', '1e3', '10.', '.5', 'Infinity', '1,0', '1,2,3', '12,34.5'])(
    'marks %j as invalid',
    (input) => {
      expect(validateAmountRange(parseAmountInput(input), null)).toBe('invalid');
    },
  );
});
