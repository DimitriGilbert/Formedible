'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProviderModelCatalogEntry } from '@/lib/ai-picker-types';
import { getFilteredModelOptions } from '@/lib/ai-picker-utils';
import { cn } from '@/lib/utils';

interface ModelAutocompleteFieldProps {
  readonly value: string;
  readonly models: readonly ProviderModelCatalogEntry[];
  readonly disabled?: boolean;
  readonly onChange: (model: string) => void;
}

export function ModelAutocompleteField({ value, models, disabled, onChange }: ModelAutocompleteFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filteredOptions = useMemo(() => getFilteredModelOptions(models, value, value), [models, value]);
  const showDropdown = isOpen && filteredOptions.length > 0;

  return (
    <div className="relative">
      <Input
        value={value}
        autoComplete="off"
        disabled={disabled}
        placeholder="Type or search model id"
        className={cn(showDropdown && 'rounded-b-none')}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 max-h-72 overflow-y-auto rounded-b-md border border-t-0 bg-popover p-1 text-popover-foreground shadow-md">
          {filteredOptions.map((model) => (
            <Button
              key={model.id}
              type="button"
              variant="ghost"
              className="flex h-auto w-full flex-col items-start rounded-sm px-3 py-2 text-left text-sm"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
            >
              <span className="font-medium">{model.label ?? model.id}</span>
              {model.label && model.label !== model.id ? <span className="text-xs text-muted-foreground">{model.id}</span> : null}
              {model.createdAt ? <span className="text-xs text-muted-foreground">Released {model.createdAt.slice(0, 10)}</span> : null}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
