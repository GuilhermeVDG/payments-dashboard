'use client';

import { shortenPaymentId } from '@/domain/display';
import { CopyButton } from '@/components/ui/copy-button';

/** Shortened id (`pi_3Nx…k2Yt`) with the full id in a title, plus a copy button. */
export function PaymentIdCell({ id }: { id: string }) {
  return (
    <span className="payment-id-cell inline-flex items-center gap-1">
      <span className="payment-id-cell__value tabular whitespace-nowrap text-fg-muted" title={id}>
        {shortenPaymentId(id)}
      </span>
      <CopyButton value={id} label={`Copy payment ID ${id}`} />
    </span>
  );
}
