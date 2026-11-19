import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PAYMENTS } from '@/data/payments';
import { findPayment } from '@/domain/payment';
import { PaymentDetails } from '@/components/payment-details/payment-details';

type Params = Promise<{ id: string }>;

/**
 * Unlisted ids wait for the full render instead of streaming the shared fallback,
 * so notFound() can still set a real 404 status.
 */
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return PAYMENTS.map((payment) => ({ id: payment.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: findPayment(PAYMENTS, id) ? `Payment ${id}` : 'Payment not found' };
}

function DetailsLoading() {
  return <div role="status" aria-label="Loading payment" className="h-96" />;
}

/**
 * Params are resolved outside Suspense so an unknown id calls notFound() before
 * streaming starts and the response is a real 404. Only the browser-rendered
 * details sit inside the boundary.
 */
export default async function PaymentDetailsPage({ params }: { params: Params }) {
  const { id } = await params;
  const payment = findPayment(PAYMENTS, id);
  if (!payment) notFound();
  return (
    <Suspense fallback={<DetailsLoading />}>
      <PaymentDetails payment={payment} />
    </Suspense>
  );
}
