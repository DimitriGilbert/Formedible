'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';

export interface RadioFieldSpecificProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }> | string[];
  direction?: 'horizontal' | 'vertical';
}

export const RadioField: React.FC<RadioFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  options = [],
  direction = 'vertical',
  inputClassName,
  labelClassName,
  wrapperClassName,
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  const value = state.value as string;

  const normalizedOptions = options.map(option => 
    typeof option === 'string' 
      ? { value: option, label: option }
      : option
  );

  return (
    <div className={cn("space-y-3", wrapperClassName)}>
      {label && (
        <Label className={cn("text-sm font-medium", labelClassName)}>
          {label}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <RadioGroup
        value={value || ''}
        onValueChange={handleChange}
        onBlur={handleBlur}
        disabled={fieldApi.form.state.isSubmitting}
        className={cn(
          direction === 'horizontal' 
            ? "flex flex-wrap gap-6" 
            : "flex flex-col space-y-2",
          inputClassName
        )}
      >
        {normalizedOptions.map((option, index) => (
          <div key={`${option.value}-${index}`} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              className={cn(
                state.meta.errors.length ? "border-destructive" : ""
              )}
            />
            <Label
              htmlFor={`${name}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
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