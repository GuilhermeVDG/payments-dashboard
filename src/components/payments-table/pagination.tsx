'use client';

import { PAGE_SIZES, rangeLabel, type Page, type PageSize } from '@/domain/paginate';

interface PaginationProps {
  page: Pick<Page<unknown>, 'from' | 'to' | 'total' | 'page' | 'hasPrevious' | 'hasNext'>;
  size: PageSize;
  onPageChange: (page: number) => void;
  onSizeChange: (size: PageSize) => void;
}

function toPageSize(value: string): PageSize | undefined {
  return PAGE_SIZES.find((option) => String(option) === value);
}

const buttonClass =
  'pagination__button h-7 rounded-md border border-border-strong bg-surface px-2.5 text-sm font-semibold text-fg shadow-[0_1px_1px_rgb(0_0_0/0.04)] hover:bg-surface-hover disabled:cursor-default disabled:text-fg-subdued disabled:hover:bg-surface';

export function Pagination({ page, size, onPageChange, onSizeChange }: PaginationProps) {
  return (
    <nav
      aria-label="Pagination"
      className="pagination flex items-center justify-between gap-4 py-3"
    >
      <p className="pagination__summary text-md text-fg-muted" aria-live="polite">
        Viewing <span className="font-semibold text-fg">{rangeLabel(page)}</span>
      </p>
      <div className="pagination__controls flex items-center gap-2">
        <label className="pagination__size flex items-center gap-2 text-sm text-fg-muted">
          <span>Rows per page</span>
          <select
            value={size}
            onChange={(event) => {
              const next = toPageSize(event.target.value);
              if (next) onSizeChange(next);
            }}
            className="h-7 rounded-md border border-border-strong bg-surface px-1.5 text-sm text-fg"
          >
            {PAGE_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={!page.hasPrevious}
          onClick={() => onPageChange(page.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!page.hasNext}
          onClick={() => onPageChange(page.page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
