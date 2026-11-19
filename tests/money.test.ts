import { describe, expect, it } from 'vitest';
import {
  currencyFractionDigits,
  formatAmount,
  formatCurrencyCode,
  toMajor,
  toMinor,
  toMinorBound,
} from '@/domain/money';

describe('formatAmount', () => {
  it.each([
    [123456, 'usd', '$1,234.56'],
    [1200, 'eur', '€12.00'],
    [1599, 'gbp', '£15.99'],
    [9999, 'brl', 'R$99.99'],
    [1050, 'cad', 'CA$10.50'],
    [1050, 'aud', 'A$10.50'],
    [5000, 'jpy', '¥5,000'],
    [5000, 'krw', '₩5,000'],
  ])('formats %i %s as %s', (minor, currency, expected) => {
    expect(formatAmount(minor, currency)).toBe(expected);
  });

  it('formats zero-decimal currencies without decimals', () => {
    expect(formatAmount(1, 'jpy')).toBe('¥1');
    expect(formatAmount(500000, 'jpy')).toBe('¥500,000');
    expect(formatAmount(12345, 'krw')).toBe('₩12,345');
  });

  it('keeps two decimals for sub-unit amounts', () => {
    expect(formatAmount(1, 'usd')).toBe('$0.01');
    expect(formatAmount(10, 'eur')).toBe('€0.10');
  });

  it('formats zero and negative amounts', () => {
    expect(formatAmount(0, 'usd')).toBe('$0.00');
    expect(formatAmount(0, 'jpy')).toBe('¥0');
    expect(formatAmount(-1999, 'usd')).toBe('-$19.99');
  });

  it('accepts uppercase codes', () => {
    expect(formatAmount(1999, 'USD')).toBe('$19.99');
  });

  it('rejects non-integer minor units', () => {
    expect(() => formatAmount(19.99, 'usd')).toThrow(RangeError);
    expect(() => formatAmount(Number.NaN, 'usd')).toThrow(RangeError);
  });
});

describe('currencyFractionDigits', () => {
  it('returns 2 for decimal currencies and 0 for zero-decimal ones', () => {
    expect(currencyFractionDigits('usd')).toBe(2);
    expect(currencyFractionDigits('brl')).toBe(2);
    expect(currencyFractionDigits('jpy')).toBe(0);
    expect(currencyFractionDigits('krw')).toBe(0);
  });
});

describe('toMinor / toMajor', () => {
  it('converts major to minor units', () => {
    expect(toMinor(12.34, 'usd')).toBe(1234);
    expect(toMinor(10, 'usd')).toBe(1000);
    expect(toMinor(5000, 'jpy')).toBe(5000);
  });

  it('rounds floating point noise to the nearest minor unit', () => {
    expect(toMinor(19.99, 'usd')).toBe(1999);
    expect(toMinor(0.1 + 0.2, 'usd')).toBe(30);
    expect(toMinor(0.005, 'usd')).toBe(1);
    expect(toMinor(-0.005, 'usd')).toBe(-1);
    expect(toMinor(1.005, 'usd')).toBe(101);
    expect(toMinor(2.675, 'usd')).toBe(268);
  });

  it('never returns negative zero', () => {
    expect(toMinor(-0.001, 'usd')).toBe(0);
    expect(toMinor(-0, 'usd')).toBe(0);
  });

  it('rejects non-finite input', () => {
    expect(() => toMinor(Number.NaN, 'usd')).toThrow(RangeError);
    expect(() => toMinor(Number.POSITIVE_INFINITY, 'usd')).toThrow(RangeError);
  });
});

describe('currency code handling', () => {
  it('throws on malformed codes so callers must validate untrusted input', () => {
    expect(() => formatAmount(100, 'xx')).toThrow(RangeError);
  });

  it('converts minor to major units', () => {
    expect(toMajor(1234, 'usd')).toBe(12.34);
    expect(toMajor(5000, 'jpy')).toBe(5000);
  });

  it('round-trips', () => {
    for (const minor of [0, 1, 99, 1999, 123456]) {
      expect(toMinor(toMajor(minor, 'eur'), 'eur')).toBe(minor);
    }
  });
});

describe('formatCurrencyCode', () => {
  it('uppercases the ISO code', () => {
    expect(formatCurrencyCode('usd')).toBe('USD');
    expect(formatCurrencyCode('jpy')).toBe('JPY');
  });
});

describe('toMinorBound', () => {
  it('rounds a minimum up and a maximum down', () => {
    expect(toMinorBound(10.005, 'usd', 'min')).toBe(1001);
    expect(toMinorBound(10.005, 'usd', 'max')).toBe(1000);
    expect(toMinorBound(10.5, 'jpy', 'min')).toBe(11);
    expect(toMinorBound(10.5, 'jpy', 'max')).toBe(10);
  });

  it('keeps exact values and ignores float noise', () => {
    expect(toMinorBound(19.99, 'usd', 'min')).toBe(1999);
    expect(toMinorBound(19.99, 'usd', 'max')).toBe(1999);
    expect(toMinorBound(0.1 + 0.2, 'usd', 'max')).toBe(30);
  });

  it('rejects non-finite input', () => {
    expect(() => toMinorBound(Number.NaN, 'usd', 'min')).toThrow(RangeError);
  });
});
