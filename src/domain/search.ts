import type { Payment } from './payment';

const LAST4_QUERY_RE = /^\d{4}$/;

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Search matches any of:
 * - payment id, by prefix or full id, case-insensitive (`pi_3nx`)
 * - customer email, by substring, case-insensitive (`example.com`)
 * - card or account last 4 digits, exact, only for 4-digit queries (`4242`)
 * An empty query matches everything.
 */
export function matchesSearch(payment: Payment, query: string): boolean {
  const q = normalizeQuery(query);
  if (q === '') return true;
  if (payment.id.toLowerCase().startsWith(q)) return true;
  if (payment.customer.email.toLowerCase().includes(q)) return true;
  return LAST4_QUERY_RE.test(q) && payment.method.last4 === q;
}
