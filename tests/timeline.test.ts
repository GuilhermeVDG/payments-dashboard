import { describe, expect, it } from 'vitest';
import { findPayment } from '@/domain/payment';
import { buildTimeline } from '@/domain/timeline';
import { makePayment } from './fixtures';

const created = '2026-11-10T12:00:00.000Z';

describe('buildTimeline', () => {
  it('lists a succeeded payment newest first', () => {
    expect(buildTimeline(makePayment({ status: 'succeeded', created }))).toEqual([
      { kind: 'succeeded', title: 'Payment succeeded', at: created },
      { kind: 'created', title: 'Payment started', at: created },
    ]);
  });

  it('includes the decline reason for failed payments', () => {
    const events = buildTimeline(
      makePayment({ status: 'failed', failureReason: 'Insufficient funds', created }),
    );
    expect(events[0]).toEqual({
      kind: 'failed',
      title: 'Payment failed',
      detail: 'Insufficient funds',
      at: created,
    });
  });

  it('shows the refund after the success, at the refund time', () => {
    const refundedAt = '2026-11-12T09:30:00.000Z';
    const events = buildTimeline(makePayment({ status: 'refunded', created, refundedAt }));
    expect(events.map((e) => [e.kind, e.at])).toEqual([
      ['refunded', refundedAt],
      ['succeeded', created],
      ['created', created],
    ]);
  });

  it('falls back to the created time when a refund has no timestamp', () => {
    const events = buildTimeline(makePayment({ status: 'refunded', created }));
    expect(events[0]).toEqual({ kind: 'refunded', title: 'Payment refunded', at: created });
  });

  it('explains pending ACH debits', () => {
    const ach = makePayment({
      status: 'pending',
      created,
      method: { type: 'ach', bankName: 'STRIPE TEST BANK', last4: '6789' },
    });
    expect(buildTimeline(ach)[0].detail).toMatch(/4 business days/);
    expect(buildTimeline(makePayment({ status: 'pending', created }))[0].detail).toMatch(/Waiting/);
  });
});

describe('findPayment', () => {
  it('finds by exact id only', () => {
    const p = makePayment();
    expect(findPayment([p], p.id)).toBe(p);
    expect(findPayment([p], p.id.toLowerCase())).toBeUndefined();
    expect(findPayment([], p.id)).toBeUndefined();
  });
});
