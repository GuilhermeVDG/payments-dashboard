/** Pure display helpers shared by table cells, tooltips and accessible labels. */
import {
  assertNever,
  type CardBrand,
  type PaymentMethod,
  type PaymentMethodType,
  type Status,
  type Wallet,
} from './payment';

export const STATUS_LABELS: Record<Status, string> = {
  succeeded: 'Succeeded',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  card: 'Card',
  ach: 'ACH',
  wallet: 'Wallet',
};

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

export const WALLET_LABELS: Record<Wallet, string> = {
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

/** Masked last 4 as shown in the table: `•••• 4242`. */
export function maskedLast4(last4: string): string {
  return `•••• ${last4}`;
}

/**
 * Short payment id: prefix, the first 3 characters after it, an ellipsis and the
 * last 4 characters: `pi_3NxAbC…k2Yt` -> `pi_3Nx…k2Yt`.
 */
export function shortenPaymentId(id: string): string {
  const separator = id.indexOf('_');
  const head = separator >= 0 ? separator + 4 : 6;
  if (id.length <= head + 5) return id;
  return `${id.slice(0, head)}…${id.slice(-4)}`;
}

/** Full sentence for screen readers and tooltips: `Visa ending in 4242`. */
export function describeMethod(method: PaymentMethod): string {
  switch (method.type) {
    case 'card':
      return `${CARD_BRAND_LABELS[method.brand]} ending in ${method.last4}`;
    case 'ach':
      return `${method.bankName} account ending in ${method.last4}`;
    case 'wallet':
      return `${WALLET_LABELS[method.wallet]}, ${CARD_BRAND_LABELS[method.brand]} ending in ${method.last4}`;
    default:
      return assertNever(method);
  }
}

export interface DetailRow {
  label: string;
  value: string;
}

/** Rows for the details page "Payment method" section. */
export function methodDetails(method: PaymentMethod): DetailRow[] {
  const number = { label: 'Number', value: maskedLast4(method.last4) };
  switch (method.type) {
    case 'card':
      return [
        { label: 'Type', value: 'Card' },
        { label: 'Brand', value: CARD_BRAND_LABELS[method.brand] },
        number,
      ];
    case 'ach':
      return [
        { label: 'Type', value: 'ACH Direct Debit' },
        { label: 'Bank', value: method.bankName },
        { label: 'Account', value: maskedLast4(method.last4) },
      ];
    case 'wallet':
      return [
        { label: 'Type', value: 'Card' },
        { label: 'Wallet', value: WALLET_LABELS[method.wallet] },
        { label: 'Brand', value: CARD_BRAND_LABELS[method.brand] },
        number,
      ];
    default:
      return assertNever(method);
  }
}
