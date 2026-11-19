'use client';

import { useRef, useState } from 'react';
import { CloseIcon, SparkleIcon } from '@/components/ui/icons';
import { unavailableProps } from './unavailable';

/** The reference's "New" announcement strip; dismissible until the page reloads. */
export function AnnouncementBanner() {
  const [visible, setVisible] = useState(true);
  // Stays mounted so focus has somewhere to go when the banner is dismissed.
  const anchor = useRef<HTMLDivElement>(null);

  return (
    <div ref={anchor} tabIndex={-1} className="announcement-banner-anchor outline-none">
      {visible ? (
        <div
          role="region"
          aria-label="Announcement"
          className="announcement-banner mt-[26px] flex h-9 items-center gap-3 rounded-lg bg-surface-subtle pr-2 pl-3 text-md text-fg-strong"
        >
          <span className="announcement-banner__tag inline-flex items-center gap-1 text-sm font-semibold">
            <SparkleIcon />
            New
          </span>
          <p className="announcement-banner__text min-w-0 flex-1 truncate">
            Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.
          </p>
          <button
            type="button"
            {...unavailableProps}
            className="announcement-banner__link rounded-sm text-md text-link hover:text-brand-hover"
          >
            Get started
          </button>
          <span aria-hidden className="h-5 w-px bg-border-strong" />
          <button
            type="button"
            aria-label="Dismiss announcement"
            onClick={() => {
              setVisible(false);
              anchor.current?.focus();
            }}
            className="announcement-banner__close inline-flex size-6 items-center justify-center rounded-sm text-fg-strong hover:bg-border"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
