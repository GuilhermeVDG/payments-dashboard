'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

export const TooltipProvider = RadixTooltip.Provider;

interface TooltipProps {
  /** Must be a single focusable element so keyboard users can open the tooltip. */
  children: ReactNode;
  content: ReactNode;
  side?: RadixTooltip.TooltipContentProps['side'];
  /** Pass both to control the tooltip; omit both to let Radix manage it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ children, content, side = 'top', open, onOpenChange }: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} onOpenChange={onOpenChange}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="tooltip z-50 max-w-xs rounded-md bg-surface px-3 py-2 text-sm text-fg shadow-popover"
        >
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
