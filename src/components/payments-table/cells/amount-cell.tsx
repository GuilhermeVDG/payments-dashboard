import { formatAmount, formatCurrencyCode } from '@/domain/money';
import type { Currency } from '@/domain/payment';

export function AmountCell({ amount, currency }: { amount: number; currency: Currency }) {
  return (
    <span className="amount-cell tabular font-semibold text-fg-strong">
      {formatAmount(amount, currency)}
    </span>
  );
}

export function CurrencyCell({ currency }: { currency: Currency }) {
  return <span className="currency-cell text-fg-muted">{formatCurrencyCode(currency)}</span>;
}
