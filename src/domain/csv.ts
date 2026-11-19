/**
 * CSV export of the current filtered and sorted view. RFC 4180: comma separated,
 * CRLF line endings, fields quoted when needed and quotes doubled.
 */
import { toLocalDate } from './dates';
import { METHOD_TYPE_LABELS, STATUS_LABELS, CARD_BRAND_LABELS, WALLET_LABELS } from './display';
import { currencyFractionDigits, formatCurrencyCode, toMajor } from './money';
import { assertNever, type Payment, type PaymentMethod } from './payment';

export const CSV_BOM = '\uFEFF';

const NEEDS_QUOTES = /[",\r\n]|^\s|\s$/;
/** Spreadsheet apps evaluate cells starting with these characters as formulas. */
const FORMULA_START = /^[=+\-@\t\r]/;

/** Escapes one field; text fields are neutralised against formula injection. */
export function escapeCsvField(value: string, { text = true } = {}): string {
  const safe = text && FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const decimalFormatters = new Map<number, Intl.NumberFormat>();

/** Machine-readable amount in major units: `1234.50`, `5000` for jpy. No grouping. */
export function csvAmount(minor: number, currency: string): string {
  const digits = currencyFractionDigits(currency);
  let formatter = decimalFormatters.get(digits);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      useGrouping: false,
    });
    decimalFormatters.set(digits, formatter);
  }
  return formatter.format(toMajor(minor, currency));
}

function methodColumns(method: PaymentMethod): [brandOrBank: string, wallet: string] {
  switch (method.type) {
    case 'card':
      return [CARD_BRAND_LABELS[method.brand], ''];
    case 'ach':
      return [method.bankName, ''];
    case 'wallet':
      return [CARD_BRAND_LABELS[method.brand], WALLET_LABELS[method.wallet]];
    default:
      return assertNever(method);
  }
}

export const CSV_HEADER = [
  'Payment ID',
  'Created (UTC)',
  'Amount',
  'Currency',
  'Status',
  'Customer name',
  'Customer email',
  'Payment method',
  'Brand or bank',
  'Wallet',
  'Last 4',
  'Description',
  'Refunded (UTC)',
  'Decline reason',
] as const;

function toRow(p: Payment): string[] {
  const [brandOrBank, wallet] = methodColumns(p.method);
  return [
    escapeCsvField(p.id),
    escapeCsvField(p.created, { text: false }),
    escapeCsvField(csvAmount(p.amount, p.currency), { text: false }),
    escapeCsvField(formatCurrencyCode(p.currency)),
    escapeCsvField(STATUS_LABELS[p.status]),
    escapeCsvField(p.customer.name),
    escapeCsvField(p.customer.email),
    escapeCsvField(METHOD_TYPE_LABELS[p.method.type]),
    escapeCsvField(brandOrBank),
    escapeCsvField(wallet),
    // Written as-is (`0042`); spreadsheets may still coerce it to a number on import.
    escapeCsvField(p.method.last4),
    escapeCsvField(p.description ?? ''),
    escapeCsvField(p.refundedAt ?? '', { text: false }),
    escapeCsvField(p.failureReason ?? ''),
  ];
}

export function toCsv(payments: readonly Payment[]): string {
  const lines = [
    CSV_HEADER.map((h) => escapeCsvField(h)).join(','),
    ...payments.map((p) => toRow(p).join(',')),
  ];
  // A UTF-8 BOM makes Excel decode non-ASCII names and descriptions correctly.
  return `${CSV_BOM}${lines.join('\r\n')}\r\n`;
}

/** `payments-2026-11-19.csv`, using the viewer's local date. */
export function csvFilename(now: Date): string {
  return `payments-${toLocalDate(now)}.csv`;
}
