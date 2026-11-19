/** Value labels shown inside active filter chips. Pure, so chips only render strings. */
import { DATE_PRESET_LABELS, formatLocalDate, type DateFilter } from './dates';
import { METHOD_TYPE_LABELS, STATUS_LABELS } from './display';
import type { AmountFilter } from './filters';
import { formatAmount, formatCurrencyCode, toMinor } from './money';
import type { PaymentMethodType, Status } from './payment';

const MAX_LISTED = 2;

/** `Failed, Refunded`; longer lists collapse to `Failed, Refunded +1`. */
export function listLabel(labels: readonly string[]): string {
  if (labels.length <= MAX_LISTED + 1) return labels.join(', ');
  return `${labels.slice(0, MAX_LISTED).join(', ')} +${labels.length - MAX_LISTED}`;
}

export function statusFilterLabel(status: readonly Status[]): string | null {
  return status.length === 0 ? null : listLabel(status.map((s) => STATUS_LABELS[s]));
}

export function methodFilterLabel(method: readonly PaymentMethodType[]): string | null {
  return method.length === 0 ? null : listLabel(method.map((m) => METHOD_TYPE_LABELS[m]));
}

export function dateFilterLabel(filter: DateFilter): string | null {
  switch (filter.kind) {
    case 'all':
      return null;
    case 'preset':
      return DATE_PRESET_LABELS[filter.preset];
    case 'custom': {
      const { from, to } = filter;
      if (from && to) {
        return from === to
          ? formatLocalDate(from)
          : `${formatLocalDate(from)} – ${formatLocalDate(to)}`;
      }
      if (from) return `On or after ${formatLocalDate(from)}`;
      if (to) return `On or before ${formatLocalDate(to)}`;
      return null;
    }
  }
}

const plainNumber = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function formatBound(value: number, amount: AmountFilter): string {
  return amount.currency
    ? formatAmount(toMinor(value, amount.currency), amount.currency)
    : plainNumber.format(value);
}

/** `$10.00 – $500.00`, `≥ 10`, `≤ ¥5,000`. Null when no bound is set. */
export function amountFilterLabel(amount: AmountFilter): string | null {
  const { min, max } = amount;
  if (min !== null && max !== null) {
    return min === max
      ? formatBound(min, amount)
      : `${formatBound(min, amount)} – ${formatBound(max, amount)}`;
  }
  if (min !== null) return `≥ ${formatBound(min, amount)}`;
  if (max !== null) return `≤ ${formatBound(max, amount)}`;
  return null;
}

export function currencyFilterLabel(currency: AmountFilter['currency']): string | null {
  return currency ? formatCurrencyCode(currency) : null;
}
