import { Suspense } from 'react';
import { SearchInput } from '@/components/filters/search-input';
import { unavailableProps } from './unavailable';
import { AppsIcon, BellIcon, CreateIcon, HelpIcon, SettingsIcon } from './nav-icons';

function SearchFallback() {
  return <div className="h-9 w-full max-w-[573px] rounded-lg bg-surface-subtle" />;
}

const iconButton =
  'top-bar__icon-button relative inline-flex size-8 items-center justify-center rounded-full text-fg-muted hover:bg-surface-hover hover:text-fg-strong';

/** Search on the left; test mode notice, apps, help, notifications, settings and create on the right. */
export function TopBar() {
  return (
    <header className="top-bar flex h-[var(--topbar-height)] items-center gap-6">
      <div role="search" className="top-bar__search min-w-[220px] flex-1">
        <Suspense fallback={<SearchFallback />}>
          <SearchInput />
        </Suspense>
      </div>
      <div className="top-bar__actions flex shrink-0 items-center gap-3">
        <p className="top-bar__notice hidden text-md text-fg-strong xl:block">
          Test mode has moved.{' '}
          <button
            type="button"
            {...unavailableProps}
            className="ml-1 rounded-sm underline underline-offset-2"
          >
            Show me
          </button>
        </p>
        <span className="top-bar__apps inline-flex h-9 items-center rounded-full border border-border px-1.5">
          <button type="button" aria-label="Apps" {...unavailableProps} className={iconButton}>
            <AppsIcon />
          </button>
        </span>
        <button type="button" aria-label="Help" {...unavailableProps} className={iconButton}>
          <HelpIcon />
        </button>
        <button
          type="button"
          aria-label="Notifications, 1 unread"
          {...unavailableProps}
          className={iconButton}
        >
          <BellIcon />
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-surface bg-[#0570de]"
          />
        </button>
        <button type="button" aria-label="Settings" {...unavailableProps} className={iconButton}>
          <SettingsIcon />
        </button>
        <button type="button" aria-label="Create" {...unavailableProps} className={iconButton}>
          <CreateIcon />
        </button>
      </div>
    </header>
  );
}
