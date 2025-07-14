'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export interface RadioFieldSpecificProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }> | string[];
  direction?: 'horizontal' | 'vertical';
}

export const RadioField: React.FC<RadioFieldSpecificProps> = ({
  fieldApi,
  options = [],
  direction = 'vertical',
  
  ...wrapperProps
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  
  if (!state) {
    console.error('RadioField: fieldApi.state is undefined', fieldApi);
    return null;
  }
  
  const value = state.value as string;

  const normalizedOptions = options.map(option => 
    typeof option === 'string' 
      ? { value: option, label: option }
      : option
  );

  const onValueChange = (value: string) => {
    handleChange(value);
    fieldApi.eventHandlers?.onChange?.(value);
  };

  const onBlur = (e: React.FocusEvent) => {
    handleBlur();
    fieldApi.eventHandlers?.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent) => {
    fieldApi.eventHandlers?.onFocus?.(e);
  };

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled, hasErrors }) => (
        <RadioGroup
          value={value || ''}
          onValueChange={onValueChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={isDisabled}
          className={cn(
            direction === 'horizontal' 
              ? "flex flex-wrap gap-6" 
              : "flex flex-col space-y-2",
            wrapperProps.inputClassName
          )}
        >
          {normalizedOptions.map((option, index) => (
            <div key={`${option.value}-${index}`} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`${name}-${option.value}`}
                className={cn(
                  hasErrors ? "border-destructive" : ""
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
      )}
    </BaseFieldWrapper>
  );
}; 