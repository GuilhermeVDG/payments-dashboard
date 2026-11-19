import { Suspense } from 'react';
import { PAYMENTS } from '@/data/payments';
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

export default function PaymentsPage() {
  return (
    <main className="payments-page mx-auto max-w-[1600px] px-8 py-6">
      <h1 className="payments-page__title mb-6 text-title font-bold text-fg-strong">
        Transactions
      </h1>
      <Suspense fallback={<PaymentsLoading />}>
        <PaymentsView payments={PAYMENTS} />
      </Suspense>
    </main>
  );
}
