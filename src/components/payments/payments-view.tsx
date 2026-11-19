'use client';

import { useQueryStates } from 'nuqs';
import { use, useMemo, useState } from 'react';
import { browser } from 'react-dom';
import { DATA_ANCHOR } from '@/data/anchor';
import { rebaseToNow } from '@/domain/dates';
import { applyFilters } from '@/domain/filters';
import { paginate, type PageSize } from '@/domain/paginate';
import type { Payment } from '@/domain/payment';
import { sortPayments, type SortRule } from '@/domain/sort';
import { paymentsSearchParams, toFilterState } from '@/state/url-state';
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

  const rebased = useMemo(() => rebaseToNow(payments, DATA_ANCHOR, now), [payments, now]);
  const filters = useMemo(() => toFilterState(params), [params]);
  const filtered = useMemo(() => applyFilters(rebased, filters, now), [rebased, filters, now]);
  const sorted = useMemo(() => sortPayments(filtered, params.sort), [filtered, params.sort]);
  const page = useMemo(
    () => paginate(sorted, params.page, params.size),
    [sorted, params.page, params.size],
  );

  const setSort = (sort: SortRule[]) => void setParams({ sort, page: null });
  const setPage = (next: number) => void setParams({ page: next });
  const setSize = (size: PageSize) => void setParams({ size, page: null });

  return (
    <AnnouncerProvider>
      <TooltipProvider delayDuration={300}>
        <section aria-label="Payments" className="payments-view">
          {page.total === 0 ? (
            <p className="payments-view__empty py-16 text-center text-fg-muted">No payments</p>
          ) : (
            <>
              <PaymentsTable rows={page.rows} sort={params.sort} onSortChange={setSort} now={now} />
              <Pagination
                page={page}
                size={params.size}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </>
          )}
        </section>
      </TooltipProvider>
    </AnnouncerProvider>
  );
}
