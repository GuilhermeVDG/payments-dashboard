import { describe, expect, it } from 'vitest';
import type { Payment } from '@/domain/payment';
import { DEFAULT_SORT, normalizeSort, sortPayments, type SortRule } from '@/domain/sort';
import { makePayment } from './fixtures';

const ids = (rows: Payment[]) => rows.map((p) => p.id);

const a = makePayment({
  id: 'pi_3A00000000000000000000aa',
  amount: 500,
  status: 'failed',
  created: '2026-11-19T10:00:00.000Z',
});
const b = makePayment({
  id: 'pi_3B00000000000000000000bb',
  amount: 2500,
  status: 'succeeded',
  created: '2026-11-18T10:00:00.000Z',
});
const c = makePayment({
  id: 'pi_3C00000000000000000000cc',
  amount: 1000,
  status: 'pending',
  created: '2026-11-17T10:00:00.000Z',
});
const d = makePayment({
  id: 'pi_3D00000000000000000000dd',
  amount: 1000,
  status: 'refunded',
  created: '2026-11-16T10:00:00.000Z',
});
const rows = [c, a, d, b];

describe('sortPayments', () => {
  it('defaults to created desc', () => {
    expect(ids(sortPayments(rows, DEFAULT_SORT))).toEqual(ids([a, b, c, d]));
  });

  it('sorts by created asc', () => {
    expect(ids(sortPayments(rows, [{ key: 'created', desc: false }]))).toEqual(ids([d, c, b, a]));
  });

  it('sorts by amount asc and desc, breaking ties by created desc', () => {
    expect(ids(sortPayments(rows, [{ key: 'amount', desc: false }]))).toEqual(ids([a, c, d, b]));
    expect(ids(sortPayments(rows, [{ key: 'amount', desc: true }]))).toEqual(ids([b, c, d, a]));
  });

  it('sorts by status in business order: succeeded, pending, refunded, failed', () => {
    expect(ids(sortPayments(rows, [{ key: 'status', desc: false }]))).toEqual(ids([b, c, d, a]));
    expect(ids(sortPayments(rows, [{ key: 'status', desc: true }]))).toEqual(ids([a, d, c, b]));
  });

  it('compares amounts in minor units across currencies, without FX', () => {
    const yen = makePayment({ amount: 1500, currency: 'jpy', created: '2026-11-15T10:00:00.000Z' });
    const dollars = makePayment({
      amount: 1000,
      currency: 'usd',
      created: '2026-11-15T09:00:00.000Z',
    });
    expect(ids(sortPayments([yen, dollars], [{ key: 'amount', desc: true }]))).toEqual(
      ids([yen, dollars]),
    );
  });

  it('applies multi-column sort in priority order', () => {
    const rules: SortRule[] = [
      { key: 'amount', desc: true },
      { key: 'status', desc: false },
    ];
    // c and d share amount 1000; status breaks the tie (pending before refunded).
    expect(ids(sortPayments(rows, rules))).toEqual(ids([b, c, d, a]));
    const reversed: SortRule[] = [
      { key: 'amount', desc: true },
      { key: 'status', desc: true },
    ];
    expect(ids(sortPayments(rows, reversed))).toEqual(ids([b, d, c, a]));
  });

  it('breaks full ties by created desc, then id asc', () => {
    const created = '2026-11-10T10:00:00.000Z';
    const x = makePayment({ id: 'pi_3x00000000000000000000xx', created });
    const y = makePayment({ id: 'pi_3Y00000000000000000000yy', created });
    const older = makePayment({
      id: 'pi_3A00000000000000000000zz',
      created: '2026-11-09T10:00:00.000Z',
    });
    // Same amount and status for all; ids compared by code unit ('Y' < 'x').
    expect(ids(sortPayments([x, older, y], [{ key: 'amount', desc: false }]))).toEqual(
      ids([y, x, older]),
    );
  });

  it('is stable regardless of input order', () => {
    const shuffled = [d, b, a, c];
    const rules: SortRule[] = [{ key: 'status', desc: false }];
    expect(ids(sortPayments(shuffled, rules))).toEqual(ids(sortPayments(rows, rules)));
  });

  it('does not mutate the input', () => {
    const input = [...rows];
    sortPayments(input, [{ key: 'amount', desc: true }]);
    expect(input).toEqual(rows);
  });

  it('handles an empty list', () => {
    expect(sortPayments([], DEFAULT_SORT)).toEqual([]);
  });
});

describe('normalizeSort', () => {
  it('keeps the first occurrence of each key', () => {
    expect(
      normalizeSort([
        { key: 'amount', desc: true },
        { key: 'created', desc: true },
        { key: 'amount', desc: false },
      ]),
    ).toEqual([
      { key: 'amount', desc: true },
      { key: 'created', desc: true },
    ]);
  });
});
