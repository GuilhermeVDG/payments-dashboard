import type { UnavailableStatusTab } from '@/domain/status-tabs';
import { EmptySearchIcon } from '@/components/ui/icons';

const TAB_MESSAGES: Record<UnavailableStatusTab, { title: string; body: string }> = {
  disputed: {
    title: 'No disputed payments',
    body: 'Payments that customers dispute with their bank will appear here.',
  },
  uncaptured: {
    title: 'No uncaptured payments',
    body: 'Payments that are authorized but not yet captured will appear here.',
  },
};

const NO_RESULTS = {
  title: 'No results found',
  body: 'There aren’t any results for that query. Try a different filter.',
};

export function emptyStateCopy(statusTab: UnavailableStatusTab | null) {
  return statusTab ? TAB_MESSAGES[statusTab] : NO_RESULTS;
}

/** Visual empty state. The announcement lives in a persistent live region in PaymentsView. */
export function EmptyState({
  statusTab,
  onClearFilters,
}: {
  statusTab: UnavailableStatusTab | null;
  onClearFilters: () => void;
}) {
  const { title, body } = emptyStateCopy(statusTab);
  return (
    <div className="empty-state flex flex-col items-center gap-2 border-b border-border py-16 text-center">
      <EmptySearchIcon className="text-fg-subdued" />
      <h2 className="empty-state__title text-lg font-semibold text-fg-strong">{title}</h2>
      <p className="empty-state__body max-w-sm text-md text-fg-muted">{body}</p>
      <button
        type="button"
        onClick={onClearFilters}
        className="empty-state__clear mt-2 h-7 rounded-md border border-border-strong bg-surface px-2.5 text-sm font-semibold text-fg shadow-[0_1px_1px_rgb(0_0_0/0.04)] hover:bg-surface-hover"
      >
        Clear filters
      </button>
    </div>
  );
}
