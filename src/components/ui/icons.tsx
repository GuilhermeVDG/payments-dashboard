/**
 * Inline SVG icons. Decorative by default (aria-hidden); pass a `title` to label one.
 * Brand marks are simplified, generic renditions sized like the Dashboard's 24x16 chips.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Svg({ title, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function CheckIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="M2 6.5 4.6 9 10 3" {...stroke} />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="m3 3 6 6M9 3 3 9" {...stroke} />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <circle cx="6" cy="6" r="4.75" {...stroke} strokeWidth={1.5} />
      <path d="M6 3.5V6l1.75 1.25" {...stroke} strokeWidth={1.5} />
    </Svg>
  );
}

export function RefundIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="M4.5 2.5 2 5l2.5 2.5" {...stroke} strokeWidth={1.5} />
      <path d="M2.5 5H7a3 3 0 0 1 0 6H5.5" {...stroke} strokeWidth={1.5} />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.25" {...stroke} strokeWidth={1.4} />
      <path
        d="M8 2.25A.75.75 0 0 0 7.25 1.5H2.75A1.25 1.25 0 0 0 1.5 2.75v4.5c0 .41.34.75.75.75"
        {...stroke}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function SortIcon({
  sort,
  ...props
}: Omit<IconProps, 'direction'> & { sort: 'asc' | 'desc' | false }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path
        d="M3.5 4.5 6 2l2.5 2.5"
        {...stroke}
        strokeWidth={1.4}
        opacity={sort === 'desc' ? 0.35 : 1}
      />
      <path
        d="M3.5 7.5 6 10l2.5-2.5"
        {...stroke}
        strokeWidth={1.4}
        opacity={sort === 'asc' ? 0.35 : 1}
      />
    </Svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" {...props}>
      <circle cx="3" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="13" cy="8" r="1.4" fill="currentColor" />
    </Svg>
  );
}

export function ChevronIcon({
  direction = 'right',
  ...props
}: IconProps & { direction?: 'left' | 'right' | 'down' }) {
  const d = { left: 'M7.5 3 4.5 6l3 3', right: 'M4.5 3l3 3-3 3', down: 'M3 4.5l3 3 3-3' }[
    direction
  ];
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d={d} {...stroke} strokeWidth={1.5} />
    </Svg>
  );
}

/* Brand marks: 24x16 chips */

function Chip({ fill, border, children, ...props }: IconProps & { fill: string; border?: string }) {
  return (
    <Svg width={24} height={16} viewBox="0 0 24 16" {...props}>
      <rect x="0.5" y="0.5" width="23" height="15" rx="2.5" fill={fill} stroke={border ?? fill} />
      {children}
    </Svg>
  );
}

const chipText = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 700,
  textAnchor: 'middle',
} as const;

export function VisaMark(props: IconProps) {
  return (
    <Chip fill="#1a3a8f" {...props}>
      <text x="12" y="10.6" fontSize="7" fontStyle="italic" fill="#fff" {...chipText}>
        VISA
      </text>
    </Chip>
  );
}

export function MastercardMark(props: IconProps) {
  return (
    <Chip fill="#1a1a1a" {...props}>
      <circle cx="9.6" cy="8" r="4.2" fill="#eb001b" />
      <circle cx="14.4" cy="8" r="4.2" fill="#f79e1b" />
      <path d="M12 4.55a4.2 4.2 0 0 1 0 6.9 4.2 4.2 0 0 1 0-6.9Z" fill="#ff5f00" />
    </Chip>
  );
}

export function AmexMark(props: IconProps) {
  return (
    <Chip fill="#1f72cd" {...props}>
      <text x="12" y="10.4" fontSize="6.2" fill="#fff" {...chipText}>
        AMEX
      </text>
    </Chip>
  );
}

export function DiscoverMark(props: IconProps) {
  return (
    <Chip fill="#fff" border="#e3e8ee" {...props}>
      <text x="10.6" y="9.6" fontSize="3.6" fill="#1a1a1a" {...chipText}>
        DISCOVER
      </text>
      <circle cx="17.6" cy="8.4" r="1.6" fill="#f48120" />
    </Chip>
  );
}

export function ApplePayMark(props: IconProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" {...props}>
      <rect width="16" height="16" rx="3" fill="#000" />
      <path
        fill="#fff"
        d="M10.4 8.4c0-1 .8-1.5.9-1.5-.5-.7-1.2-.8-1.5-.8-.6-.1-1.2.4-1.6.4-.3 0-.8-.3-1.4-.3-.7 0-1.4.4-1.7 1.1-.8 1.3-.2 3.2.5 4.3.4.5.8 1.1 1.3 1.1s.7-.3 1.3-.3c.6 0 .8.3 1.3.3.6 0 .9-.5 1.3-1.1.4-.6.5-1.1.6-1.2-.1 0-1-.4-1-2ZM9.4 5.4c.3-.4.5-.9.5-1.4-.5 0-1 .3-1.3.7-.3.3-.5.8-.5 1.3.5.1 1-.2 1.3-.6Z"
      />
    </Svg>
  );
}

