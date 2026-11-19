'use client';

import { useState } from 'react';
import { METHOD_TYPE_LABELS, STATUS_LABELS } from '@/domain/display';
import { methodFilterLabel, statusFilterLabel } from '@/domain/filter-labels';
import { METHOD_TYPES, STATUSES, type PaymentMethodType, type Status } from '@/domain/payment';
import { CheckboxList } from './checkbox-list';
import { FilterChip, FilterForm } from './filter-chip';
import type { FilterControlProps } from './types';

const STATUS_OPTIONS = STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
const METHOD_OPTIONS = METHOD_TYPES.map((value) => ({ value, label: METHOD_TYPE_LABELS[value] }));

function StatusForm({ filters, onChange, close }: FilterControlProps & { close: () => void }) {
  const [draft, setDraft] = useState<Status[]>([...filters.status]);
  return (
    <FilterForm
      title="Filter by status"
      onApply={() => {
        onChange({ status: draft.length > 0 ? draft : null, tab: null });
        close();
      }}
    >
      <CheckboxList legend="Status" options={STATUS_OPTIONS} selected={draft} onChange={setDraft} />
    </FilterForm>
  );
}

export function StatusFilter(props: FilterControlProps) {
  return (
    <FilterChip
      label="Status"
      value={statusFilterLabel(props.filters.status)}
      onClear={() => props.onChange({ status: null })}
    >
      {(close) => <StatusForm {...props} close={close} />}
    </FilterChip>
  );
}

function MethodForm({ filters, onChange, close }: FilterControlProps & { close: () => void }) {
  const [draft, setDraft] = useState<PaymentMethodType[]>([...filters.method]);
  return (
    <FilterForm
      title="Filter by payment method"
      onApply={() => {
        onChange({ method: draft.length > 0 ? draft : null });
        close();
      }}
    >
      <CheckboxList
        legend="Payment method"
        options={METHOD_OPTIONS}
        selected={draft}
        onChange={setDraft}
      />
    </FilterForm>
  );
}

export function MethodFilter(props: FilterControlProps) {
  return (
    <FilterChip
      label="Payment method"
      value={methodFilterLabel(props.filters.method)}
      onClear={() => props.onChange({ method: null })}
    >
      {(close) => <MethodForm {...props} close={close} />}
    </FilterChip>
  );
}
