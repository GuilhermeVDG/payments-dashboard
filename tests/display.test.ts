import { describe, expect, it } from 'vitest';
import { describeMethod, maskedLast4, shortenPaymentId, STATUS_LABELS } from '@/domain/display';

describe('shortenPaymentId', () => {
  it('keeps the prefix, 3 characters, an ellipsis and the last 4', () => {
    expect(shortenPaymentId('pi_3NxAbCdEfGhIjKlMnOpQk2Yt')).toBe('pi_3Nx…k2Yt');
  });

  it('uses a 6 character head for ids without an underscore', () => {
    expect(shortenPaymentId('3NxAbCdEfGhIjKlMnOpQk2Yt')).toBe('3NxAbC…k2Yt');
  });

  it('leaves short ids unchanged', () => {
    expect(shortenPaymentId('pi_3Nx12345')).toBe('pi_3Nx12345');
  });
});

describe('maskedLast4', () => {
  it('masks with four bullets', () => {
    expect(maskedLast4('4242')).toBe('•••• 4242');
  });
});

describe('describeMethod', () => {
  it('describes cards, ACH and wallets', () => {
    expect(describeMethod({ type: 'card', brand: 'amex', last4: '0005' })).toBe(
      'American Express ending in 0005',
    );
    expect(describeMethod({ type: 'ach', bankName: 'STRIPE TEST BANK', last4: '6789' })).toBe(
      'STRIPE TEST BANK account ending in 6789',
    );
    expect(
      describeMethod({ type: 'wallet', wallet: 'apple_pay', brand: 'visa', last4: '4242' }),
    ).toBe('Apple Pay, Visa ending in 4242');
  });
});

describe('STATUS_LABELS', () => {
  it('labels every status', () => {
    expect(Object.values(STATUS_LABELS)).toEqual(['Succeeded', 'Pending', 'Failed', 'Refunded']);
  });
});
