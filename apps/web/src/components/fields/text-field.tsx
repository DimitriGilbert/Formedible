'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '../../lib/formedible/types';

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
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  type = 'text',
  datalist,
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
  };

  return (
    <div className={cn("space-y-1.5", wrapperClassName)}>
      {label && (
        <Label htmlFor={name} className={cn("text-sm font-medium", labelClassName)}>
          {label}
          {isLoadingOptions && (
            <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
          )}
        </Label>
      )}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <Input
        id={name}
        name={name}
        type={type}
        value={value === undefined || value === null ? '' : String(value)}
        onBlur={handleBlur}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(inputClassName, state.meta.errors.length ? "border-destructive" : "")}
        disabled={fieldApi.form.state.isSubmitting}
        list={datalistId}
        autoComplete={datalist ? "off" : undefined}
      />
      {datalist && datalistOptions.length > 0 && (
        <datalist id={datalistId}>
          {datalistOptions.map((option, index) => (
            <option key={`${option}-${index}`} value={option} />
          ))}
        </datalist>
      )}
      {state.meta.isTouched && state.meta.errors.length > 0 && (
        <div className="text-xs text-destructive pt-1">
          {state.meta.errors.map((err: string | Error, index: number) => (
            <p key={index}>{typeof err === 'string' ? err : (err as Error)?.message || 'Invalid'}</p>
          ))}
        </div>
      )}
    </div>
  );
};
