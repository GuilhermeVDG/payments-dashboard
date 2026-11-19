export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export interface Page<T> {
  rows: T[];
  /** 1-based page number, clamped to [1, pageCount]. */
  page: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first row shown, 0 when empty. */
  from: number;
  /** 1-based index of the last row shown, 0 when empty. */
  to: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export function paginate<T>(rows: readonly T[], page: number, size: PageSize): Page<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const startIndex = (current - 1) * size;
  const slice = rows.slice(startIndex, startIndex + size);
  return {
    rows: slice,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : startIndex + 1,
    to: startIndex + slice.length,
    hasPrevious: current > 1,
    hasNext: current < pageCount,
  };
}

const countFormat = new Intl.NumberFormat('en-US');

/**
 * Range label pieces (`1–25` of `600` results) so the UI can emphasise the
 * numbers. A single result or none has no range: `1 result`, `0 results`.
 */
export interface RangeLabelParts {
  /** `1–25`; null when there is at most one result. */
  range: string | null;
  total: string;
  noun: 'result' | 'results';
}

export function rangeLabelParts({
  from,
  to,
  total,
}: Pick<Page<unknown>, 'from' | 'to' | 'total'>): RangeLabelParts {
  return {
    range: total > 1 ? `${countFormat.format(from)}–${countFormat.format(to)}` : null,
    total: countFormat.format(total),
    noun: total === 1 ? 'result' : 'results',
  };
}
