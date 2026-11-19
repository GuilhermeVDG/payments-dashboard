'use client';

import { formatDateTime, formatFullTimestamp, formatRelative } from '@/domain/dates';
import { Tooltip } from '@/components/ui/tooltip';
import { EmptyValue } from './text-cells';

/** `Nov 19, 2:41 PM`; the tooltip shows relative time and the full timestamp. */
export function DateCell({ iso, now }: { iso?: string; now: Date }) {
  if (!iso) return <EmptyValue />;
  return (
    <Tooltip
      content={
        <span className="date-tooltip flex flex-col gap-0.5">
          <span className="font-semibold text-fg-strong">{formatRelative(iso, now)}</span>
          <span className="text-fg-muted">{formatFullTimestamp(iso)}</span>
        </span>
      }
    >
      <time
        dateTime={iso}
        tabIndex={0}
        className="date-cell tabular rounded-sm whitespace-nowrap text-fg-muted"
      >
        {formatDateTime(iso)}
      </time>
    </Tooltip>
  );
}
