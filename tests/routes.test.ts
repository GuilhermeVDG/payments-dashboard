import { describe, expect, it } from 'vitest';
import { paymentHref, paymentsListHref } from '@/domain/routes';

describe('paymentHref', () => {
  it('builds the details path and encodes the id', () => {
    expect(paymentHref('pi_3Abc')).toBe('/payments/pi_3Abc');
    expect(paymentHref('a/b')).toBe('/payments/a%2Fb');
  });
});

describe('paymentsListHref', () => {
  it('restores a stored list query', () => {
    expect(paymentsListHref('?status=failed&page=2')).toBe('/payments?status=failed&page=2');
  });

  it.each([null, undefined, '', '?', 'status=failed', '?a=1#x', '?a= b', `?q=${'x'.repeat(2001)}`])(
    'falls back to the plain list for %j',
    (value) => {
      expect(paymentsListHref(value)).toBe('/payments');
    },
  );
});
