'use client';

import * as Popover from '@radix-ui/react-popover';
import type { ReactNode, Ref } from 'react';
import { isFilterActive } from '@/domain/filters';
import { PlusCircleIcon } from '@/components/ui/icons';
import { AmountFilter, CurrencyFilter } from './amount-currency-filters';
import { DateFilter } from './date-filter';
import { MethodFilter, StatusFilter } from './status-method-filters';
import type { FilterControlProps } from './types';

function MoreFilters() {
  return (
    <Popover.Root>
      <Popover.Trigger className="filter-chip filter-chip__trigger inline-flex h-6 items-center gap-1.5 rounded-full border border-dashed border-border-strong bg-surface pr-2.5 pl-1.5 text-sm font-semibold text-fg-muted hover:text-fg">
        <PlusCircleIcon className="text-fg-subdued" />
        More filters
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          aria-label="More filters"
          className="filter-popover z-50 w-72 rounded-lg bg-surface p-4 text-md text-fg-muted shadow-popover"
        >
          Search by payment ID, customer email or card last 4 using the search bar above.
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface FilterBarProps extends FilterControlProps {
  onClearAll: () => void;
  /** Focus target after clearing, since the Clear filters button unmounts. */
  chipsRef?: Ref<HTMLDivElement>;
  /** View actions on the right (Export, Edit columns). */
  actions?: ReactNode;
}

/** Filter chips on the left, view actions on the right. */
export function FilterBar({ filters, onChange, onClearAll, chipsRef, actions }: FilterBarProps) {
  const control = { filters, onChange };
  return (
    <div className="filter-bar flex flex-wrap items-center justify-between gap-3">
      <div
        ref={chipsRef}
        tabIndex={-1}
        role="group"
        aria-label="Filters"
        className="filter-bar__chips flex flex-wrap items-center gap-2"
      >
        <DateFilter {...control} />
        <AmountFilter {...control} />
        <CurrencyFilter {...control} />
        <StatusFilter {...control} />
        <MethodFilter {...control} />
        <MoreFilters />
        {isFilterActive(filters) ? (
          <button
            type="button"
            onClick={onClearAll}
            className="filter-bar__clear rounded-sm px-1 text-sm font-semibold text-link hover:text-brand-hover"
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <div className="filter-bar__actions flex items-center gap-2">{actions}</div>
    </div>
  );
}
