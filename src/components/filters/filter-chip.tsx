'use client';

import * as Popover from '@radix-ui/react-popover';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronIcon, PlusCircleIcon, XCircleIcon } from '@/components/ui/icons';

interface FilterChipProps {
  /** Filter name, e.g. "Status". */
  label: string;
  /** Applied value, e.g. "Failed, Refunded"; null when the filter is not active. */
  value: string | null;
  onClear: () => void;
  /** Popover body; receives `close` so a form can close after applying. */
  children: (close: () => void) => ReactNode;
}

/**
 * Dashboard-style filter pill. Inactive: dashed "⊕ Label". Active: solid
 * "⊗ Label | value" with a separate clear button. Opens a Radix popover that is
 * keyboard operable (Enter/Space to open, Escape to close, focus returns to the chip).
 */
export function FilterChip({ label, value, onClear, children }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const active = value !== null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <span
        className={`filter-chip ${active ? 'filter-chip--active border-solid' : 'border-dashed'} inline-flex h-6 items-center rounded-full border border-border-strong bg-surface text-sm font-semibold text-fg-muted`}
      >
        {active ? (
          <button
            type="button"
            aria-label={`Clear ${label} filter`}
            onClick={() => {
              onClear();
              // The clear button unmounts; keep focus on the chip.
              trigger.current?.focus();
            }}
            className="filter-chip__clear inline-flex h-full items-center rounded-l-full pr-1 pl-1.5 text-fg-subdued hover:text-fg"
          >
            <XCircleIcon />
          </button>
        ) : null}
        <Popover.Trigger
          ref={trigger}
          aria-label={active ? `${label}: ${value}` : label}
          className={`filter-chip__trigger inline-flex h-full items-center gap-1.5 rounded-full pr-2.5 hover:text-fg ${active ? 'pl-0.5' : 'pl-1.5'}`}
        >
          {active ? null : <PlusCircleIcon className="text-fg-subdued" />}
          <span>{label}</span>
          {active ? (
            <>
              <span aria-hidden className="h-3 w-px bg-border-strong" />
              <span className="filter-chip__value max-w-56 truncate text-link">{value}</span>
              <ChevronIcon direction="down" className="text-link" />
            </>
          ) : null}
        </Popover.Trigger>
      </span>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          aria-label={`${label} filter`}
          className="filter-popover z-50 w-72 rounded-lg bg-surface text-md text-fg shadow-popover"
        >
          {children(() => setOpen(false))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface FilterFormProps {
  title: string;
  onApply: () => void;
  canApply?: boolean;
  children: ReactNode;
}

/** Popover body: title, fields and a full-width Apply button. Enter submits. */
export function FilterForm({ title, onApply, canApply = true, children }: FilterFormProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    if (canApply) onApply();
  }
  return (
    <form onSubmit={submit} aria-label={title} className="filter-form flex flex-col">
      <h2 className="filter-form__title px-4 pt-3 pb-2 text-md font-semibold text-fg-strong">
        {title}
      </h2>
      <div className="filter-form__body flex flex-col gap-2 px-4 pb-3">{children}</div>
      <div className="filter-form__footer border-t border-border p-3">
        <button
          type="submit"
          disabled={!canApply}
          className="filter-form__apply h-7 w-full rounded-md bg-brand text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
        >
          Apply
        </button>
      </div>
    </form>
  );
}
