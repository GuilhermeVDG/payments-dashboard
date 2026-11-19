import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAYOUT,
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MOVABLE_COLUMNS,
  clampWidth,
  columnVisibility,
  fullColumnOrder,
  isDefaultLayout,
  moveColumn,
  parseColumnLayout,
  resizeColumn,
  setColumnHidden,
  visibleMovableColumns,
  withSizing,
} from '@/domain/column-layout';

const order = [...MOVABLE_COLUMNS];

describe('moveColumn', () => {
  it('moves a column to the position of another', () => {
    expect(moveColumn(order, 'created', 'amount').slice(0, 3)).toEqual([
      'created',
      'amount',
      'currency',
    ]);
    expect(moveColumn(order, 'amount', 'status').slice(0, 3)).toEqual([
      'currency',
      'status',
      'amount',
    ]);
  });

  it('ignores unknown or identical ids and does not mutate', () => {
    expect(moveColumn(order, 'select', 'amount')).toEqual(order);
    expect(moveColumn(order, 'amount', 'amount')).toEqual(order);
    moveColumn(order, 'created', 'amount');
    expect(order).toEqual([...MOVABLE_COLUMNS]);
  });
});

describe('fullColumnOrder', () => {
  it('keeps select first and actions last', () => {
    const full = fullColumnOrder(DEFAULT_LAYOUT);
    expect(full[0]).toBe('select');
    expect(full.at(-1)).toBe('actions');
    expect(full).toHaveLength(MOVABLE_COLUMNS.length + 2);
  });
});

describe('setColumnHidden', () => {
  it('hides and shows hideable columns in default order', () => {
    const hidden = setColumnHidden(
      setColumnHidden(DEFAULT_LAYOUT, 'description', true),
      'currency',
      true,
    );
    expect(hidden.hidden).toEqual(['currency', 'description']);
    expect(setColumnHidden(hidden, 'description', false).hidden).toEqual(['currency']);
  });

  it('never hides Amount, Date or Payment ID', () => {
    expect(setColumnHidden(DEFAULT_LAYOUT, 'amount', true).hidden).toEqual([]);
    expect(setColumnHidden(DEFAULT_LAYOUT, 'created', true).hidden).toEqual([]);
    expect(setColumnHidden(DEFAULT_LAYOUT, 'id', true).hidden).toEqual([]);
  });
});

describe('clampWidth', () => {
  it('keeps widths within bounds', () => {
    expect(clampWidth(10)).toBe(MIN_COLUMN_WIDTH);
    expect(clampWidth(9999)).toBe(MAX_COLUMN_WIDTH);
    expect(clampWidth(120.4)).toBe(120);
  });
});

describe('isDefaultLayout', () => {
  it('detects changes to order, size or visibility', () => {
    expect(isDefaultLayout(DEFAULT_LAYOUT)).toBe(true);
    expect(isDefaultLayout({ ...DEFAULT_LAYOUT, sizing: { amount: 120 } })).toBe(false);
    expect(isDefaultLayout({ ...DEFAULT_LAYOUT, hidden: ['description'] })).toBe(false);
    expect(
      isDefaultLayout({ ...DEFAULT_LAYOUT, order: moveColumn(order, 'created', 'amount') }),
    ).toBe(false);
  });
});

describe('parseColumnLayout', () => {
  it('round-trips a valid layout', () => {
    const layout = {
      order: moveColumn(order, 'created', 'amount'),
      sizing: { amount: 140 },
      hidden: ['description' as const],
    };
    expect(parseColumnLayout(JSON.parse(JSON.stringify(layout)))).toEqual(layout);
  });

  it.each([null, 'x', 42, []])('falls back to the default for %j', (value) => {
    expect(parseColumnLayout(value)).toEqual(DEFAULT_LAYOUT);
  });

  it('drops unknown and repeated ids and appends missing columns', () => {
    const parsed = parseColumnLayout({ order: ['created', 'bogus', 'created', 'amount'] });
    expect(parsed.order.slice(0, 2)).toEqual(['created', 'amount']);
    expect(new Set(parsed.order)).toEqual(new Set(MOVABLE_COLUMNS));
    expect(parsed.order).toHaveLength(MOVABLE_COLUMNS.length);
  });

  it('clamps widths and ignores invalid ones', () => {
    expect(
      parseColumnLayout({ sizing: { amount: 5, customer: 'wide', bogus: 200, id: 9999 } }).sizing,
    ).toEqual({ amount: MIN_COLUMN_WIDTH, id: MAX_COLUMN_WIDTH });
  });

  it('only keeps hideable columns in hidden', () => {
    expect(parseColumnLayout({ hidden: ['amount', 'id', 'description', 'bogus'] }).hidden).toEqual([
      'description',
    ]);
  });
});

describe('resizeColumn', () => {
  it('grows, shrinks and clamps to the bounds', () => {
    expect(resizeColumn(DEFAULT_LAYOUT, 'customer', 268, 16).sizing.customer).toBe(284);
    expect(resizeColumn(DEFAULT_LAYOUT, 'customer', 60, -32).sizing.customer).toBe(
      MIN_COLUMN_WIDTH,
    );
    expect(resizeColumn(DEFAULT_LAYOUT, 'customer', 470, 32).sizing.customer).toBe(
      MAX_COLUMN_WIDTH,
    );
  });

  it('resets with null and ignores pinned columns', () => {
    const wide = resizeColumn(DEFAULT_LAYOUT, 'customer', 268, 16);
    expect(resizeColumn(wide, 'customer', 284, null).sizing).toEqual({});
    expect(resizeColumn(DEFAULT_LAYOUT, 'select', 36, 16)).toBe(DEFAULT_LAYOUT);
  });
});

describe('withSizing', () => {
  it('keeps movable columns only and clamps', () => {
    expect(
      withSizing(DEFAULT_LAYOUT, { amount: 5, select: 80, bogus: 100, id: 200.6 }).sizing,
    ).toEqual({
      amount: MIN_COLUMN_WIDTH,
      id: 201,
    });
  });
});

describe('columnVisibility / visibleMovableColumns', () => {
  it('derives TanStack visibility and the visible order', () => {
    const layout = setColumnHidden(
      { ...DEFAULT_LAYOUT, order: moveColumn(order, 'created', 'amount') },
      'description',
      true,
    );
    expect(columnVisibility(layout)).toEqual({ description: false });
    expect(visibleMovableColumns(layout)).not.toContain('description');
    expect(visibleMovableColumns(layout)[0]).toBe('created');
  });
});
