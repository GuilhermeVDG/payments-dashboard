import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { AccountMenu } from './account-menu';
import { unavailableProps } from './unavailable';
import {
  AnalyticsIcon,
  BalancesIcon,
  BillingIcon,
  ChevronDownIcon,
  ConnectIcon,
  CustomersIcon,
  DevelopersIcon,
  HomeIcon,
  MoreIcon,
  PaymentsIcon,
  ProductIcon,
  RecentIcon,
  ReportingIcon,
  TransactionsIcon,
} from './nav-icons';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  label: string;
  Icon: IconType;
  /** Only items with an href work; the rest are inert in this demo. */
  href?: string;
  active?: boolean;
  expandable?: boolean;
}

const PRIMARY: NavItem[] = [
  { label: 'Home', Icon: HomeIcon },
  { label: 'Balances', Icon: BalancesIcon },
  { label: 'Transactions', Icon: TransactionsIcon, href: '/payments', active: true },
  { label: 'Customers', Icon: CustomersIcon },
  { label: 'Product catalog', Icon: ProductIcon },
];

const SHORTCUTS: NavItem[] = [
  { label: 'Payments analytics', Icon: AnalyticsIcon },
  { label: 'Reports', Icon: RecentIcon },
  { label: 'Sigma', Icon: RecentIcon },
  { label: 'Radar', Icon: RecentIcon },
];

const PRODUCTS: NavItem[] = [
  { label: 'Connect', Icon: ConnectIcon, expandable: true },
  { label: 'Payments', Icon: PaymentsIcon, href: '/payments', expandable: true },
  { label: 'Billing', Icon: BillingIcon, expandable: true },
  { label: 'Reporting', Icon: ReportingIcon, expandable: true },
  { label: 'More', Icon: MoreIcon, expandable: true },
];

const DEVELOPERS: NavItem[] = [{ label: 'Developers', Icon: DevelopersIcon }];

const itemBase =
  'sidebar__item flex h-7 items-center gap-3 rounded-md px-1 text-md text-fg-strong hover:bg-surface-hover';

function NavEntry({ item }: { item: NavItem }) {
  const { Icon } = item;
  const content = (
    <>
      <Icon className={item.active ? 'text-link' : 'text-fg-muted'} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.expandable ? <ChevronDownIcon className="text-fg-muted" /> : null}
    </>
  );
  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-current={item.active ? 'page' : undefined}
        className={`${itemBase} ${item.active ? 'sidebar__item--active font-semibold text-link' : ''}`}
      >
        {content}
      </Link>
    );
  }
  // Inert items stay focusable links (no href) so keyboard and screen reader users
  // learn they exist and why they do nothing.
  return (
    <a role="link" tabIndex={0} {...unavailableProps} className={`${itemBase} cursor-default`}>
      {content}
    </a>
  );
}

function NavSection({
  title,
  items,
  className = '',
}: {
  title?: string;
  items: NavItem[];
  className?: string;
}) {
  const titleId = title ? `sidebar-section-${title.toLowerCase()}` : undefined;
  return (
    <div className={`sidebar__section flex flex-col ${className}`}>
      {title ? (
        // Not a heading: the sidebar precedes the page's h1 in the DOM.
        <p
          id={titleId}
          className="sidebar__section-title mb-1 px-1 text-xs leading-5 text-fg-muted"
        >
          {title}
        </p>
      ) : null}
      <ul aria-labelledby={titleId} className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <NavEntry item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Left navigation matching the reference. Only Transactions (Payments) is wired. */
export function Sidebar() {
  return (
    <div className="sidebar sticky top-0 flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col border-r border-border bg-surface">
      <div className="sidebar__account px-4 pt-3 pb-5">
        <AccountMenu />
      </div>
      <nav
        aria-label="Main"
        className="sidebar__nav flex flex-1 flex-col gap-7 overflow-y-auto px-4"
      >
        <NavSection items={PRIMARY} />
        <NavSection title="Shortcuts" items={SHORTCUTS} />
        <NavSection title="Products" items={PRODUCTS} />
        <NavSection
          items={DEVELOPERS}
          className="sidebar__footer sticky bottom-0 -mx-4 mt-auto border-t border-border bg-surface px-4 py-2"
        />
      </nav>
    </div>
  );
}
