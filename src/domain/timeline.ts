/**
 * Payment timeline for the details page, newest first. The mock data has only
 * `created` and `refundedAt` timestamps, so outcome events share the created time.
 */
import { assertNever, type Payment } from './payment';

export type TimelineEventKind = 'created' | 'succeeded' | 'pending' | 'failed' | 'refunded';

export interface TimelineEvent {
  kind: TimelineEventKind;
  title: string;
  /** Extra line under the title, e.g. the decline reason. */
  detail?: string;
  /** ISO 8601 UTC. */
  at: string;
}

function outcome(payment: Payment): TimelineEvent[] {
  const at = payment.created;
  switch (payment.status) {
    case 'succeeded':
      return [{ kind: 'succeeded', title: 'Payment succeeded', at }];
    case 'pending':
      return [
        {
          kind: 'pending',
          title: 'Payment pending',
          detail:
            payment.method.type === 'ach'
              ? 'Bank debits can take up to 4 business days to confirm.'
              : 'Waiting for the payment to be confirmed.',
          at,
        },
      ];
    case 'failed':
      return [{ kind: 'failed', title: 'Payment failed', detail: payment.failureReason, at }];
    case 'refunded':
      return [
        { kind: 'refunded', title: 'Payment refunded', at: payment.refundedAt ?? at },
        { kind: 'succeeded', title: 'Payment succeeded', at },
      ];
    default:
      return assertNever(payment.status);
  }
}

/** Events newest first, ending with "Payment started". */
export function buildTimeline(payment: Payment): TimelineEvent[] {
  return [...outcome(payment), { kind: 'created', title: 'Payment started', at: payment.created }];
}
