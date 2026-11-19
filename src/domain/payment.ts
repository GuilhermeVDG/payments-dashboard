export const CURRENCIES = ['usd', 'eur', 'gbp', 'brl', 'cad', 'aud', 'jpy'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const STATUSES = ['succeeded', 'pending', 'failed', 'refunded'] as const;
export type Status = (typeof STATUSES)[number];

export const METHOD_TYPES = ['card', 'ach', 'wallet'] as const;
export type PaymentMethodType = (typeof METHOD_TYPES)[number];

export const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'discover'] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const WALLETS = ['apple_pay', 'google_pay'] as const;
export type Wallet = (typeof WALLETS)[number];

export const WALLET_CARD_BRANDS = ['visa', 'mastercard'] as const;
export type WalletCardBrand = (typeof WALLET_CARD_BRANDS)[number];

export type CardMethod = { type: 'card'; brand: CardBrand; last4: string };
export type AchMethod = { type: 'ach'; bankName: string; last4: string };
export type WalletMethod = {
  type: 'wallet';
  wallet: Wallet;
  brand: WalletCardBrand;
  last4: string;
};
export type PaymentMethod = CardMethod | AchMethod | WalletMethod;

export interface Customer {
  name: string;
  email: string;
}

export interface Payment {
  /** "pi_" followed by 24 base62 characters. */
  id: string;
  /** Integer amount in the currency's minor unit (jpy has no minor unit). */
  amount: number;
  currency: Currency;
  status: Status;
  customer: Customer;
  method: PaymentMethod;
  /** ISO 8601 timestamp in UTC. */
  created: string;
  description?: string;
  /** Present only when status is "failed". */
  failureReason?: string;
  /** ISO 8601 timestamp in UTC. Present only when status is "refunded". */
  refundedAt?: string;
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

const PAYMENT_ID_RE = /^pi_[0-9A-Za-z]{24}$/;
const LAST4_RE = /^\d{4}$/;
const ISO_UTC_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const EXAMPLE_EMAIL_RE = /^[^\s@]+@example\.com$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Type guard: is `value` one of the members of a const list. */
export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value);
}

/** Strict UTC ISO 8601 check that also rejects calendar overflow like Feb 30. */
function isIsoUtc(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_UTC_RE.test(value)) return false;
  const time = Date.parse(value);
  if (Number.isNaN(time)) return false;
  const normalized = value.includes('.') ? value : value.replace('Z', '.000Z');
  return new Date(time).toISOString() === normalized;
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  if (!isRecord(value) || typeof value.last4 !== 'string' || !LAST4_RE.test(value.last4)) {
    return false;
  }
  switch (value.type) {
    case 'card':
      return isOneOf(CARD_BRANDS, value.brand);
    case 'ach':
      return typeof value.bankName === 'string' && value.bankName.length > 0;
    case 'wallet':
      return isOneOf(WALLETS, value.wallet) && isOneOf(WALLET_CARD_BRANDS, value.brand);
    default:
      return false;
  }
}

/** Runtime check that a value matches the Payment contract, including status-specific fields. */
export function isPayment(value: unknown): value is Payment {
  if (!isRecord(value)) return false;
  const { id, amount, currency, status, customer, method, created } = value;
  if (typeof id !== 'string' || !PAYMENT_ID_RE.test(id)) return false;
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) return false;
  if (!isOneOf(CURRENCIES, currency) || !isOneOf(STATUSES, status)) return false;
  if (!isRecord(customer) || typeof customer.name !== 'string' || customer.name.length === 0) {
    return false;
  }
  if (typeof customer.email !== 'string' || !EXAMPLE_EMAIL_RE.test(customer.email)) return false;
  if (!isPaymentMethod(method) || !isIsoUtc(created)) return false;
  if (value.description !== undefined && typeof value.description !== 'string') return false;

  const hasFailure = value.failureReason !== undefined;
  const hasRefund = value.refundedAt !== undefined;
  if (status === 'failed') {
    if (typeof value.failureReason !== 'string' || value.failureReason.length === 0) return false;
  } else if (hasFailure) {
    return false;
  }
  if (status === 'refunded') {
    if (!isIsoUtc(value.refundedAt) || Date.parse(value.refundedAt) < Date.parse(created)) {
      return false;
    }
  } else if (hasRefund) {
    return false;
  }
  return true;
}

/** Finds a payment by exact id. */
export function findPayment(payments: readonly Payment[], id: string): Payment | undefined {
  return payments.find((p) => p.id === id);
}
