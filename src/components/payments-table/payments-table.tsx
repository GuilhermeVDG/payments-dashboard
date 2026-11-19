'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Header,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { isOneOf, type Payment } from '@/domain/payment';
import { SORT_KEYS, type SortRule } from '@/domain/sort';
import { SortIcon } from '@/components/ui/icons';
import { createColumns } from './columns';

interface PaymentsTableProps {
  rows: Payment[];
  sort: SortRule[];
  onSortChange: (sort: SortRule[]) => void;
  now: Date;
}

function toSortingState(sort: SortRule[]): SortingState {
  return sort.map(({ key, desc }) => ({ id: key, desc }));
}

function toSortRules(sorting: SortingState): SortRule[] {
  return sorting.flatMap(({ id, desc }) => (isOneOf(SORT_KEYS, id) ? [{ key: id, desc }] : []));
}

/** TanStack passes React synthetic events, so check the shape rather than the class. */
function isShiftClick(event: unknown): boolean {
  return (
    typeof event === 'object' && event !== null && 'shiftKey' in event && event.shiftKey === true
  );
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

function HeaderCell({
  header,
  sortCount,
}: {
  header: Header<Payment, unknown>;
  sortCount: number;
}) {
  const { column } = header;
  const meta = column.columnDef.meta;
  const alignRight = meta?.align === 'right';
  const sorted = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  // ARIA allows aria-sort on one header at a time: the primary sort. Secondary
  // sorts are described with screen reader text instead.
  const isPrimary = sorted !== false && sortIndex === 0;
  const isSecondary = sorted !== false && sortIndex > 0;
  const content = header.isPlaceholder
    ? null
    : flexRender(column.columnDef.header, header.getContext());

  return (
    <th
      scope="col"
      style={{ width: header.getSize() }}
      aria-sort={column.getCanSort() ? (isPrimary ? ARIA_SORT[sorted] : 'none') : undefined}
      className={`payments-table__th payments-table__col--${meta?.className ?? column.id} h-9 px-2 text-sm font-semibold whitespace-nowrap text-fg ${alignRight ? 'text-right' : 'text-left'}`}
    >
      {column.getCanSort() ? (
        <button
          type="button"
          onClick={column.getToggleSortingHandler()}
          title="Click to sort. Shift-click to add a secondary sort."
          className={`payments-table__sort group inline-flex items-center gap-1 rounded-sm ${alignRight ? 'flex-row-reverse' : ''}`}
        >
          <span className={meta?.hiddenHeader ? 'sr-only' : undefined}>{content}</span>
          <SortIcon
            sort={sorted}
            className={
              sorted
                ? 'text-fg'
                : 'text-fg-subdued opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            }
          />
          {sorted && sortCount > 1 ? (
            <span aria-hidden className="payments-table__sort-index text-xs text-fg-subdued">
              {sortIndex + 1}
            </span>
          ) : null}
          {isSecondary ? (
            <span className="sr-only">
              , secondary sort {sortIndex + 1}, {ARIA_SORT[sorted]}
            </span>
          ) : null}
        </button>
      ) : meta?.hiddenHeader ? (
        <span className="sr-only">{content}</span>
      ) : (
        content
      )}
    </th>
  );
}

export function PaymentsTable({ rows, sort, onSortChange, now }: PaymentsTableProps) {
  const columns = useMemo(() => createColumns(now), [now]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const sorting = useMemo(() => toSortingState(sort), [sort]);

  // TanStack Table returns unstable function references, so the React Compiler skips
  // this component; memoization is handled explicitly above.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    enableMultiSort: true,
    enableSortingRemoval: false,
    isMultiSortEvent: isShiftClick,
    state: { sorting, rowSelection },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortChange(toSortRules(next));
    },
    onRowSelectionChange: setRowSelection,
  });

  return (
    <div className="payments-table overflow-x-auto">
      <table className="payments-table__table w-full min-w-max table-fixed border-collapse text-md">
        <caption className="sr-only">Payments</caption>
        <thead className="payments-table__head">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-border">
              {group.headers.map((header) => (
                <HeaderCell key={header.id} header={header} sortCount={sorting.length} />
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="payments-table__body">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              data-state={row.getIsSelected() ? 'selected' : undefined}
              className="payments-table__row group border-b border-border hover:bg-surface-hover data-[state=selected]:bg-surface-subtle"
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta;
                return (
                  <td
                    key={cell.id}
                    className={`payments-table__td payments-table__col--${meta?.className ?? cell.column.id} h-10 max-w-0 truncate px-2 align-middle ${meta?.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
