'use client';

import { usePathname, useRouter } from 'next/navigation';
import { debounce, useQueryStates } from 'nuqs';
import { useState } from 'react';
import { PAYMENTS_PATH } from '@/domain/routes';
import { SearchIcon } from '@/components/ui/icons';
import {
  SEARCH_DEBOUNCE_MS,
  paymentsSearchParams,
  serializePaymentsSearchParams,
  withFilterPatch,
} from '@/state/url-state';

const searchParams = { q: paymentsSearchParams.q, page: paymentsSearchParams.page };

/**
 * Top bar search. The input reflects `q` immediately; the URL write is debounced
 * and the table filters on a debounced copy of `q` (see PaymentsView). Outside the
 * list (e.g. a details page), typing goes back to the list with the query.
 */
export function SearchInput() {
  const [{ q }, setParams] = useQueryStates(searchParams);
  const pathname = usePathname();
  const router = useRouter();
  // Off the list, `q` stays empty until navigation completes, so keep what was typed
  // locally (keyed by route) instead of resetting the input on every keystroke.
  const [draft, setDraft] = useState<{ path: string; value: string } | null>(null);
  const onList = pathname === PAYMENTS_PATH;
  const value = !onList && draft?.path === pathname ? draft.value : q;

  function search(next: string) {
    if (!onList) {
      setDraft({ path: pathname, value: next });
      router.push(serializePaymentsSearchParams(PAYMENTS_PATH, { q: next || null }));
      return;
    }
    void setParams(withFilterPatch({ q: next || null }), {
      limitUrlUpdates: next ? debounce(SEARCH_DEBOUNCE_MS) : undefined,
    });
  }

  return (
    <div className="search-input relative w-[573px] max-w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-subdued" />
      <input
        type="search"
        aria-label="Search payments by ID, customer email or card last 4"
        placeholder="Search"
        value={value}
        onChange={(event) => search(event.target.value)}
        className="search-input__field h-9 w-full rounded-lg bg-surface-subtle pr-2 pl-8 text-md text-fg placeholder:text-fg-subdued"
      />
    </div>
  );
}
