'use client';

import { STATUS_TABS, activeStatusTab, selectStatusTab } from '@/domain/status-tabs';
import type { FilterControlProps } from './types';

/** Row of status cards above the filter chips. Each is a toggle button bound to the status filter. */
export function StatusTabs({ filters, onChange }: FilterControlProps) {
  const active = activeStatusTab(filters.status, filters.statusTab);
  return (
    <div role="group" aria-label="Payment status" className="status-tabs grid grid-cols-6 gap-2">
      {STATUS_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              const { status, tab: value } = selectStatusTab(tab.id);
              onChange({ status: status.length > 0 ? status : null, tab: value });
            }}
            className={`status-tabs__tab flex h-11 items-center rounded-lg border px-3 text-left text-md font-semibold ${
              selected
                ? 'status-tabs__tab--active border-brand text-link ring-1 ring-brand'
                : 'border-border-strong text-fg-muted hover:border-fg-subdued'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
