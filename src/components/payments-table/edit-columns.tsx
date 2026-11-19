'use client';

import * as Popover from '@radix-ui/react-popover';
import { useId, useRef } from 'react';
import {
  COLUMN_LABELS,
  HIDEABLE_COLUMNS,
  isDefaultLayout,
  setColumnHidden,
  type ColumnLayout,
} from '@/domain/column-layout';
import { Checkbox } from '@/components/ui/checkbox';
import { GearIcon } from '@/components/ui/icons';
import { toolbarButton } from '@/components/ui/toolbar-button';

interface EditColumnsProps {
  layout: ColumnLayout;
  onLayoutChange: (layout: ColumnLayout) => void;
  onReset: () => void;
  /** Columns in the active sort can't be hidden: rows would be ordered by something unseen. */
  sortedColumns: readonly string[];
}

/** Show or hide columns and reset order, widths and visibility. Changes apply immediately. */
export function EditColumns({ layout, onLayoutChange, onReset, sortedColumns }: EditColumnsProps) {
  const baseId = useId();
  const list = useRef<HTMLFieldSetElement>(null);
  // Listed in the current table order so the menu mirrors what the user sees.
  const columns = layout.order.filter((id) => HIDEABLE_COLUMNS.includes(id));
  return (
    <Popover.Root>
      <Popover.Trigger className={toolbarButton}>
        <GearIcon />
        Edit columns
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          aria-label="Edit columns"
          className="edit-columns z-50 w-64 rounded-lg bg-surface text-md text-fg shadow-popover"
        >
          <fieldset ref={list} className="flex flex-col gap-1 px-4 pt-3 pb-3">
            <legend className="mb-2 text-md font-semibold text-fg-strong">Columns</legend>
            {columns.map((id) => {
              const inputId = `${baseId}-${id}`;
              const visible = !layout.hidden.includes(id);
              const locked = visible && sortedColumns.includes(id);
              return (
                <div key={id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={inputId}
                    checked={visible}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      onLayoutChange(setColumnHidden(layout, id, !checked))
                    }
                  />
                  <label htmlFor={inputId} className={locked ? 'text-fg-subdued' : undefined}>
                    {COLUMN_LABELS[id]}
                    {locked ? <span className="text-sm"> (used for sorting)</span> : null}
                  </label>
                </div>
              );
            })}
          </fieldset>
          <div className="border-t border-border p-3">
            <p className="mb-2 text-sm text-fg-muted">
              Drag a column header’s handle to reorder it, or drag its edge to resize.
            </p>
            <button
              type="button"
              onClick={() => {
                onReset();
                // This button disables itself after a reset; keep focus inside the popover.
                list.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
              }}
              disabled={isDefaultLayout(layout)}
              className={`${toolbarButton} w-full justify-center`}
            >
              Reset to default
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
