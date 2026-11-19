import Link from 'next/link';
import { BarChartIcon, PlusIcon } from '@/components/ui/icons';
import { AnnouncementBanner } from './announcement-banner';
import { unavailableProps } from './unavailable';

const SECTION_TABS = [
  { label: 'Payments', href: '/payments' },
  { label: 'Payouts' },
  { label: 'Top-ups' },
  { label: 'Collected fees' },
  { label: 'Transfers' },
  { label: 'All activity' },
] as const;

const secondaryButton =
  'page-header__button inline-flex h-7 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 text-md font-semibold text-fg-strong shadow-[0_1px_1px_rgb(0_0_0/0.04)] hover:bg-surface-hover';

/** "Transactions" title, primary actions, section tabs and the announcement banner. */
export function PageHeader() {
  return (
    <div className="page-header flex flex-col">
      <div className="page-header__top flex items-center justify-between gap-4">
        <h1 className="page-header__title text-title font-bold text-fg-strong">Transactions</h1>
        <div className="page-header__actions flex items-center gap-2">
          <button
            type="button"
            {...unavailableProps}
            className="page-header__button page-header__button--primary inline-flex h-7 items-center gap-1.5 rounded-md bg-brand px-2.5 text-md font-semibold text-on-brand shadow-[0_1px_1px_rgb(0_0_0/0.08)] hover:bg-brand-hover"
          >
            <PlusIcon />
            Create payment
          </button>
          <button type="button" {...unavailableProps} className={secondaryButton}>
            <BarChartIcon />
            Analyze
          </button>
        </div>
      </div>
      <nav
        aria-label="Transactions"
        className="page-header__tabs mt-1 border-b border-border-strong"
      >
        <ul className="flex gap-6">
          {SECTION_TABS.map((tab) => (
            <li key={tab.label}>
              {'href' in tab ? (
                <Link
                  href={tab.href}
                  aria-current="page"
                  className="page-header__tab page-header__tab--active -mb-px inline-flex h-9 items-center border-b-2 border-brand text-md font-semibold text-link"
                >
                  {tab.label}
                </Link>
              ) : (
                <span className="page-header__tab inline-flex h-9 items-center border-b-2 border-transparent text-md font-semibold text-fg-muted">
                  {tab.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <AnnouncementBanner />
    </div>
  );
}
