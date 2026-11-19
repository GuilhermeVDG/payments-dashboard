import type { Payment } from '@/domain/payment';

let counter = 0;

/** Builds a valid payment; ids are unique and sort in creation order of the fixture calls. */
export function makePayment(overrides: Partial<Payment> = {}): Payment {
  counter += 1;
  const suffix = String(counter).padStart(4, '0');
  return {
    id: `pi_3TestFixture00000000${suffix}`,
    amount: 1999,
    currency: 'usd',
    status: 'succeeded',
    customer: { name: 'Ada Lovelace', email: `ada${suffix}@example.com` },
    method: { type: 'card', brand: 'visa', last4: '1111' },
    created: '2026-11-19T12:00:00.000Z',
    ...overrides,
  };
}

/** Local wall-clock time in the test time zone (America/Sao_Paulo, UTC-3). */
export function local(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute, second, ms);
}

export function iso(date: Date): string {
  return date.toISOString();
}
