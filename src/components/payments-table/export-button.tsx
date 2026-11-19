'use client';

import { csvFilename, toCsv } from '@/domain/csv';
import type { Payment } from '@/domain/payment';
import { useAnnounce } from '@/components/ui/announcer';
import { ExportIcon } from '@/components/ui/icons';
import { toolbarButton } from '@/components/ui/toolbar-button';

/** Saves `content` as a file through a temporary object URL. Browser only. */
function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // Attached for older Firefox; revoked on the next tick so Safari/Firefox can start the download.
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

const countFormat = new Intl.NumberFormat('en-US');

/** Exports every row of the current filtered and sorted view (all pages) as CSV. */
export function ExportButton({ rows, now }: { rows: readonly Payment[]; now: Date }) {
  const announce = useAnnounce();
  const count = rows.length;
  return (
    <button
      type="button"
      className={toolbarButton}
      disabled={count === 0}
      title={`Export ${countFormat.format(count)} ${count === 1 ? 'payment' : 'payments'} as CSV`}
      onClick={() => {
        downloadFile(toCsv(rows), csvFilename(now), 'text/csv;charset=utf-8');
        announce(`Exported ${countFormat.format(count)} ${count === 1 ? 'payment' : 'payments'}`);
      }}
    >
      <ExportIcon />
      Export
    </button>
  );
}
