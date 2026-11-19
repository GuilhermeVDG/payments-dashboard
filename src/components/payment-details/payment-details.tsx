'use client';

import Link from 'next/link';
import { use, useMemo, useState, type ReactNode } from 'react';
import { browser } from 'react-dom';
import { DATA_ANCHOR } from '@/data/anchor';
import { formatDateTime, formatFullTimestamp, formatRelative, rebaseToNow } from '@/domain/dates';
import { STATUS_LABELS, methodDetails, shortenPaymentId } from '@/domain/display';
import { formatAmount, formatCurrencyCode } from '@/domain/money';
import type { Payment } from '@/domain/payment';
import { PAYMENTS_PATH } from '@/domain/routes';
import { buildTimeline, type TimelineEventKind } from '@/domain/timeline';
import { MethodCell } from '@/components/payments-table/cells/method-cell';
import { AnnouncerProvider } from '@/components/ui/announcer';
import { CopyButton } from '@/components/ui/copy-button';
import { CheckIcon, ChevronIcon, ClockIcon, CloseIcon, RefundIcon } from '@/components/ui/icons';
import { StatusBadge } from '@/components/ui/status-badge';
import { TooltipProvider } from '@/components/ui/tooltip';

const EVENT_STYLE: Record<TimelineEventKind, { Icon: () => ReactNode; className: string }> = {
  created: { Icon: () => <ClockIcon />, className: 'bg-neutral-bg text-neutral-fg' },
  pending: { Icon: () => <ClockIcon />, className: 'bg-neutral-bg text-neutral-fg' },
  succeeded: { Icon: () => <CheckIcon />, className: 'bg-success-bg text-success-fg' },
  failed: { Icon: () => <CloseIcon />, className: 'bg-danger-bg text-danger-fg' },
  refunded: { Icon: () => <RefundIcon />, className: 'bg-neutral-bg text-neutral-fg' },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = `section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <section aria-labelledby={id} className="payment-details__section flex flex-col gap-3">
      <h2 id={id} className="border-b border-border pb-2 text-lg font-bold text-fg-strong">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="payment-details__list grid grid-cols-[180px_1fr] gap-x-6 gap-y-2 text-md">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-fg-muted">{row.label}</dt>
          <dd className="min-w-0 text-fg-strong">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SummaryItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="payment-details__summary-item flex min-w-0 flex-col gap-1 border-r border-border pr-6 last:border-r-0">
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="min-w-0 truncate text-md text-fg-strong">{children}</dd>
    </div>
  );
}

/** Payment details: summary, timeline, payment details, method and metadata. */
export function PaymentDetails({ payment: original }: { payment: Payment }) {
  use(browser('Dates are shown in the viewer’s local time zone.'));
  const [now] = useState(() => new Date());
  const payment = useMemo(() => rebaseToNow([original], DATA_ANCHOR, now)[0], [original, now]);
  const timeline = useMemo(() => buildTimeline(payment), [payment]);
  const amount = formatAmount(payment.amount, payment.currency);
  const currency = formatCurrencyCode(payment.currency);

  return (
    <AnnouncerProvider>
      <TooltipProvider delayDuration={300}>
        <article
          aria-labelledby="payment-title"
          className="payment-details flex flex-col gap-8 pt-4"
        >
          <nav aria-label="Breadcrumb" className="payment-details__breadcrumb text-md">
            <ol className="flex items-center gap-1">
              <li>
                <Link
                  href={PAYMENTS_PATH}
                  className="inline-flex items-center gap-1 rounded-sm font-semibold text-link hover:text-brand-hover"
                >
                  <ChevronIcon direction="left" />
                  Payments
                </Link>
              </li>
              <li aria-hidden className="text-fg-subdued">
                /
              </li>
              <li>
                <span aria-current="page" className="tabular text-fg-muted">
                  {shortenPaymentId(payment.id)}
                </span>
              </li>
            </ol>
          </nav>

          <header className="payment-details__header flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-wide text-fg-muted uppercase">Payment</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 id="payment-title" className="text-title font-bold text-fg-strong">
                <span className="tabular">{amount}</span>{' '}
                <span className="font-normal text-fg-muted">{currency}</span>
              </h1>
              <StatusBadge status={payment.status} />
            </div>
            <p className="flex items-center gap-1 text-md text-fg-muted">
              <span className="tabular">{payment.id}</span>
              <CopyButton value={payment.id} label={`Copy payment ID ${payment.id}`} />
            </p>
          </header>

          <dl className="payment-details__summary grid grid-cols-4 gap-6 border-y border-border py-4">
            <SummaryItem label="Date">
              <time dateTime={payment.created} title={formatFullTimestamp(payment.created)}>
                {formatDateTime(payment.created)}
              </time>
            </SummaryItem>
            <SummaryItem label="Customer">{payment.customer.email}</SummaryItem>
            <SummaryItem label="Payment method">
              <MethodCell method={payment.method} />
            </SummaryItem>
            <SummaryItem label="Status">{STATUS_LABELS[payment.status]}</SummaryItem>
          </dl>

          <Section title="Timeline">
            <ol className="payment-details__timeline flex flex-col">
              {timeline.map((event, index) => {
                const { Icon, className } = EVENT_STYLE[event.kind];
                return (
                  <li key={`${event.kind}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < timeline.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute top-6 left-[11px] h-[calc(100%-24px)] w-px bg-border-strong"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className={`z-10 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${className}`}
                    >
                      <Icon />
                    </span>
                    <div className="flex flex-col">
                      <span className="payment-details__event-title text-md font-semibold text-fg-strong">
                        {event.title}
                      </span>
                      {event.detail ? (
                        <span className="text-md text-fg-muted">{event.detail}</span>
                      ) : null}
                      <time dateTime={event.at} className="text-sm text-fg-muted">
                        {formatFullTimestamp(event.at)} · {formatRelative(event.at, now)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>

          <Section title="Payment details">
            <DetailList
              rows={[
                { label: 'Amount', value: `${amount} ${currency}` },
                { label: 'Status', value: STATUS_LABELS[payment.status] },
                { label: 'Description', value: payment.description ?? '—' },
                { label: 'Created', value: formatFullTimestamp(payment.created) },
                ...(payment.refundedAt
                  ? [{ label: 'Refunded', value: formatFullTimestamp(payment.refundedAt) }]
                  : []),
                ...(payment.failureReason
                  ? [{ label: 'Decline reason', value: payment.failureReason }]
                  : []),
              ]}
            />
          </Section>

          <Section title="Payment method">
            <DetailList rows={methodDetails(payment.method)} />
          </Section>

          <Section title="Metadata">
            <DetailList
              rows={[
                { label: 'Payment ID', value: <span className="tabular">{payment.id}</span> },
                { label: 'Customer name', value: payment.customer.name },
                { label: 'Customer email', value: payment.customer.email },
              ]}
            />
          </Section>
        </article>
      </TooltipProvider>
    </AnnouncerProvider>
  );
}
