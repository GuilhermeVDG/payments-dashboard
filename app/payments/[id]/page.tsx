import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PAYMENTS } from '@/data/payments';
import { findPayment } from '@/domain/payment';
import { PaymentDetails } from '@/components/payment-details/payment-details';

type Params = Promise<{ id: string }>;

export function generateStaticParams() {
  return PAYMENTS.map((payment) => ({ id: payment.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { title: findPayment(PAYMENTS, id) ? `Payment ${id}` : 'Payment not found' };
}

async function PaymentDetailsLoader({ params }: { params: Params }) {
  const { id } = await params;
  const payment = findPayment(PAYMENTS, id);
  if (!payment) notFound();
  return <PaymentDetails payment={payment} />;
}

function DetailsLoading() {
  return <div role="status" aria-label="Loading payment" className="h-96" />;
}

export default function PaymentDetailsPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<DetailsLoading />}>
      <PaymentDetailsLoader params={params} />
    </Suspense>
  );
}
