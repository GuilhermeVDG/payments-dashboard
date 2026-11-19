import { Suspense } from 'react';
import { PAYMENTS } from '@/data/payments';
import { SearchInput } from '@/components/filters/search-input';
import { PageHeader } from '@/components/layout/page-header';
import { PaymentsView } from '@/components/payments/payments-view';

function PaymentsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading payments"
      className="payments-loading flex flex-col gap-px pt-9"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="h-10 border-b border-border" />
      ))}
    </div>
  );
}

function SearchFallback() {
  return <div className="h-9 w-[573px] max-w-full rounded-lg bg-surface-subtle" />;
}

export default function PaymentsPage() {
  return (
    <div className="payments-page mx-auto max-w-[1600px] px-10">
      <header className="payments-page__topbar flex h-15 items-center">
        <Suspense fallback={<SearchFallback />}>
          <SearchInput />
        </Suspense>
      </header>
      <main className="payments-page__main pb-10">
        <div className="mt-4 mb-[18px]">
          <PageHeader />
        </div>
        <Suspense fallback={<PaymentsLoading />}>
          <PaymentsView payments={PAYMENTS} />
        </Suspense>
      </main>
    </div>
  );
}
