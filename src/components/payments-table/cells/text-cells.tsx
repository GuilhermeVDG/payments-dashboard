'use client';

import type { Customer } from '@/domain/payment';
import { Tooltip } from '@/components/ui/tooltip';

/** Em dash placeholder used by the Dashboard for empty values. */
export function EmptyValue() {
  return (
    <span className="empty-value text-fg-subdued">
      <span aria-hidden>—</span>
      <span className="sr-only">None</span>
    </span>
  );
}

export function DescriptionCell({ description }: { description?: string }) {
  if (!description) return <EmptyValue />;
  return <span className="description-cell truncate text-fg-muted">{description}</span>;
}

/** Email in the row; the customer name is in a hover tooltip and in screen reader text. */
export function CustomerCell({ customer }: { customer: Customer }) {
  return (
    <Tooltip content={customer.name}>
      <span tabIndex={0} className="customer-cell truncate rounded-sm text-fg-muted">
        <span className="sr-only">{customer.name}, </span>
        {customer.email}
      </span>
    </Tooltip>
  );
}

export function DeclineReasonCell({ reason }: { reason?: string }) {
  if (!reason) return <EmptyValue />;
  return (
    <span className="decline-reason-cell block truncate text-fg-muted" title={reason}>
      {reason}
    </span>
  );
}
