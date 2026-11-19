'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from './icons';
import { Tooltip } from './tooltip';
import { COPY_FEEDBACK, useCopy } from './use-copy';

interface CopyButtonProps {
  value: string;
  /** Accessible name, e.g. "Copy payment ID". */
  label: string;
  className?: string;
}

/** Copies `value`, shows "Copied" in its tooltip and announces it through the shared live region. */
export function CopyButton({ value, label, className = '' }: CopyButtonProps) {
  const { state, copy } = useCopy();
  const [hoverOpen, setHoverOpen] = useState(false);

  return (
    <Tooltip
      content={state === 'idle' ? 'Copy' : COPY_FEEDBACK[state]}
      open={hoverOpen || state !== 'idle'}
      onOpenChange={setHoverOpen}
    >
      <button
        type="button"
        aria-label={label}
        onClick={() => void copy(value)}
        className={`copy-button inline-flex size-5 items-center justify-center rounded-sm text-fg-subdued hover:bg-surface-hover hover:text-fg ${className}`}
      >
        {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
      </button>
    </Tooltip>
  );
}
