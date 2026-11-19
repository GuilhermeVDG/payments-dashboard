import type { ComponentType } from 'react';
import { STATUS_LABELS } from '@/domain/display';
import type { Status } from '@/domain/payment';
import { CheckIcon, ClockIcon, CloseIcon, RefundIcon } from './icons';

type Tone = 'success' | 'danger' | 'neutral';

const STATUS_STYLE: Record<Status, { tone: Tone; Icon: ComponentType }> = {
  succeeded: { tone: 'success', Icon: CheckIcon },
  pending: { tone: 'neutral', Icon: ClockIcon },
  failed: { tone: 'danger', Icon: CloseIcon },
  refunded: { tone: 'neutral', Icon: RefundIcon },
};

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-bg text-success-fg border-success-border',
  danger: 'bg-danger-bg text-danger-fg border-danger-border',
  neutral: 'bg-neutral-bg text-neutral-fg border-neutral-border',
};

/** Status pill: text plus icon, so status never relies on color alone. */
export function StatusBadge({ status }: { status: Status }) {
  const { tone, Icon } = STATUS_STYLE[status];
  return (
    <span
      className={`status-badge status-badge--${status} inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 text-sm font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      {STATUS_LABELS[status]}
      <Icon />
    </span>
  );
}
