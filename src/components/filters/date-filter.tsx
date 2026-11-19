'use client';

import { useId, useState } from 'react';
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  isValidCustomRange,
  type DateFilter as DateFilterState,
  type DatePreset,
} from '@/domain/dates';
import { dateFilterLabel } from '@/domain/filter-labels';
import { FilterChip, FilterForm } from './filter-chip';
import type { FilterControlProps } from './types';

type Choice = DatePreset | 'custom';

const CHOICES: readonly { value: Choice; label: string }[] = [
  ...DATE_PRESETS.map((value) => ({ value, label: DATE_PRESET_LABELS[value] })),
  { value: 'custom', label: 'Custom' },
];

function initialChoice(date: DateFilterState): Choice {
  if (date.kind === 'preset') return date.preset;
  return date.kind === 'custom' ? 'custom' : 'today';
}

const inputClass =
  'h-8 w-full rounded-md border border-border-strong bg-surface px-2 text-md text-fg aria-[invalid=true]:border-danger-fg';

function DateForm({ filters, onChange, close }: FilterControlProps & { close: () => void }) {
  const ids = useId();
  const custom = filters.date.kind === 'custom' ? filters.date : null;
  const [choice, setChoice] = useState<Choice>(initialChoice(filters.date));
  const [from, setFrom] = useState(custom?.from ?? '');
  const [to, setTo] = useState(custom?.to ?? '');

  const rangeValid = isValidCustomRange(from || null, to || null);
  const canApply = choice !== 'custom' || ((from !== '' || to !== '') && rangeValid);
  const errorId = `${ids}-error`;

  return (
    <FilterForm
      title="Filter by date and time"
      canApply={canApply}
      onApply={() => {
        onChange(
          choice === 'custom'
            ? { date: null, from: from || null, to: to || null }
            : { date: choice, from: null, to: null },
        );
        close();
      }}
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">Date range</legend>
        {CHOICES.map((option) => (
          <label key={option.value} className="flex items-center gap-2 py-1 text-md text-fg">
            <input
              type="radio"
              name={`${ids}-date`}
              value={option.value}
              checked={choice === option.value}
              onChange={() => setChoice(option.value)}
              className="accent-brand"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      {choice === 'custom' ? (
        <div className="date-filter__custom flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-fg-muted">
            Start date
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
              aria-invalid={!rangeValid}
              aria-describedby={rangeValid ? undefined : errorId}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-fg-muted">
            End date
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              aria-invalid={!rangeValid}
              aria-describedby={rangeValid ? undefined : errorId}
              className={inputClass}
            />
          </label>
          {rangeValid ? null : (
            <p id={errorId} role="alert" className="text-sm text-danger-fg">
              Start date must be on or before the end date.
            </p>
          )}
        </div>
      ) : null}
    </FilterForm>
  );
}

export function DateFilter(props: FilterControlProps) {
  return (
    <FilterChip
      label="Date and time"
      value={dateFilterLabel(props.filters.date)}
      onClear={() => props.onChange({ date: null, from: null, to: null })}
    >
      {(close) => <DateForm {...props} close={close} />}
    </FilterChip>
  );
}
