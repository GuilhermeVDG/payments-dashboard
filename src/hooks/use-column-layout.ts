'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LAYOUT, parseColumnLayout, type ColumnLayout } from '@/domain/column-layout';

const STORAGE_KEY = 'payments-table:column-layout:v1';
/** Pointer resizing updates the layout on every move; persist once it settles. */
const WRITE_DELAY_MS = 300;

function readStored(): ColumnLayout {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? parseColumnLayout(JSON.parse(raw)) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function writeStored(layout: ColumnLayout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage can be unavailable (private mode, quota); the layout still works in memory.
  }
}

/**
 * Column order, widths and visibility, remembered per browser. A per-viewer
 * convenience, so it lives in localStorage rather than the shareable URL.
 * Only used inside the browser-only PaymentsView, so reading storage on init is safe.
 */
export function useColumnLayout() {
  const [layout, setLayout] = useState<ColumnLayout>(readStored);

  useEffect(() => {
    const timer = setTimeout(() => writeStored(layout), WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [layout]);

  const resetLayout = useCallback(() => setLayout(DEFAULT_LAYOUT), []);

  return { layout, setLayout, resetLayout };
}
