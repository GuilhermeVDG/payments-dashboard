'use client';

import { useSortable } from '@dnd-kit/sortable';
import { flexRender, type Header } from '@tanstack/react-table';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { COLUMN_LABELS, RESIZE_STEP, type MovableColumn } from '@/domain/column-layout';
import type { Payment } from '@/domain/payment';
import { GripIcon, SortIcon } from '@/components/ui/icons';

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

/** Pinned cells keep a solid background and a hairline on their left edge. */
export const STICKY_RIGHT =
  'sticky right-0 z-10 bg-surface shadow-[inset_1px_0_0_var(--color-border)] group-hover:bg-surface-hover group-data-[state=selected]:bg-surface-subtle';

interface HeaderCellProps {
  header: Header<Payment, unknown>;
  sortCount: number;
  /** The reference shows no arrow for the default sort; reveal it on hover/focus only. */
  isDefaultSort: boolean;
  /** Resize by a number of px (keyboard), or reset to the default width (null). */
  onResize: (columnId: string, delta: number | null) => void;
}

function SortButton({ header, sortCount, isDefaultSort }: HeaderCellProps) {
  const { column } = header;
  const meta = column.columnDef.meta;
  const sorted = column.getIsSorted();
  const sortIndex = column.getSortIndex();
  const isSecondary = sorted !== false && sortIndex > 0;
  const content = flexRender(column.columnDef.header, header.getContext());

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      title="Click to sort. Shift-click to add a secondary sort."
      className={`payments-table__sort group/sort inline-flex items-center gap-1 rounded-sm ${meta?.align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <span className={meta?.hiddenHeader ? 'sr-only' : undefined}>{content}</span>
      <SortIcon
        sort={sorted}
        className={
          sorted && !isDefaultSort
            ? 'text-fg-strong'
            : 'text-fg-subdued opacity-0 group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100'
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
  );
}

function HeaderLabel(props: HeaderCellProps) {
  const { header } = props;
  const { column } = header;
  if (header.isPlaceholder) return null;
  if (column.getCanSort()) return <SortButton {...props} />;
  const content = flexRender(column.columnDef.header, header.getContext());
  return column.columnDef.meta?.hiddenHeader ? <span className="sr-only">{content}</span> : content;
}

/**
 * Window-splitter style handle. Pointer: drag the edge, double-click resets.
 * Keyboard: Left/Right resize by a step, Home/End jump to min/max, Enter resets.
 */
function ResizeHandle({ header, onResize, label }: HeaderCellProps & { label: string }) {
  const { column } = header;
  const size = header.getSize();
  const min = column.columnDef.minSize ?? size;
  const max = column.columnDef.maxSize ?? size;
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const deltas: Record<string, number> = {
      ArrowLeft: -RESIZE_STEP,
      ArrowRight: RESIZE_STEP,
      Home: min - size,
      End: max - size,
    };
    if (event.key in deltas) {
      event.preventDefault();
      onResize(column.id, deltas[event.key]);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onResize(column.id, null);
    }
  }
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuenow={size}
      aria-valuetext={`${size} pixels`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-keyshortcuts="ArrowLeft ArrowRight Home End Enter"
      title="Drag to resize. Double-click or press Enter to reset."
      tabIndex={0}
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => onResize(column.id, null)}
      onKeyDown={onKeyDown}
      className={`payments-table__resize absolute top-1.5 right-0 bottom-1.5 w-1.5 cursor-col-resize touch-none rounded-full select-none hover:bg-border-strong focus-visible:bg-brand ${column.getIsResizing() ? 'bg-brand' : ''}`}
    />
  );
}

function thClassName(header: Header<Payment, unknown>, extra = ''): string {
  const { column } = header;
  const meta = column.columnDef.meta;
  return `payments-table__th payments-table__col--${meta?.className ?? column.id} group/th h-9 px-2 text-sm font-semibold whitespace-nowrap text-fg-strong ${meta?.align === 'right' ? 'text-right' : 'text-left'} ${meta?.stickyRight ? STICKY_RIGHT : 'relative'} ${extra}`;
}

function ariaSort(header: Header<Payment, unknown>) {
  const { column } = header;
  if (!column.getCanSort()) return undefined;
  const sorted = column.getIsSorted();
  // ARIA allows aria-sort on one header at a time: the primary sort.
  return sorted && column.getSortIndex() === 0 ? ARIA_SORT[sorted] : 'none';
}

/** Header for pinned columns (select, actions): no drag, no resize. */
export function FixedHeaderCell(props: HeaderCellProps) {
  const { header } = props;
  return (
    <th
      scope="col"
      style={{ width: header.getSize() }}
      aria-sort={ariaSort(header)}
      className={thClassName(header)}
    >
      <HeaderLabel {...props} />
    </th>
  );
}

/** Header for movable columns: drag handle to reorder, edge to resize. */
export function SortableHeaderCell(props: HeaderCellProps & { id: MovableColumn }) {
  const { header, id } = props;
  const label = COLUMN_LABELS[id];
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: CSSProperties = {
    width: header.getSize(),
    transform: transform ? `translate3d(${Math.round(transform.x)}px, 0, 0)` : undefined,
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  const grip: ReactNode = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      aria-label={`Reorder ${label} column`}
      {...attributes}
      {...listeners}
      className={`payments-table__drag inline-flex h-5 w-3 shrink-0 cursor-grab items-center justify-center rounded-sm text-fg-subdued opacity-0 group-hover/th:opacity-100 focus-visible:opacity-100 active:cursor-grabbing ${isDragging ? 'opacity-100' : ''}`}
    >
      <GripIcon />
    </button>
  );

  const alignRight = header.column.columnDef.meta?.align === 'right';
  return (
    <th
      ref={setNodeRef}
      scope="col"
      style={style}
      aria-sort={ariaSort(header)}
      className={thClassName(header, isDragging ? 'bg-surface shadow-popover' : '')}
    >
      <span
        className={`inline-flex max-w-full items-center gap-1 ${alignRight ? 'flex-row-reverse' : ''}`}
      >
        {grip}
        <HeaderLabel {...props} />
      </span>
      <ResizeHandle {...props} label={label} />
    </th>
  );
}
