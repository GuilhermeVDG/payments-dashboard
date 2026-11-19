/**
 * Status tabs above the filters (All, Succeeded, Refunded, Disputed, Failed, Uncaptured).
 * Tabs for statuses the data model has map onto the status filter. Disputed and
 * Uncaptured have no payments in this dataset, so they are a separate URL value
 * that matches nothing and shows the empty state.
 */
import type { Status } from './payment';

export const UNAVAILABLE_STATUS_TABS = ['disputed', 'uncaptured'] as const;
export type UnavailableStatusTab = (typeof UNAVAILABLE_STATUS_TABS)[number];

export type StatusTabId = 'all' | 'succeeded' | 'refunded' | 'failed' | UnavailableStatusTab;

export interface StatusTab {
  id: StatusTabId;
  label: string;
}

export const STATUS_TABS: readonly StatusTab[] = [
  { id: 'all', label: 'All' },
  { id: 'succeeded', label: 'Succeeded' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'disputed', label: 'Disputed' },
  { id: 'failed', label: 'Failed' },
  { id: 'uncaptured', label: 'Uncaptured' },
];

const SINGLE_STATUS_TABS: Partial<Record<Status, StatusTabId>> = {
  succeeded: 'succeeded',
  refunded: 'refunded',
  failed: 'failed',
};

export interface StatusTabSelection {
  status: Status[];
  tab: UnavailableStatusTab | null;
}

/** The tab that reflects the current status filter, or null when none does (e.g. two statuses). */
export function activeStatusTab(
  status: readonly Status[],
  tab: UnavailableStatusTab | null,
): StatusTabId | null {
  if (tab) return tab;
  if (status.length === 0) return 'all';
  if (status.length === 1) return SINGLE_STATUS_TABS[status[0]] ?? null;
  return null;
}

/** The filter values a tab selects. */
export function selectStatusTab(id: StatusTabId): StatusTabSelection {
  switch (id) {
    case 'all':
      return { status: [], tab: null };
    case 'succeeded':
    case 'refunded':
    case 'failed':
      return { status: [id], tab: null };
    case 'disputed':
    case 'uncaptured':
      return { status: [], tab: id };
  }
}
