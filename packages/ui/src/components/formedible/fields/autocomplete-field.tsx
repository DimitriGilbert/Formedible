import { useEffect, useMemo, useRef, useState } from 'react';

import { labelToText, normalizeOption, resolveFieldOptions } from '@formedible/ui/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldOption, FormedibleFieldRenderProps, FormedibleFormValues, FormedibleOptionConfig } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

function normalizeAutocompleteOptions(options: readonly FormedibleFieldOption[] | undefined): readonly FormedibleOptionConfig[] {
  return options?.map(normalizeOption) ?? [];
}

interface RenderedAutocompleteOptionsInput {
  readonly configOptions?: readonly FormedibleFieldOption[];
  readonly fallbackOptions: readonly FormedibleFieldOption[];
  readonly query: string;
  readonly minChars: number;
  readonly maxResults: number;
}

interface AutocompleteSelection {
  readonly inputValue: string;
  readonly fieldValue: string;
}

export function shouldCommitCustomAutocompleteValue(allowCustom: boolean | undefined): boolean {
  return allowCustom ?? true;
}

export function getNextAutocompleteRequestId(currentRequestId: number): number {
  return currentRequestId + 1;
}

export function isCurrentAutocompleteRequest(requestId: number, currentRequestId: number): boolean {
  return requestId === currentRequestId;
}

export function getRenderedAutocompleteOptions({
  configOptions,
  fallbackOptions,
  query,
  minChars,
  maxResults,
}: RenderedAutocompleteOptionsInput): readonly FormedibleOptionConfig[] {
  const compatibilityOptions = normalizeAutocompleteOptions(configOptions);
  const staticOptions = configOptions !== undefined ? compatibilityOptions : normalizeAutocompleteOptions(fallbackOptions);
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.length < minChars) {
    return [];
  }

  return staticOptions
    .filter((option) => `${option.value} ${labelToText(option.label)}`.toLowerCase().includes(normalizedQuery))
    .slice(0, maxResults);
}

export function getAutocompleteSelection(option: FormedibleOptionConfig): AutocompleteSelection {
  return {
    inputValue: labelToText(option.label) || option.value,
    fieldValue: option.value,
  };
}

export function AutocompleteField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.autocompleteConfig;
  const debounceMs = config?.debounceMs ?? 300;
  const minChars = config?.minChars ?? 1;
  const maxResults = config?.maxResults ?? 10;
  const allowCustom = config?.allowCustom ?? true;
  const noOptionsText = config?.noOptionsText ?? 'No options found';
  const loadingText = config?.loadingText ?? 'Loading...';
  const [inputValue, setInputValue] = useState(typeof field.value === 'string' ? field.value : '');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [asyncOptions, setAsyncOptions] = useState<readonly FormedibleOptionConfig[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const asyncRequestIdRef = useRef(0);

  const staticOptions = useMemo(() => {
    const compatibilityOptions = normalizeAutocompleteOptions(config?.options);

    return config?.options !== undefined ? compatibilityOptions : resolveFieldOptions(fieldConfig, field.formValues);
  }, [config?.options, field.formValues, fieldConfig]);

  const filteredOptions = useMemo(() => {
    const query = inputValue.toLowerCase();

    if (config?.asyncOptions) {
      return asyncOptions;
    }

    if (query.length < minChars) {
      return [];
    }

    return staticOptions
      .filter((option) => `${option.value} ${labelToText(option.label)}`.toLowerCase().includes(query))
      .slice(0, maxResults);
  }, [asyncOptions, config?.asyncOptions, inputValue, maxResults, minChars, staticOptions]);

  useEffect(() => {
    if (!config?.asyncOptions) {
      return undefined;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.length < minChars) {
      asyncRequestIdRef.current = getNextAutocompleteRequestId(asyncRequestIdRef.current);
      setAsyncOptions([]);
      setIsLoading(false);
      return undefined;
    }

    const loadOptions = config.asyncOptions;
    const requestId = getNextAutocompleteRequestId(asyncRequestIdRef.current);
    asyncRequestIdRef.current = requestId;

    debounceRef.current = setTimeout(() => {
      setIsLoading(true);
      loadOptions(inputValue)
        .then((options) => {
          if (isCurrentAutocompleteRequest(requestId, asyncRequestIdRef.current)) {
            setAsyncOptions(normalizeAutocompleteOptions(options).slice(0, maxResults));
          }
        })
        .catch((error: unknown) => {
          if (isCurrentAutocompleteRequest(requestId, asyncRequestIdRef.current)) {
            console.error('Autocomplete async options error:', error);
            setAsyncOptions([]);
          }
        })
        .finally(() => {
          if (isCurrentAutocompleteRequest(requestId, asyncRequestIdRef.current)) {
            setIsLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (isCurrentAutocompleteRequest(requestId, asyncRequestIdRef.current)) {
        asyncRequestIdRef.current = getNextAutocompleteRequestId(asyncRequestIdRef.current);
      }
    };
  }, [config, debounceMs, inputValue, maxResults, minChars]);

  const showDropdown = isOpen && (isLoading || inputValue.length >= minChars);

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="relative">
        <Input
          id={field.id}
          name={field.name}
          type="text"
          value={inputValue}
          placeholder={fieldConfig.placeholder ?? config?.placeholder ?? 'Type to search...'}
          autoComplete="off"
          disabled={fieldConfig.disabled}
          required={fieldConfig.required}
          aria-invalid={field.error ? true : undefined}
          className={cn(fieldConfig.inputClassName, isOpen && 'rounded-b-none')}
          onBlur={() => {
            field.onBlur();
            setTimeout(() => setIsOpen(false), 150);
          }}
          onChange={(event) => {
            const value = event.target.value;
            setInputValue(value);
            setIsOpen(true);
            if (shouldCommitCustomAutocompleteValue(allowCustom)) {
              field.onChange(value);
            }
          }}
          onFocus={() => {
            if (inputValue.length >= minChars) {
              setIsOpen(true);
            }
          }}
        />
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 max-h-60 overflow-y-auto rounded-b-md border border-t-0 bg-popover p-1 text-popover-foreground shadow-md">
            {isLoading && <div className="px-3 py-2 text-sm text-muted-foreground">{loadingText}</div>}
            {!isLoading && filteredOptions.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">{noOptionsText}</div>}
            {!isLoading &&
              filteredOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  disabled={option.disabled || fieldConfig.disabled}
                  className="flex h-auto w-full flex-col items-start rounded-sm px-3 py-2 text-left text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    const selection = getAutocompleteSelection(option);
                    setInputValue(selection.inputValue);
                    field.onChange(selection.fieldValue);
                    setIsOpen(false);
                  }}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.value !== labelToText(option.label) && <span className="text-xs text-muted-foreground">{option.value}</span>}
                </Button>
              ))}
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}
