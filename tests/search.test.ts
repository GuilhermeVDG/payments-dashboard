import { describe, expect, it } from 'vitest';
import { matchesSearch } from '@/domain/search';
import { makePayment } from './fixtures';

const payment = makePayment({
  id: 'pi_3NxAbCdEfGhIjKlMnOpQk2Yt',
  customer: { name: 'Ada Lovelace', email: 'Ada.Lovelace@example.com' },
  method: { type: 'card', brand: 'visa', last4: '4242' },
});

describe('matchesSearch', () => {
  it('matches everything for an empty or blank query', () => {
    expect(matchesSearch(payment, '')).toBe(true);
    expect(matchesSearch(payment, '   ')).toBe(true);
  });

  it('matches the payment id by prefix, case-insensitive', () => {
    expect(matchesSearch(payment, 'pi_3Nx')).toBe(true);
    expect(matchesSearch(payment, 'PI_3NXAB')).toBe(true);
    expect(matchesSearch(payment, 'pi_3NxAbCdEfGhIjKlMnOpQk2Yt')).toBe(true);
  });

  it('does not match the id by substring', () => {
    expect(matchesSearch(payment, 'AbCdEf')).toBe(false);
  });

  it('matches the email by substring, case-insensitive', () => {
    expect(matchesSearch(payment, 'lovelace')).toBe(true);
    expect(matchesSearch(payment, 'ADA.LOVELACE@EXAMPLE.COM')).toBe(true);
    expect(matchesSearch(payment, '@example')).toBe(true);
  });

  it('matches last 4 exactly for 4-digit queries', () => {
    expect(matchesSearch(payment, '4242')).toBe(true);
    expect(matchesSearch(payment, ' 4242 ')).toBe(true);
    expect(matchesSearch(payment, '4241')).toBe(false);
  });

  it('does not match partial last 4', () => {
    expect(matchesSearch(payment, '424')).toBe(false);
    expect(matchesSearch(payment, '42424')).toBe(false);
  });

  it('matches ACH and wallet last 4', () => {
    const ach = makePayment({
      method: { type: 'ach', bankName: 'STRIPE TEST BANK', last4: '6789' },
    });
    const wallet = makePayment({
      method: { type: 'wallet', wallet: 'google_pay', brand: 'visa', last4: '1881' },
    });
    expect(matchesSearch(ach, '6789')).toBe(true);
    expect(matchesSearch(wallet, '1881')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(matchesSearch(payment, 'grace@example.com')).toBe(false);
  });
});
