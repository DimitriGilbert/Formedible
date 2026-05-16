import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { labelToText, resolveFieldOptions } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@formedible/ui/components/command';
import { Popover, PopoverContent, PopoverTrigger } from '@formedible/ui/components/popover';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

export function ComboboxField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.comboboxConfig;
  const value = typeof field.value === 'string' ? field.value : '';
  const options = resolveFieldOptions(fieldConfig, field.formValues);
  const selectedOption = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchable = config?.searchable ?? true;
  const displayOptions = searchable ? options.filter((option) => `${option.value} ${labelToText(option.label)}`.toLowerCase().includes(query.toLowerCase())) : options;

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  function selectOption(nextValue: string) {
    field.onChange(nextValue === value ? '' : nextValue);
    setOpen(false);
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              className={cn('w-full justify-between', fieldConfig.inputClassName)}
              disabled={fieldConfig.disabled}
              onBlur={field.onBlur}
            />
          }
        >
          <span className={selectedOption ? undefined : 'text-muted-foreground'}>{selectedOption?.label ?? config?.placeholder ?? fieldConfig.placeholder ?? 'Select an option'}</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {searchable && <CommandInput value={query} placeholder={config?.searchPlaceholder ?? 'Search options...'} className="h-9" onValueChange={setQuery} />}
            <CommandList>
              {displayOptions.length === 0 && <CommandEmpty>{config?.noOptionsText ?? 'No options found.'}</CommandEmpty>}
              <CommandGroup>
                {displayOptions.map((option) => (
                  <CommandItem key={option.value} value={`${option.value} ${labelToText(option.label)}`} disabled={option.disabled} aria-selected={value === option.value} onSelect={() => selectOption(option.value)}>
                    <Check className={cn('size-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
}
