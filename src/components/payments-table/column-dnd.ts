import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core';
import { COLUMN_LABELS, MOVABLE_COLUMNS } from '@/domain/column-layout';
import { isOneOf } from '@/domain/payment';

function label(id: string | number): string {
  const key = String(id);
  return isOneOf(MOVABLE_COLUMNS, key) ? COLUMN_LABELS[key] : key;
}

/** Read by screen readers when a column's drag handle is focused. */
export const COLUMN_DRAG_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'To reorder this column, press Space or Enter to pick it up, use the Left and Right arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.',
};

/** Live announcements for keyboard and screen reader users while reordering columns. */
export const COLUMN_DRAG_ANNOUNCEMENTS: Announcements = {
  onDragStart: ({ active }) => `Picked up the ${label(active.id)} column.`,
  onDragOver: ({ active, over }) => {
    if (!over) return `${label(active.id)} column is no longer over a column.`;
    if (over.id === active.id) return `${label(active.id)} column is in its original position.`;
    return `${label(active.id)} column is over ${label(over.id)}.`;
  },
  onDragEnd: ({ active, over }) => {
    if (!over || over.id === active.id) return `${label(active.id)} column was dropped in place.`;
    return `${label(active.id)} column was moved to the position of ${label(over.id)}.`;
  },
  onDragCancel: ({ active }) => `Moving the ${label(active.id)} column was cancelled.`,
};
