'use client';

import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { CheckIcon } from './icons';

type CheckboxProps = {
  checked: boolean | 'indeterminate';
  onCheckedChange: (checked: boolean) => void;
} & (
  | { /** Accessible name when there is no visible label. */ label: string; id?: string }
  | { /** Id referenced by a visible `<label htmlFor>`. */ id: string; label?: undefined }
);

export function Checkbox({ checked, onCheckedChange, label, id }: CheckboxProps) {
  return (
    <RadixCheckbox.Root
      id={id}
      aria-label={label}
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      className="checkbox inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface text-on-brand data-[state=checked]:border-brand data-[state=checked]:bg-brand data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand"
    >
      <RadixCheckbox.Indicator>
        {checked === 'indeterminate' ? (
          <span className="block h-0.5 w-2 rounded-full bg-on-brand" />
        ) : (
          <CheckIcon width={10} height={10} />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
