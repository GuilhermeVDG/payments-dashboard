'use client';

import { createColumnHelper, type RowData, type TableOptions } from '@tanstack/react-table';
import type { Payment } from '@/domain/payment';
import type { SortKey } from '@/domain/sort';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { AmountCell, CurrencyCell } from './cells/amount-cell';
import { DateCell } from './cells/date-cell';
import { MethodCell } from './cells/method-cell';
import { PaymentIdCell } from './cells/payment-id-cell';
import { RowActions } from './cells/row-actions';
import { CustomerCell, DeclineReasonCell, DescriptionCell } from './cells/text-cells';

declare module '@tanstack/react-table' {
  // Generic parameters must match TanStack's declaration to merge.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right';
    /** Header text kept for screen readers but not shown. */
    hiddenHeader?: boolean;
    /** Column hook for styling: `payments-table__col--<name>`. */
    className?: string;
    /** Pinned to the right edge while the table scrolls horizontally. */
    stickyRight?: boolean;
    /** Clicks anywhere in this cell never open the payment (controls with padding). */
    ignoreRowClick?: boolean;
  }
}

const column = createColumnHelper<Payment>();

/** Column ids that are sortable map 1:1 to domain sort keys. */
const SORT_IDS = {
  amount: 'amount',
  status: 'status',
  created: 'created',
} as const satisfies Record<string, SortKey>;

/** Typed as the table option so mixed accessor value types fit one array. */
export function createColumns(now: Date): TableOptions<Payment>['columns'] {
  return [
    column.display({
      id: 'select',
      size: 36,
      enableResizing: false,
      header: ({ table }) => (
        <Checkbox
          label="Select all payments on this page"
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          label={`Select payment ${row.original.id}`}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      ),
      meta: { className: 'select', ignoreRowClick: true },
    }),
    column.accessor('amount', {
      id: SORT_IDS.amount,
      header: 'Amount',
      size: 100,
      sortDescFirst: true,
      cell: ({ row }) => (
        <AmountCell amount={row.original.amount} currency={row.original.currency} />
      ),
      meta: { align: 'right', className: 'amount' },
    }),
    column.accessor('currency', {
      header: 'Currency',
      size: 48,
      enableSorting: false,
      cell: ({ row }) => <CurrencyCell currency={row.original.currency} />,
      meta: { hiddenHeader: true, className: 'currency' },
    }),
    column.accessor('status', {
      id: SORT_IDS.status,
      header: 'Status',
      size: 124,
      sortDescFirst: false,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      // The reference shows no label over the badges; the sort control keeps an
      // accessible name and reveals its arrow on hover, focus or when active.
      meta: { hiddenHeader: true, className: 'status' },
    }),
    column.accessor('method', {
      header: 'Payment method',
      size: 136,
      enableSorting: false,
      cell: ({ row }) => <MethodCell method={row.original.method} />,
      meta: { align: 'right', className: 'method' },
    }),
    column.accessor('description', {
      header: 'Description',
      size: 158,
      enableSorting: false,
      cell: ({ row }) => <DescriptionCell description={row.original.description} />,
      meta: { className: 'description' },
    }),
    column.accessor('customer', {
      header: 'Customer',
      size: 268,
      enableSorting: false,
      cell: ({ row }) => <CustomerCell customer={row.original.customer} />,
      meta: { className: 'customer' },
    }),
    column.accessor('id', {
      header: 'Payment ID',
      size: 150,
      enableSorting: false,
      cell: ({ row }) => <PaymentIdCell id={row.original.id} />,
      meta: { className: 'id' },
    }),
    column.accessor('created', {
      id: SORT_IDS.created,
      header: 'Date',
      size: 136,
      sortDescFirst: true,
      cell: ({ row }) => <DateCell iso={row.original.created} now={now} />,
      meta: { className: 'created' },
    }),
    column.accessor('refundedAt', {
      header: 'Refunded date',
      size: 116,
      enableSorting: false,
      cell: ({ row }) => <DateCell iso={row.original.refundedAt} now={now} />,
      meta: { className: 'refunded' },
    }),
    column.accessor('failureReason', {
      header: 'Decline reason',
      size: 140,
      enableSorting: false,
      cell: ({ row }) => <DeclineReasonCell reason={row.original.failureReason} />,
      meta: { className: 'decline-reason' },
    }),
    column.display({
      id: 'actions',
      size: 44,
      enableResizing: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <RowActions paymentId={row.original.id} />,
      meta: { align: 'right', className: 'actions', stickyRight: true, ignoreRowClick: true },
    }),
  ];
}
