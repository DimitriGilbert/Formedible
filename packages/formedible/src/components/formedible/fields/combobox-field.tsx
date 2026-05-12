import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { labelToText, resolveFieldOptions } from '@/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';
import { cn } from '@/lib/utils';

export function ComboboxField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.comboboxConfig;
  const value = typeof field.value === 'string' ? field.value : '';
  const options = resolveFieldOptions(fieldConfig, field.formValues);
  const selectedOption = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchable = config?.searchable ?? true;
  const displayOptions = options.filter((option) => `${option.value} ${labelToText(option.label)}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="relative">
        <Button variant="outline" className={cn('w-full justify-between', fieldConfig.inputClassName)} disabled={fieldConfig.disabled} aria-expanded={open} onBlur={field.onBlur} onClick={() => setOpen((nextOpen) => !nextOpen)}>
          <span className={selectedOption ? undefined : 'text-muted-foreground'}>{selectedOption?.label ?? config?.placeholder ?? fieldConfig.placeholder ?? 'Select an option'}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {searchable && <Input value={query} placeholder={config?.searchPlaceholder ?? 'Search options...'} className="mb-1" onChange={(event) => setQuery(event.target.value)} />}
            <div className="max-h-60 overflow-y-auto">
              {displayOptions.length === 0 && <div className="p-2 text-center text-sm text-muted-foreground">{config?.noOptionsText ?? 'No options found.'}</div>}
              {displayOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  disabled={option.disabled}
                  className="flex h-auto w-full justify-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm"
                  onClick={() => {
                    field.onChange(option.value === value ? '' : option.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