export function GooglePayMark(props: IconProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" {...props}>
      <rect x="0.5" y="0.5" width="15" height="15" rx="3" fill="#fff" stroke="#e3e8ee" />
      <path
        d="M11.8 8.1c0-.3 0-.6-.1-.8H8v1.6h2.1a1.8 1.8 0 0 1-.8 1.2v1h1.3c.8-.7 1.2-1.7 1.2-3Z"
        fill="#4285f4"
      />
      <path
        d="M8 12c1.1 0 2-.4 2.6-1l-1.3-1a2.4 2.4 0 0 1-3.6-1.3H4.4v1A4 4 0 0 0 8 12Z"
        fill="#34a853"
      />
      <path d="M5.7 8.7a2.4 2.4 0 0 1 0-1.5v-1H4.4a4 4 0 0 0 0 3.6l1.3-1.1Z" fill="#fbbc04" />
      <path
        d="M8 5.6c.6 0 1.1.2 1.6.6l1.1-1.1A4 4 0 0 0 4.4 6.2l1.3 1A2.4 2.4 0 0 1 8 5.6Z"
        fill="#ea4335"
      />
    </Svg>
  );
}

export function BankMark(props: IconProps) {
  return (
    <Chip fill="#fff" border="#e3e8ee" {...props}>
      <path d="M12 3.5 7 6h10l-5-2.5Z" fill="#596171" />
      <path d="M8 7v4.25M10.7 7v4.25M13.3 7v4.25M16 7v4.25" stroke="#596171" strokeWidth="1.1" />
      <path d="M7 12.25h10" stroke="#596171" strokeWidth="1.1" strokeLinecap="round" />
    </Chip>
  );
}

export function PlusCircleIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <circle cx="6" cy="6" r="5" {...stroke} strokeWidth={1.25} />
      <path d="M6 3.75v4.5M3.75 6h4.5" {...stroke} strokeWidth={1.25} />
    </Svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <circle cx="6" cy="6" r="5" {...stroke} strokeWidth={1.25} />
      <path d="m4.25 4.25 3.5 3.5m0-3.5-3.5 3.5" {...stroke} strokeWidth={1.25} />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" {...props}>
      <circle cx="7" cy="7" r="4.75" {...stroke} strokeWidth={1.5} />
      <path d="m10.5 10.5 3 3" {...stroke} strokeWidth={1.5} />
    </Svg>
  );
}

export function ExportIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="M7 1.5h3.5V5M10.5 1.5 6 6" {...stroke} strokeWidth={1.4} />
      <path
        d="M9 7.5v2a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2"
        {...stroke}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <circle cx="6" cy="6" r="1.75" {...stroke} strokeWidth={1.3} />
      <path
        d="M6 1v1.25M6 9.75V11M1 6h1.25M9.75 6H11M2.46 2.46l.88.88M8.66 8.66l.88.88M2.46 9.54l.88-.88M8.66 3.34l.88-.88"
        {...stroke}
        strokeWidth={1.3}
      />
    </Svg>
  );
}

export function EmptySearchIcon(props: IconProps) {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" {...props}>
      <circle cx="14" cy="14" r="9" {...stroke} strokeWidth={2} />
      <path d="m21 21 6 6" {...stroke} strokeWidth={2} />
    </Svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path
        d="M5 1.5c.3 2.1 1.1 2.9 3.2 3.2C6.1 5 5.3 5.8 5 7.9 4.7 5.8 3.9 5 1.8 4.7 3.9 4.4 4.7 3.6 5 1.5Z"
        {...stroke}
        strokeWidth={1.2}
      />
      <path
        d="M9 7.5c.15.9.55 1.3 1.5 1.5-.95.2-1.35.6-1.5 1.5-.15-.9-.55-1.3-1.5-1.5.95-.2 1.35-.6 1.5-1.5Z"
        fill="currentColor"
      />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="M6 2v8M2 6h8" {...stroke} strokeWidth={1.75} />
    </Svg>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" {...props}>
      <path d="M1.5 1.5v9h9M4 8V5.5M6.5 8V3.5M9 8V6" {...stroke} strokeWidth={1.4} />
    </Svg>
  );
}
