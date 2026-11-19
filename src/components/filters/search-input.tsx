'use client';

import { debounce, useQueryStates } from 'nuqs';
import { SearchIcon } from '@/components/ui/icons';
import { SEARCH_DEBOUNCE_MS, paymentsSearchParams, withFilterPatch } from '@/state/url-state';

const searchParams = { q: paymentsSearchParams.q, page: paymentsSearchParams.page };

/**
 * Top bar search. The input reflects `q` immediately; the URL write is debounced
 * and the table filters on a debounced copy of `q` (see PaymentsView).
 */
export function SearchInput() {
  const [{ q }, setParams] = useQueryStates(searchParams);
  return (
    <div className="search-input relative w-[573px] max-w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-subdued" />
      <input
        type="search"
        aria-label="Search payments by ID, customer email or card last 4"
        placeholder="Search"
        value={q}
        onChange={(event) =>
          void setParams(withFilterPatch({ q: event.target.value || null }), {
            limitUrlUpdates: event.target.value ? debounce(SEARCH_DEBOUNCE_MS) : undefined,
          })
        }
        className="search-input__field h-9 w-full rounded-lg bg-surface-subtle pr-2 pl-8 text-md text-fg placeholder:text-fg-subdued"
      />
    </div>
  );
}
