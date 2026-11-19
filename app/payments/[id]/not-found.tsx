import Link from 'next/link';

export default function PaymentNotFound() {
  return (
    <div className="flex flex-col items-start gap-3 pt-10">
      <h1 className="text-title font-bold text-fg-strong">Payment not found</h1>
      <p className="text-md text-fg-muted">There is no payment with that ID in this demo.</p>
      <Link href="/payments" className="text-md font-semibold text-link hover:text-brand-hover">
        Back to payments
      </Link>
    </div>
  );
}
