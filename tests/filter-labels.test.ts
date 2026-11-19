import { describe, expect, it } from 'vitest';
import {
  amountFilterLabel,
  currencyFilterLabel,
  dateFilterLabel,
  listLabel,
  methodFilterLabel,
  statusFilterLabel,
} from '@/domain/filter-labels';

describe('listLabel', () => {
  it('joins up to three labels and collapses longer lists', () => {
    expect(listLabel(['Failed'])).toBe('Failed');
    expect(listLabel(['Failed', 'Refunded', 'Pending'])).toBe('Failed, Refunded, Pending');
    expect(listLabel(['A', 'B', 'C', 'D'])).toBe('A, B +2');
  });
});

describe('statusFilterLabel / methodFilterLabel', () => {
  it('labels selections and returns null when empty', () => {
    expect(statusFilterLabel(['failed', 'refunded'])).toBe('Failed, Refunded');
    expect(statusFilterLabel([])).toBeNull();
    expect(methodFilterLabel(['card', 'ach'])).toBe('Card, ACH');
    expect(methodFilterLabel([])).toBeNull();
  });
});

describe('dateFilterLabel', () => {
  it('labels presets', () => {
    expect(dateFilterLabel({ kind: 'preset', preset: 'today' })).toBe('Today');
    expect(dateFilterLabel({ kind: 'preset', preset: '7d' })).toBe('Last 7 days');
    expect(dateFilterLabel({ kind: 'preset', preset: '30d' })).toBe('Last 30 days');
  });

  it('labels custom ranges, single days and open ends', () => {
    expect(dateFilterLabel({ kind: 'custom', from: '2026-11-01', to: '2026-11-15' })).toBe(
      'Nov 1, 2026 – Nov 15, 2026',
    );
    expect(dateFilterLabel({ kind: 'custom', from: '2026-11-01', to: '2026-11-01' })).toBe(
      'Nov 1, 2026',
    );
    expect(dateFilterLabel({ kind: 'custom', from: '2026-11-01', to: null })).toBe(
      'On or after Nov 1, 2026',
    );
    expect(dateFilterLabel({ kind: 'custom', from: null, to: '2026-11-15' })).toBe(
      'On or before Nov 15, 2026',
    );
  });

  it('returns null without a date filter', () => {
    expect(dateFilterLabel({ kind: 'all' })).toBeNull();
    expect(dateFilterLabel({ kind: 'custom', from: null, to: null })).toBeNull();
  });
});

describe('amountFilterLabel', () => {
  it('formats bounds in the selected currency', () => {
    expect(amountFilterLabel({ min: 10, max: 500, currency: 'usd' })).toBe('$10.00 – $500.00');
    expect(amountFilterLabel({ min: 5000, max: null, currency: 'jpy' })).toBe('≥ ¥5,000');
  });

  it('formats plain numbers for any currency', () => {
    expect(amountFilterLabel({ min: 10, max: 500, currency: null })).toBe('10 – 500');
    expect(amountFilterLabel({ min: null, max: 10.5, currency: null })).toBe('≤ 10.5');
    expect(amountFilterLabel({ min: 10, max: 10, currency: null })).toBe('10');
  });

  it('returns null without bounds', () => {
    expect(amountFilterLabel({ min: null, max: null, currency: 'usd' })).toBeNull();
  });
});

describe('currencyFilterLabel', () => {
  it('uppercases the code or returns null', () => {
    expect(currencyFilterLabel('eur')).toBe('EUR');
    expect(currencyFilterLabel(null)).toBeNull();
  });
});
