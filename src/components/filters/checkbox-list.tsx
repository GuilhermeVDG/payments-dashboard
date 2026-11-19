'use client';

import { useId } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxListProps<T extends string> {
  legend: string;
  options: readonly { value: T; label: string }[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
}

/** Multi-select list; keeps the options' order regardless of click order. */
export function CheckboxList<T extends string>({
  legend,
  options,
  selected,
  onChange,
}: CheckboxListProps<T>) {
  const baseId = useId();
  const toggle = (value: T, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(value);
    else next.delete(value);
    onChange(options.map((o) => o.value).filter((v) => next.has(v)));
  };

  return (
    <fieldset className="checkbox-list flex flex-col gap-1">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const id = `${baseId}-${option.value}`;
        return (
          <div key={option.value} className="checkbox-list__item flex items-center gap-2 py-1">
            <Checkbox
              id={id}
              checked={selected.includes(option.value)}
              onCheckedChange={(checked) => toggle(option.value, checked)}
            />
            <label htmlFor={id} className="text-md text-fg">
              {option.label}
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
