/** 16px outline icons for the sidebar and top bar. Decorative (aria-hidden). */
import type { ReactNode, SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M2.5 7 8 2.5 13.5 7v6a.75.75 0 0 1-.75.75H10v-4H6v4H3.25A.75.75 0 0 1 2.5 13V7Z" />
  </Icon>
);

export const BalancesIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M2.5 3.5h11M2.5 7h6M2.5 10.5h4" />
    <circle cx="11.5" cy="11" r="2.25" />
  </Icon>
);

export const TransactionsIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M2.5 5.5h10l-2.5-2.5M13.5 10.5h-10l2.5 2.5" />
  </Icon>
);

export const CustomersIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="8" cy="5.5" r="2.75" />
    <path d="M2.75 13.5c.6-2.4 2.7-4 5.25-4s4.65 1.6 5.25 4" />
  </Icon>
);

export const ProductIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M8 1.75 13.5 4.5v7L8 14.25 2.5 11.5v-7L8 1.75Z" />
    <path d="M2.5 4.5 8 7.25l5.5-2.75M8 7.25v7" />
  </Icon>
);

export const AnalyticsIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M9.5 2.5 13.5 6.5 6 14l-4-4 7.5-7.5Z" />
    <path d="M5 8.5 7.5 11M7.25 6.25l2.5 2.5" />
  </Icon>
);

export const RecentIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="5.75" />
    <path d="M8 4.75V8l2 1.5" />
  </Icon>
);

export const ConnectIcon = (p: Props) => (
  <Icon {...p}>
    <path d="m8 2.25 5.75 3L8 8.25l-5.75-3L8 2.25Z" />
    <path d="m2.25 8 5.75 3 5.75-3M2.25 10.75l5.75 3 5.75-3" />
  </Icon>
);

export const PaymentsIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="2" y="3.5" width="12" height="9.5" rx="1.5" />
    <path d="M2 6.5h12M10.5 10h1.5" />
  </Icon>
);

export const BillingIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M3.5 1.75h6l3 3v9.5h-9V1.75Z" />
    <path d="M6 7h4.5M6 9.5h4.5M6 12h2.5" />
  </Icon>
);

export const ReportingIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M2.5 2.5v11h11M5.5 11V8M8.5 11V5M11.5 11V7" />
  </Icon>
);

export const MoreIcon = (p: Props) => (
  <Icon {...p} stroke="none" fill="currentColor">
    <circle cx="3" cy="8" r="1.25" />
    <circle cx="8" cy="8" r="1.25" />
    <circle cx="13" cy="8" r="1.25" />
  </Icon>
);

export const DevelopersIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5" />
    <path d="m4.75 6.5 2 1.5-2 1.5M8.5 10h2.75" />
  </Icon>
);

export const ChevronDownIcon = (p: Props) => (
  <Icon {...p} width={12} height={12} viewBox="0 0 12 12">
    <path d="m3 4.5 3 3 3-3" />
  </Icon>
);

export const HelpIcon = (p: Props) => (
  <Icon {...p} width={20} height={20} viewBox="0 0 20 20" strokeWidth={1.6}>
    <circle cx="10" cy="10" r="7.75" />
    <path d="M7.75 7.75a2.25 2.25 0 1 1 3.1 2.08c-.5.2-.85.68-.85 1.22v.45" />
    <circle cx="10" cy="14" r=".6" fill="currentColor" stroke="none" />
  </Icon>
);

export const BellIcon = (p: Props) => (
  <Icon {...p} width={20} height={20} viewBox="0 0 20 20" strokeWidth={1.6}>
    <path d="M5 13.5V9a5 5 0 0 1 10 0v4.5l1.25 1.5H3.75L5 13.5ZM8.25 17.25a1.9 1.9 0 0 0 3.5 0" />
  </Icon>
);

export const SettingsIcon = (p: Props) => (
  <Icon {...p} width={20} height={20} viewBox="0 0 20 20" strokeWidth={1.6}>
    <circle cx="10" cy="10" r="2.5" />
    <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
  </Icon>
);

export const AppsIcon = (p: Props) => (
  <Icon {...p} width={20} height={20} viewBox="0 0 20 20" strokeWidth={1.6}>
    <rect x="3" y="3" width="5.5" height="5.5" rx="1.25" />
    <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.25" />
    <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.25" />
    <path d="M14.25 3v5.5M11.5 5.75H17" />
  </Icon>
);

export const CreateIcon = (p: Props) => (
  <Icon {...p} width={24} height={24} viewBox="0 0 24 24" stroke="none">
    <circle cx="12" cy="12" r="11" fill="var(--color-brand)" />
    <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Icon>
);
