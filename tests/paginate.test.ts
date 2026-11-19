import { describe, expect, it } from 'vitest';
import { paginate, rangeLabel } from '@/domain/paginate';

const rows = Array.from({ length: 600 }, (_, i) => i + 1);

describe('paginate', () => {
  it('returns the first page by default size', () => {
    const page = paginate(rows, 1, 25);
    expect(page.rows).toHaveLength(25);
    expect(page.rows[0]).toBe(1);
    expect(page).toMatchObject({ page: 1, pageCount: 24, from: 1, to: 25, total: 600 });
    expect(page.hasPrevious).toBe(false);
    expect(page.hasNext).toBe(true);
  });

  it.each([25, 50, 100] as const)('supports page size %i', (size) => {
    const page = paginate(rows, 2, size);
    expect(page.rows).toHaveLength(size);
    expect(page.from).toBe(size + 1);
    expect(page.to).toBe(size * 2);
  });

  it('handles a partial last page', () => {
    const page = paginate(rows.slice(0, 130), 3, 50);
    expect(page.rows).toHaveLength(30);
    expect(page).toMatchObject({ page: 3, pageCount: 3, from: 101, to: 130, total: 130 });
    expect(page.hasNext).toBe(false);
    expect(page.hasPrevious).toBe(true);
  });

  it('clamps out-of-range pages', () => {
    expect(paginate(rows, 999, 100).page).toBe(6);
    expect(paginate(rows, 0, 25).page).toBe(1);
    expect(paginate(rows, -4, 25).page).toBe(1);
    expect(paginate(rows, Number.NaN, 25).page).toBe(1);
  });

  it('handles an empty list', () => {
    const page = paginate([], 3, 25);
    expect(page).toMatchObject({ rows: [], page: 1, pageCount: 1, from: 0, to: 0, total: 0 });
    expect(page.hasPrevious).toBe(false);
    expect(page.hasNext).toBe(false);
  });
});

describe('rangeLabel', () => {
  it('labels the first page', () => {
    expect(rangeLabel(paginate(rows, 1, 25))).toBe('1–25 of 600 results');
  });

  it('labels the last page correctly', () => {
    expect(rangeLabel(paginate(rows, 24, 25))).toBe('576–600 of 600 results');
    expect(rangeLabel(paginate(rows.slice(0, 130), 3, 50))).toBe('101–130 of 130 results');
  });

  it('formats large counts with separators', () => {
    const many = Array.from({ length: 12_345 }, (_, i) => i);
    expect(rangeLabel(paginate(many, 2, 100))).toBe('101–200 of 12,345 results');
  });

  it('handles zero and one result', () => {
    expect(rangeLabel(paginate([], 1, 25))).toBe('0 results');
    expect(rangeLabel(paginate([1], 1, 25))).toBe('1 result');
  });
});
