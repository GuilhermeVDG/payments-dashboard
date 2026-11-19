'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import { paymentHref } from '@/domain/routes';
import { MoreIcon } from '@/components/ui/icons';
import { useCopy } from '@/components/ui/use-copy';

const itemClass =
  'menu-item flex cursor-default items-center rounded-sm px-2 py-1.5 text-md text-fg outline-none select-none data-[disabled]:text-fg-subdued data-[highlighted]:bg-surface-hover';

/** Row overflow menu: a keyboard path to the payment's details, and copy. */
export function RowActions({ paymentId }: { paymentId: string }) {
  const { copy } = useCopy();
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`More actions for payment ${paymentId}`}
        className="row-actions__trigger inline-flex size-6 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-hover hover:text-fg data-[state=open]:bg-surface-hover"
      >
        <MoreIcon />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="menu z-50 min-w-44 rounded-md bg-surface p-1 shadow-popover"
        >
          <DropdownMenu.Item asChild className={itemClass}>
            <Link href={paymentHref(paymentId)}>View payment details</Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} onSelect={() => void copy(paymentId)}>
            Copy payment ID
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemClass} disabled>
            Refund payment…
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
