import { isInDateRange, resolveDateRange, type DateFilter } from './dates';
import { toMinorBound } from './money';
import type { Currency, Payment, PaymentMethodType, Status } from './payment';
import { matchesSearch } from './search';
import type { UnavailableStatusTab } from './status-tabs';

/** Amount bounds are in major units (what the user types), inclusive. */
export interface AmountFilter {
  min: number | null;
  max: number | null;
  /** null means "any currency": bounds apply to each payment in its own currency. */
  currency: Currency | null;
}

export interface FilterState {
  date: DateFilter;
  /** Empty means no status filter. */
  status: readonly Status[];
  /** Empty means no method filter. */
  method: readonly PaymentMethodType[];
  amount: AmountFilter;
  query: string;
  /** Disputed or Uncaptured tab: statuses this dataset has none of, so nothing matches. */
  statusTab: UnavailableStatusTab | null;
}

export const EMPTY_AMOUNT_FILTER: AmountFilter = { min: null, max: null, currency: null };

export const EMPTY_FILTERS: FilterState = {
  date: { kind: 'all' },
  status: [],
  method: [],
  amount: EMPTY_AMOUNT_FILTER,
  query: '',
  statusTab: null,
};

export type AmountRangeError = 'invalid' | 'negative' | 'min-greater-than-max';

export const AMOUNT_RANGE_ERROR_MESSAGES: Record<AmountRangeError, string> = {
  invalid: 'Enter a valid amount.',
  negative: 'Amounts must be 0 or greater.',
  'min-greater-than-max': 'Minimum amount must be less than or equal to the maximum.',
};

export function validateAmountRange(
  min: number | null,
  max: number | null,
): AmountRangeError | null {
  if ((min !== null && !Number.isFinite(min)) || (max !== null && !Number.isFinite(max))) {
    return 'invalid';
  }
  if ((min !== null && min < 0) || (max !== null && max < 0)) return 'negative';
  if (min !== null && max !== null && min > max) return 'min-greater-than-max';
  return null;
}

export function isAmountFilterActive(amount: AmountFilter): boolean {
  return amount.min !== null || amount.max !== null || amount.currency !== null;
}

export function isFilterActive(filters: FilterState): boolean {
  return (
    filters.date.kind !== 'all' ||
    filters.status.length > 0 ||
    filters.method.length > 0 ||
    isAmountFilterActive(filters.amount) ||
    filters.query.trim() !== '' ||
    filters.statusTab !== null
  );
}

interface MinorBounds {
  min: number | null;
  max: number | null;
}

/** Converts major-unit bounds to minor units once per currency, not once per payment. */
function amountMatcher(amount: AmountFilter): (payment: Payment) => boolean {
  if (!isAmountFilterActive(amount)) return () => true;
  const bounds = new Map<Currency, MinorBounds>();
  const boundsFor = (currency: Currency): MinorBounds => {
    let cached = bounds.get(currency);
    if (!cached) {
      cached = {
        min: amount.min === null ? null : toMinorBound(amount.min, currency, 'min'),
        max: amount.max === null ? null : toMinorBound(amount.max, currency, 'max'),
      };
      bounds.set(currency, cached);
    }
    return cached;
  };
  return (payment) => {
    if (amount.currency !== null && payment.currency !== amount.currency) return false;
    const { min, max } = boundsFor(payment.currency);
    return (min === null || payment.amount >= min) && (max === null || payment.amount <= max);
  };
}

/**
 * Applies every filter with AND. Empty filters do not restrict. Invalid amount bounds
 * (non-finite, negative or min > max) are ignored, keeping the currency; the UI
 * prevents applying them.
 */
export function applyFilters(
  payments: readonly Payment[],
  filters: FilterState,
  now: Date,
): Payment[] {
  if (filters.statusTab !== null) return [];
  const range = resolveDateRange(filters.date, now);
  const { min, max } = filters.amount;
  const amountValid = validateAmountRange(min, max) === null;
  const matchesAmount = amountMatcher(
    amountValid ? filters.amount : { ...filters.amount, min: null, max: null },
  );
  const status = new Set(filters.status);
  const method = new Set(filters.method);

  return payments.filter(
    (p) =>
      (range === null || isInDateRange(p.created, range)) &&
      (status.size === 0 || status.has(p.status)) &&
      (method.size === 0 || method.has(p.method.type)) &&
      matchesAmount(p) &&
      matchesSearch(p, filters.query),
  );
}

/** Plain decimal, or comma thousands groups: `1250.5`, `1,250.50`. */
const AMOUNT_INPUT_RE = /^(\d+|\d{1,3}(,\d{3})+)(\.\d+)?$/;

/**
 * Parses what the user typed in an amount field (major units). Empty means no
 * bound; anything other than a plain non-negative decimal is `NaN`, which
 * `validateAmountRange` reports as invalid. Commas are accepted only as thousands separators.
 */
export function parseAmountInput(input: string): number | null {
  const value = input.trim();
  if (value === '') return null;
  return AMOUNT_INPUT_RE.test(value) ? Number(value.replace(/,/g, '')) : Number.NaN;
}
