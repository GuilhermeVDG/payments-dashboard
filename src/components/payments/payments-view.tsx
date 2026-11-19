'use client';

import { useQueryStates } from 'nuqs';
import { use, useMemo, useRef, useState } from 'react';
import { browser } from 'react-dom';
import { DATA_ANCHOR } from '@/data/anchor';
import { rebaseToNow } from '@/domain/dates';
import { applyFilters } from '@/domain/filters';
import { paginate, type PageSize } from '@/domain/paginate';
import type { Payment } from '@/domain/payment';
import { sortPayments, type SortRule } from '@/domain/sort';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  CLEAR_FILTERS_PATCH,
  SEARCH_DEBOUNCE_MS,
  paymentsSearchParams,
  toFilterState,
  withFilterPatch,
  type FilterPatch,
} from '@/state/url-state';
import { EmptyState, emptyStateCopy } from '@/components/filters/empty-state';
import { FilterBar } from '@/components/filters/filter-bar';
import { StatusTabs } from '@/components/filters/status-tabs';
import { Pagination } from '@/components/payments-table/pagination';
import { PaymentsTable } from '@/components/payments-table/payments-table';
import { AnnouncerProvider } from '@/components/ui/announcer';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Client view: reads the URL state and derives the visible page with a memoized
 * pure pipeline (rebase -> filter -> sort -> paginate). Renders only in the browser
 * so dates and day ranges use the viewer's time zone without a hydration mismatch.
 */
export function PaymentsView({ payments }: { payments: readonly Payment[] }) {
  use(browser('Dates and day ranges are computed in the viewer’s local time zone.'));

  const [now] = useState(() => new Date());
  const [params, setParams] = useQueryStates(paymentsSearchParams);
  const chipsRef = useRef<HTMLDivElement>(null);
  // The search box updates `q` on every keystroke; filtering waits for typing to
  // pause. Clearing the search applies at once.
  const debouncedQuery = useDebouncedValue(params.q, SEARCH_DEBOUNCE_MS);
  const query = params.q === '' ? '' : debouncedQuery;

  const { date, from, to, status, method, amin, amax, acur, tab } = params;
  const rebased = useMemo(() => rebaseToNow(payments, DATA_ANCHOR, now), [payments, now]);
  // Depend on the filter fields, not the whole params object, so keystrokes in the
  // search box do not recompute anything until the debounced query changes.
  const filters = useMemo(
    () => toFilterState({ date, from, to, status, method, amin, amax, acur, tab, q: query }),
    [date, from, to, status, method, amin, amax, acur, tab, query],
  );
  const filtered = useMemo(() => applyFilters(rebased, filters, now), [rebased, filters, now]);
  const sorted = useMemo(() => sortPayments(filtered, params.sort), [filtered, params.sort]);
  const page = useMemo(
    () => paginate(sorted, params.page, params.size),
    [sorted, params.page, params.size],
  );

  const changeFilters = (patch: FilterPatch) => void setParams(withFilterPatch(patch));
  const clearFilters = () => {
    void setParams(CLEAR_FILTERS_PATCH);
    // The button that triggered this unmounts; move focus to the filter group.
    chipsRef.current?.focus();
  };
  const setSort = (sort: SortRule[]) => void setParams({ sort, page: null });
  const setPage = (next: number) => void setParams({ page: next });
  const setSize = (size: PageSize) => void setParams({ size, page: null });

  return (
    <AnnouncerProvider>
      <TooltipProvider delayDuration={300}>
        <section aria-label="Payments" className="payments-view flex flex-col">
          <StatusTabs filters={filters} onChange={changeFilters} />
          <div className="payments-view__filters mt-[18px]">
            <FilterBar
              filters={filters}
              onChange={changeFilters}
              onClearAll={clearFilters}
              chipsRef={chipsRef}
            />
          </div>
          <p role="status" className="payments-view__results-status sr-only">
            {page.total === 0 ? emptyStateCopy(filters.statusTab).title : ''}
          </p>
          {page.total === 0 ? (
            <div className="payments-view__results mt-3">
              <EmptyState statusTab={filters.statusTab} onClearFilters={clearFilters} />
            </div>
          ) : (
            <div className="payments-view__results mt-3">
              <PaymentsTable rows={page.rows} sort={params.sort} onSortChange={setSort} now={now} />
              <Pagination
                page={page}
                size={params.size}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </div>
          )}
        </section>
      </TooltipProvider>
    </AnnouncerProvider>
  );
}
