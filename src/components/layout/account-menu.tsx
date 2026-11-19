'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { UNAVAILABLE_ACTION_TITLE } from './unavailable';
import { ChevronDownIcon } from './nav-icons';

/** Mock account shown in the shell. Not a real business. */
export const MOCK_ACCOUNT = { name: 'Acme Inc.', email: 'owner@example.com' } as const;

const itemClass =
  'menu-item flex cursor-default items-center rounded-sm px-2 py-1.5 text-md text-fg-strong outline-none select-none data-[disabled]:text-fg-subdued data-[highlighted]:bg-surface-hover';

/** Account switcher at the top of the sidebar; opens the account menu. */
export function AccountMenu() {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account menu for ${MOCK_ACCOUNT.name}`}
        className="account-menu__trigger flex h-9 w-full items-center gap-2.5 rounded-md px-1 text-left hover:bg-surface-hover data-[state=open]:bg-surface-hover"
      >
        <span
          aria-hidden
          className="account-menu__logo inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[#e8e6ff] text-xs font-bold text-brand"
        >
          {MOCK_ACCOUNT.name[0]}
        </span>
        <span className="account-menu__name min-w-0 flex-1 truncate text-md font-semibold text-fg-strong">
          {MOCK_ACCOUNT.name}
        </span>
        <ChevronDownIcon className="text-fg-muted" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="menu z-50 w-56 rounded-lg bg-surface p-1 shadow-popover"
        >
          <DropdownMenu.Label className="px-2 pt-1.5 pb-2">
            <span className="block text-md font-semibold text-fg-strong">{MOCK_ACCOUNT.name}</span>
            <span className="block text-sm text-fg-muted">{MOCK_ACCOUNT.email}</span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {['Profile', 'Settings', 'Switch account'].map((label) => (
            <DropdownMenu.Item
              key={label}
              disabled
              title={UNAVAILABLE_ACTION_TITLE}
              className={itemClass}
            >
              {label}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item disabled title={UNAVAILABLE_ACTION_TITLE} className={itemClass}>
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
