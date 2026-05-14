import { Check, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

import { getStringArray, labelToText, resolveFieldOptions } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Badge } from '@formedible/ui/components/badge';
import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

export function MultiSelectField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.multiSelectConfig;
  const selectedValues = getStringArray(field.value);
  const options = resolveFieldOptions(fieldConfig, field.formValues);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const maxSelections = config?.maxSelections ?? Number.POSITIVE_INFINITY;
  const searchable = config?.searchable ?? true;
  const filteredOptions = options.filter((option) => `${option.value} ${labelToText(option.label)}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const canCreate = config?.creatable === true && searchQuery.trim() !== '' && !options.some((option) => option.value.toLowerCase() === searchQuery.trim().toLowerCase());
  const displayOptions = canCreate ? [{ value: searchQuery.trim(), label: `Create "${searchQuery.trim()}"` }, ...filteredOptions] : filteredOptions;

  function toggleValue(value: string) {
    if (selectedValues.includes(value)) {
      field.onChange(selectedValues.filter((selectedValue) => selectedValue !== value));
    } else if (selectedValues.length < maxSelections) {
      field.onChange([...selectedValues, value]);
    }

    setSearchQuery('');
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="relative space-y-2">
        {maxSelections < Number.POSITIVE_INFINITY && <div className="text-sm text-muted-foreground">({selectedValues.length}/{maxSelections})</div>}
        <Button
          type="button"
          variant="outline"
          disabled={fieldConfig.disabled}
          aria-expanded={isOpen}
          aria-invalid={field.error ? true : undefined}
          className={cn('min-h-9 w-full justify-start bg-transparent px-3 py-2 text-left text-sm shadow-xs disabled:cursor-not-allowed disabled:opacity-50', fieldConfig.inputClassName)}
          onClick={() => setIsOpen((open) => !open)}
          onBlur={field.onBlur}
        >
          <span className="flex flex-wrap items-center gap-1">
            {selectedValues.length === 0 && <span className="text-muted-foreground">{config?.placeholder ?? fieldConfig.placeholder ?? 'Select options...'}</span>}
            {selectedValues.map((value) => {
              const option = options.find((item) => item.value === value);
              return (
                <Badge key={value} variant="secondary" className="gap-1">
                  {option?.label ?? value}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-4"
                    disabled={fieldConfig.disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleValue(value);
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </Badge>
              );
            })}
            <ChevronDown className="ml-auto size-4 opacity-50" />
          </span>
        </Button>
        {isOpen && (
          <div className="absolute z-50 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {searchable && <Input value={searchQuery} placeholder={fieldConfig.placeholder ?? 'Search options...'} className="mb-1" onChange={(event) => setSearchQuery(event.target.value)} />}
            <div className="max-h-60 overflow-y-auto">
              {displayOptions.length === 0 && <div className="p-2 text-center text-sm text-muted-foreground">{config?.noOptionsText ?? 'No options found'}</div>}
              {displayOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const isDisabled = !isSelected && selectedValues.length >= maxSelections;

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="ghost"
                    disabled={isDisabled || fieldConfig.disabled || option.disabled}
                    className="flex h-auto w-full justify-between rounded-sm px-2 py-1.5 text-left text-sm"
                    onClick={() => toggleValue(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="size-4" />}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
