'use client';

import { useId, useState } from 'react';
import { amountFilterLabel, currencyFilterLabel } from '@/domain/filter-labels';
import {
  AMOUNT_RANGE_ERROR_MESSAGES,
  parseAmountInput,
  validateAmountRange,
  type AmountRangeError,
} from '@/domain/filters';
import { formatCurrencyCode } from '@/domain/money';
import { CURRENCIES, isOneOf, type Currency } from '@/domain/payment';
import { FilterChip, FilterForm } from './filter-chip';
import type { FilterControlProps } from './types';

const ANY = 'any';

function toCurrency(value: string): Currency | null {
  return isOneOf(CURRENCIES, value) ? value : null;
}

/** Which field to flag: both for min > max, otherwise only the offending one. */
function isFieldInvalid(value: number | null, error: AmountRangeError | null): boolean {
  if (error === null) return false;
  if (error === 'min-greater-than-max') return true;
  if (value === null) return false;
  return error === 'invalid' ? Number.isNaN(value) : value < 0;
}

const inputClass =
  'h-8 w-full rounded-md border border-border-strong bg-surface px-2 text-md text-fg tabular aria-[invalid=true]:border-danger-fg';

function AmountForm({ filters, onChange, close }: FilterControlProps & { close: () => void }) {
  const ids = useId();
  const { amount } = filters;
  const [min, setMin] = useState(amount.min === null ? '' : String(amount.min));
  const [max, setMax] = useState(amount.max === null ? '' : String(amount.max));
  const [currency, setCurrency] = useState<Currency | null>(amount.currency);

  const minValue = parseAmountInput(min);
  const maxValue = parseAmountInput(max);
  const error = validateAmountRange(minValue, maxValue);
  const errorId = `${ids}-error`;
  const invalidMin = isFieldInvalid(minValue, error);
  const invalidMax = isFieldInvalid(maxValue, error);

  return (
    <FilterForm
      title="Filter by amount"
      canApply={error === null}
      onApply={() => {
        onChange({ amin: minValue, amax: maxValue, acur: currency });
        close();
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-semibold text-fg-muted">
        Currency
        <select
          value={currency ?? ANY}
          onChange={(event) => setCurrency(toCurrency(event.target.value))}
          className={inputClass}
        >
          <option value={ANY}>Any currency</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {formatCurrencyCode(c)}
            </option>
          ))}
        </select>
      </label>
      <div className="amount-filter__range flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-fg-muted">
          Minimum
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={min}
            onChange={(event) => setMin(event.target.value)}
            aria-invalid={invalidMin}
            aria-describedby={invalidMin ? errorId : undefined}
            className={inputClass}
          />
        </label>
        <span aria-hidden className="pb-1.5 text-fg-subdued">
          –
        </span>
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-fg-muted">
          Maximum
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            aria-invalid={invalidMax}
            aria-describedby={invalidMax ? errorId : undefined}
            className={inputClass}
          />
        </label>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-danger-fg">
          {AMOUNT_RANGE_ERROR_MESSAGES[error]}
        </p>
      ) : null}
    </FilterForm>
  );
}

export function AmountFilter(props: FilterControlProps) {
  return (
    <FilterChip
      label="Amount"
      value={amountFilterLabel(props.filters.amount)}
      onClear={() => props.onChange({ amin: null, amax: null })}
    >
      {(close) => <AmountForm {...props} close={close} />}
    </FilterChip>
  );
}

function CurrencyForm({ filters, onChange, close }: FilterControlProps & { close: () => void }) {
  const ids = useId();
  const [currency, setCurrency] = useState<Currency | null>(filters.amount.currency);
  const options = [{ value: ANY, label: 'Any currency' }].concat(
    CURRENCIES.map((c) => ({ value: c, label: formatCurrencyCode(c) })),
  );
  return (
    <FilterForm
      title="Filter by currency"
      onApply={() => {
        onChange({ acur: currency });
        close();
      }}
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Currency</legend>
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 py-1 text-md text-fg">
            <input
              type="radio"
              name={`${ids}-currency`}
              value={option.value}
              checked={(currency ?? ANY) === option.value}
              onChange={() => setCurrency(toCurrency(option.value))}
              className="accent-brand"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </FilterForm>
  );
}

export function CurrencyFilter(props: FilterControlProps) {
  return (
    <FilterChip
      label="Currency"
      value={currencyFilterLabel(props.filters.amount.currency)}
      onClear={() => props.onChange({ acur: null })}
    >
      {(close) => <CurrencyForm {...props} close={close} />}
    </FilterChip>
  );
}
