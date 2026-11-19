'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce>(() => {});

const CLEAR_AFTER_MS = 1500;

/**
 * One polite live region for the whole view. Components call `useAnnounce()` to
 * have screen readers read a short message ("Copied") without one region per row.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const announce = useCallback<Announce>((next) => {
    if (timer.current) clearTimeout(timer.current);
    // Clear first so repeating the same message is announced again. A timeout rather
    // than requestAnimationFrame, which browsers pause in background tabs.
    setMessage('');
    timer.current = setTimeout(() => {
      setMessage(next);
      timer.current = setTimeout(() => setMessage(''), CLEAR_AFTER_MS);
    }, 50);
  }, []);

  return (
    <AnnouncerContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="announcer sr-only">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  return useContext(AnnouncerContext);
}
