'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnnounce } from './announcer';

export type CopyState = 'idle' | 'copied' | 'error';

export const COPY_FEEDBACK: Record<Exclude<CopyState, 'idle'>, string> = {
  copied: 'Copied',
  error: 'Copy failed',
};

const RESET_AFTER_MS = 1500;

/** Copies text to the clipboard, announces the result and exposes a short-lived state. */
export function useCopy() {
  const announce = useAnnounce();
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    async (value: string) => {
      let next: Exclude<CopyState, 'idle'> = 'copied';
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        next = 'error';
      }
      setState(next);
      announce(COPY_FEEDBACK[next]);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState('idle'), RESET_AFTER_MS);
    },
    [announce],
  );

  return { state, copy };
}
