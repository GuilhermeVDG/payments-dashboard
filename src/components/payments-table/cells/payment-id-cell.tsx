'use client';

import Link from 'next/link';
import { shortenPaymentId } from '@/domain/display';
import { paymentHref } from '@/domain/routes';
import { CopyButton } from '@/components/ui/copy-button';

/** Shortened id (`pi_3Nx…k2Yt`) linking to the details page, plus a copy button. */
export function PaymentIdCell({ id }: { id: string }) {
  return (
    <span className="payment-id-cell inline-flex items-center gap-1">
      <Link
        href={paymentHref(id)}
        title={id}
        className="payment-id-cell__value tabular rounded-sm whitespace-nowrap text-fg-muted hover:text-link"
      >
        {shortenPaymentId(id)}
      </Link>
      <CopyButton value={id} label={`Copy payment ID ${id}`} />
    </span>
  );
}
