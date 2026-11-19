/**
 * Table column layout: order, widths and visibility. Pure helpers so the table
 * only wires them to TanStack state and localStorage.
 */

/** Columns pinned in place: never moved, resized or hidden. */
export const FIXED_START = ['select'] as const;
export const FIXED_END = ['actions'] as const;

export const MOVABLE_COLUMNS = [
  'amount',
  'currency',
  'status',
  'method',
  'description',
  'customer',
  'id',
  'created',
  'refundedAt',
  'failureReason',
] as const;
export type MovableColumn = (typeof MOVABLE_COLUMNS)[number];

export const COLUMN_LABELS: Record<MovableColumn, string> = {
  amount: 'Amount',
  currency: 'Currency',
  status: 'Status',
  method: 'Payment method',
  description: 'Description',
  customer: 'Customer',
  id: 'Payment ID',
  created: 'Date',
  refundedAt: 'Refunded date',
  failureReason: 'Decline reason',
};

/** Columns the user may hide; Amount and Date always stay visible. */
export const HIDEABLE_COLUMNS: readonly MovableColumn[] = MOVABLE_COLUMNS.filter(
  (id) => id !== 'amount' && id !== 'created',
);

export const MIN_COLUMN_WIDTH = 48;
export const MAX_COLUMN_WIDTH = 480;
export const RESIZE_STEP = 16;

export interface ColumnLayout {
  order: MovableColumn[];
  /** Width overrides in px; missing ids use the column default. */
  sizing: Partial<Record<MovableColumn, number>>;
  hidden: MovableColumn[];
}

export const DEFAULT_LAYOUT: ColumnLayout = {
  order: [...MOVABLE_COLUMNS],
  sizing: {},
  hidden: [],
};

function isMovable(value: unknown): value is MovableColumn {
  return typeof value === 'string' && (MOVABLE_COLUMNS as readonly string[]).includes(value);
}

export function clampWidth(width: number): number {
  return Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width)));
}

/** Full TanStack column order: fixed start, movable order, fixed end. */
export function fullColumnOrder(layout: ColumnLayout): string[] {
  return [...FIXED_START, ...layout.order, ...FIXED_END];
}

/** Moves `active` to the position of `over`. Unknown ids leave the order unchanged. */
export function moveColumn(
  order: readonly MovableColumn[],
  active: string,
  over: string,
): MovableColumn[] {
  const from = order.indexOf(active as MovableColumn);
  const to = order.indexOf(over as MovableColumn);
  if (from === -1 || to === -1 || from === to) return [...order];
  const next = [...order];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function setColumnHidden(
  layout: ColumnLayout,
  id: MovableColumn,
  hidden: boolean,
): ColumnLayout {
  if (!HIDEABLE_COLUMNS.includes(id)) return layout;
  const set = new Set(layout.hidden);
  if (hidden) set.add(id);
  else set.delete(id);
  return { ...layout, hidden: MOVABLE_COLUMNS.filter((c) => set.has(c)) };
}

export function isDefaultLayout(layout: ColumnLayout): boolean {
  return (
    layout.hidden.length === 0 &&
    Object.keys(layout.sizing).length === 0 &&
    layout.order.every((id, i) => id === MOVABLE_COLUMNS[i])
  );
}

/**
 * Validates a stored layout (parsed JSON of unknown shape). Unknown or repeated
 * ids are dropped, missing columns are appended in default order, widths are
 * clamped, and anything unusable falls back to the default.
 */
export function parseColumnLayout(value: unknown): ColumnLayout {
  if (typeof value !== 'object' || value === null) return DEFAULT_LAYOUT;
  const raw = value as Record<string, unknown>;

  const seen = new Set<MovableColumn>();
  const order: MovableColumn[] = [];
  if (Array.isArray(raw.order)) {
    for (const id of raw.order) {
      if (isMovable(id) && !seen.has(id)) {
        seen.add(id);
        order.push(id);
      }
    }
  }
  for (const id of MOVABLE_COLUMNS) if (!seen.has(id)) order.push(id);

  const sizing: Partial<Record<MovableColumn, number>> = {};
  if (typeof raw.sizing === 'object' && raw.sizing !== null) {
    for (const [id, width] of Object.entries(raw.sizing)) {
      if (isMovable(id) && typeof width === 'number' && Number.isFinite(width)) {
        sizing[id] = clampWidth(width);
      }
    }
  }

  const storedHidden: unknown[] = Array.isArray(raw.hidden) ? raw.hidden : [];
  const hidden = MOVABLE_COLUMNS.filter(
    (id) => HIDEABLE_COLUMNS.includes(id) && storedHidden.includes(id),
  );

  return { order, sizing, hidden };
}

/** TanStack visibility state: hidden columns map to false. */
export function columnVisibility(layout: ColumnLayout): Record<string, boolean> {
  return Object.fromEntries(layout.hidden.map((id) => [id, false]));
}

/** Applies widths from TanStack sizing state, keeping only movable columns, clamped. */
export function withSizing(layout: ColumnLayout, sizing: Record<string, number>): ColumnLayout {
  const next: ColumnLayout['sizing'] = {};
  for (const [id, width] of Object.entries(sizing)) {
    if (isMovable(id) && Number.isFinite(width)) next[id] = clampWidth(width);
  }
  return { ...layout, sizing: next };
}

/**
 * Keyboard resize: grows or shrinks a column by `delta` px from its current width,
 * clamped; `null` resets it to the default width. Pinned or unknown ids are ignored.
 */
export function resizeColumn(
  layout: ColumnLayout,
  id: string,
  currentWidth: number,
  delta: number | null,
): ColumnLayout {
  if (!isMovable(id)) return layout;
  const sizing = { ...layout.sizing };
  if (delta === null) delete sizing[id];
  else sizing[id] = clampWidth(currentWidth + delta);
  return { ...layout, sizing };
}

/** Visible movable columns in display order (the sortable header items). */
export function visibleMovableColumns(layout: ColumnLayout): MovableColumn[] {
  return layout.order.filter((id) => !layout.hidden.includes(id));
}
