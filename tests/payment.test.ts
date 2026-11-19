import { describe, expect, it } from 'vitest';
import { assertNever, isPayment, isPaymentMethod, type Payment } from '@/domain/payment';

const base: Payment = {
  id: 'pi_3NxAbCdEfGhIjKlMnOpQk2Yt',
  amount: 1999,
  currency: 'usd',
  status: 'succeeded',
  customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
  method: { type: 'card', brand: 'visa', last4: '4242' },
  created: '2026-11-19T17:41:00.000Z',
  description: 'Subscription update',
};

describe('isPayment', () => {
  it('accepts a valid payment of each method type', () => {
    expect(isPayment(base)).toBe(true);
    expect(
      isPayment({ ...base, method: { type: 'ach', bankName: 'STRIPE TEST BANK', last4: '6789' } }),
    ).toBe(true);
    expect(
      isPayment({
        ...base,
        method: { type: 'wallet', wallet: 'apple_pay', brand: 'mastercard', last4: '4444' },
      }),
    ).toBe(true);
  });

  it('accepts a payment without a description', () => {
    const withoutDescription: Payment = { ...base };
    delete withoutDescription.description;
    expect(isPayment(withoutDescription)).toBe(true);
  });

  it('requires failureReason only on failed payments', () => {
    expect(isPayment({ ...base, status: 'failed', failureReason: 'Your card was declined.' })).toBe(
      true,
    );
    expect(isPayment({ ...base, status: 'failed' })).toBe(false);
    expect(isPayment({ ...base, failureReason: 'Your card was declined.' })).toBe(false);
  });

  it('requires refundedAt only on refunded payments, not before created', () => {
    expect(isPayment({ ...base, status: 'refunded', refundedAt: '2026-11-20T10:00:00.000Z' })).toBe(
      true,
    );
    expect(isPayment({ ...base, status: 'refunded' })).toBe(false);
    expect(isPayment({ ...base, status: 'refunded', refundedAt: '2026-11-18T10:00:00.000Z' })).toBe(
      false,
    );
    expect(isPayment({ ...base, refundedAt: '2026-11-20T10:00:00.000Z' })).toBe(false);
  });

  it.each([
    ['id without prefix', { id: 'ch_3NxAbCdEfGhIjKlMnOpQk2Yt' }],
    ['short id', { id: 'pi_abc' }],
    ['fractional amount', { amount: 19.99 }],
    ['zero amount', { amount: 0 }],
    ['unknown currency', { currency: 'chf' }],
    ['unknown status', { status: 'disputed' }],
    ['non-example email', { customer: { name: 'Ada', email: 'ada@gmail.com' } }],
    ['non-UTC created', { created: '2026-11-19T14:41:00-03:00' }],
    ['invalid created', { created: 'yesterday' }],
    ['bad last4', { method: { type: 'card', brand: 'visa', last4: '42' } }],
    ['unsafe integer amount', { amount: Number.MAX_SAFE_INTEGER + 2 }],
    ['infinite amount', { amount: Number.POSITIVE_INFINITY }],
    ['non-string description', { description: 42 }],
    ['created without Z', { created: '2026-11-19T17:41:00' }],
    ['impossible created date', { created: '2026-02-30T00:00:00Z' }],
    ['ach without bankName', { method: { type: 'ach', last4: '6789' } }],
    ['wallet without wallet key', { method: { type: 'wallet', brand: 'visa', last4: '4242' } }],
    ['refunded with invalid refundedAt', { status: 'refunded', refundedAt: 'not-a-date' }],
  ])('rejects %s', (_label, patch) => {
    expect(isPayment({ ...base, ...patch })).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(isPayment(null)).toBe(false);
    expect(isPayment('pi_123')).toBe(false);
  });
});

describe('isPaymentMethod', () => {
  it('rejects unknown types and brands', () => {
    expect(isPaymentMethod({ type: 'crypto', last4: '1234' })).toBe(false);
    expect(isPaymentMethod({ type: 'card', brand: 'jcb', last4: '1234' })).toBe(false);
    expect(
      isPaymentMethod({ type: 'wallet', wallet: 'apple_pay', brand: 'amex', last4: '1234' }),
    ).toBe(false);
    expect(isPaymentMethod({ type: 'ach', bankName: '', last4: '1234' })).toBe(false);
  });
});

describe('assertNever', () => {
  it('throws on unexpected values', () => {
    expect(() => assertNever('x' as never)).toThrow('Unexpected value: "x"');
  });
});
