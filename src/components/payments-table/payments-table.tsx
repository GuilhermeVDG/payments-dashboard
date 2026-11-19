'use client';

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type MouseEvent } from 'react';
import {
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MOVABLE_COLUMNS,
  columnVisibility,
  fullColumnOrder,
  moveColumn,
  resizeColumn,
  visibleMovableColumns,
  withSizing,
  type ColumnLayout,
} from '@/domain/column-layout';
import { isOneOf, type Payment } from '@/domain/payment';
import { paymentHref } from '@/domain/routes';
import { SORT_KEYS, isDefaultSortRules, type SortRule } from '@/domain/sort';
import { createColumns } from './columns';
import { COLUMN_DRAG_ANNOUNCEMENTS, COLUMN_DRAG_INSTRUCTIONS } from './column-dnd';
import { FixedHeaderCell, STICKY_RIGHT, SortableHeaderCell } from './header-cell';

interface PaymentsTableProps {
  rows: Payment[];
  sort: SortRule[];
  onSortChange: (sort: SortRule[]) => void;
  now: Date;
  layout: ColumnLayout;
  onLayoutChange: (layout: ColumnLayout) => void;
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

/** Clicks on controls inside a row keep their own behavior instead of opening the payment. */
const INTERACTIVE =
  'a, button, input, select, [role="checkbox"], [role="menuitem"], [role="menu"], [data-row-click="ignore"]';

/** Only a plain primary click opens the payment; modified clicks and text selection do not. */
function shouldOpenRow(event: MouseEvent<HTMLTableRowElement>): boolean {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return false;
  return !window.getSelection()?.toString();
}

export function PaymentsTable({
  rows,
  sort,
  onSortChange,
  now,
  layout,
  onLayoutChange,
}: PaymentsTableProps) {
  const columns = useMemo(() => createColumns(now), [now]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const router = useRouter();
  const sorting = useMemo(() => toSortingState(sort), [sort]);
  const isDefaultSort = isDefaultSortRules(sort);
  const columnOrder = useMemo(() => fullColumnOrder(layout), [layout]);
  const visibility = useMemo(() => columnVisibility(layout), [layout]);
  const visibleMovable = useMemo(() => visibleMovableColumns(layout), [layout]);
  const sensors = useSensors(
    // A small drag distance keeps clicks on the grip from starting a drag by accident.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    defaultColumn: { minSize: MIN_COLUMN_WIDTH, maxSize: MAX_COLUMN_WIDTH },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      rowSelection,
      columnOrder,
      columnVisibility: visibility,
      columnSizing: layout.sizing,
    },
    onColumnSizingChange: (updater: Updater<ColumnSizingState>) => {
      const next = typeof updater === 'function' ? updater(layout.sizing) : updater;
      onLayoutChange(withSizing(layout, next));
    },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortChange(toSortRules(next));
    },
    onRowSelectionChange: setRowSelection,
  });

  function resize(columnId: string, delta: number | null) {
    const current = table.getColumn(columnId)?.getSize() ?? 0;
    onLayoutChange(resizeColumn(layout, columnId, current, delta));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onLayoutChange({
      ...layout,
      order: moveColumn(layout.order, String(active.id), String(over.id)),
    });
  }

  return (
    <div className="payments-table relative overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements: COLUMN_DRAG_ANNOUNCEMENTS,
          screenReaderInstructions: COLUMN_DRAG_INSTRUCTIONS,
        }}
      >
        <table className="payments-table__table w-full min-w-max table-fixed border-collapse text-md">
          <caption className="sr-only">Payments</caption>
          <thead className="payments-table__head">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-border">
                <SortableContext items={visibleMovable} strategy={horizontalListSortingStrategy}>
                  {group.headers.map((header) => {
                    const shared = {
                      header,
                      sortCount: sorting.length,
                      isDefaultSort,
                      onResize: resize,
                    };
                    const id = header.column.id;
                    return isOneOf(MOVABLE_COLUMNS, id) ? (
                      <SortableHeaderCell key={header.id} id={id} {...shared} />
                    ) : (
                      <FixedHeaderCell key={header.id} {...shared} />
                    );
                  })}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody className="payments-table__body">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
                // Mouse convenience; keyboard users open the payment via the Payment ID link.
                onClick={(event: MouseEvent<HTMLTableRowElement>) => {
                  if (shouldOpenRow(event)) router.push(paymentHref(row.original.id));
                }}
                className="payments-table__row group cursor-pointer border-b border-border hover:bg-surface-hover data-[state=selected]:bg-surface-subtle"
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta;
                  return (
                    <td
                      key={cell.id}
                      data-row-click={meta?.ignoreRowClick ? 'ignore' : undefined}
                      className={`payments-table__td payments-table__col--${meta?.className ?? cell.column.id} h-9 max-w-0 truncate px-2 align-middle ${meta?.align === 'right' ? 'text-right' : 'text-left'} ${meta?.stickyRight ? STICKY_RIGHT : ''}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
