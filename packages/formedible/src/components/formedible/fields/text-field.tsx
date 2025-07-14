'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export interface TextFieldSpecificProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'datetime-local';
  datalist?: {
    options?: string[];
    asyncOptions?: (query: string) => Promise<string[]>;
    debounceMs?: number;
    minChars?: number;
    maxResults?: number;
  };
}

export const TextField: React.FC<TextFieldSpecificProps> = ({
  fieldApi,
  type = 'text',
  datalist,
  ...wrapperProps
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  const value = state.value as string | number | undefined;
  
  // Datalist state
  const [datalistOptions, setDatalistOptions] = useState<string[]>(datalist?.options || []);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  // Debounced async options fetching
  const fetchAsyncOptions = useCallback(
    async (query: string) => {
      if (!datalist?.asyncOptions) return;
      
      const minChars = datalist.minChars || 1;
      if (query.length < minChars) {
        setDatalistOptions(datalist.options || []);
        return;
      }

      if (query === lastQuery) return;
      
      setIsLoadingOptions(true);
      setLastQuery(query);
      
      try {
        const results = await datalist.asyncOptions(query);
        const maxResults = datalist.maxResults || 10;
        const limitedResults = results.slice(0, maxResults);
        
        // Combine static options with async results
        const staticOptions = datalist.options || [];
        const combinedOptions = [...staticOptions, ...limitedResults];
        
        // Remove duplicates
        const uniqueOptions = Array.from(new Set(combinedOptions));
        
        setDatalistOptions(uniqueOptions);
      } catch (error) {
        console.error('Error fetching datalist options:', error);
        // Fallback to static options on error
        setDatalistOptions(datalist.options || []);
      } finally {
        setIsLoadingOptions(false);
      }
    },
    [datalist, lastQuery]
  );

  // Debounced effect for async options
  useEffect(() => {
    if (!datalist?.asyncOptions) return;
    
    const debounceMs = datalist.debounceMs || 300;
    const currentValue = String(value || '');
    
    const timeoutId = setTimeout(() => {
      fetchAsyncOptions(currentValue);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, fetchAsyncOptions, datalist]);

  // Generate unique datalist id
  const datalistId = useMemo(() => 
    datalist ? `${name}-datalist` : undefined, 
    [name, datalist]
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.value);
            fieldApi.eventHandlers?.onChange?.(e.target.value, e);  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur();
            fieldApi.eventHandlers?.onBlur?.(e);  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            fieldApi.eventHandlers?.onFocus?.(e);  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            fieldApi.eventHandlers?.onKeyDown?.(e);  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
            fieldApi.eventHandlers?.onKeyUp?.(e);  };

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled, inputClassName }) => (
        <>
          <Input
            id={name}
            name={name}
            type={type}
            value={value === undefined || value === null ? '' : String(value)}
            onBlur={onBlur}
            onFocus={onFocus}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            placeholder={wrapperProps.placeholder}
            className={cn(inputClassName, isLoadingOptions ? "pr-8" : "")}
            disabled={isDisabled}
            list={datalistId}
            autoComplete={datalist ? "off" : undefined}
          />
          {isLoadingOptions && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-muted-foreground">Loading...</span>
            </div>
          )}
          {datalist && datalistOptions.length > 0 && (
            <datalist id={datalistId}>
              {datalistOptions.map((option, index) => (
                <option key={`${option}-${index}`} value={option} />
              ))}
            </datalist>
          )}
        </>
      )}
    </BaseFieldWrapper>
  );
};
