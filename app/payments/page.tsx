import { Suspense } from 'react';
import { PAYMENTS } from '@/data/payments';
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
        <div key={i} className="h-9 border-b border-border" />
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <div className="payments-page">
      <div className="mt-4 mb-[18px]">
        <PageHeader />
      </div>
      <Suspense fallback={<PaymentsLoading />}>
        <PaymentsView payments={PAYMENTS} />
      </Suspense>
    </div>
  );
}
