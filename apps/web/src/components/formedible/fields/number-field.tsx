'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export interface NumberFieldSpecificProps extends BaseFieldProps {
  min?: number;
  max?: number;
  step?: number;
}

export const NumberField: React.FC<NumberFieldSpecificProps> = ({
  fieldApi,
  min,
  max,
  step,
  
  ...wrapperProps
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  const value = state.value as number | string | undefined;

  if (!fieldApi.state) {
    console.error('NumberField: fieldApi.state is undefined');
    return null;
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let parsedValue: number | string | undefined;
    
    if (val === '') {
      parsedValue = undefined;
    } else {
      const num = parseFloat(val);
      parsedValue = isNaN(num) ? val : num;
    }
    
    handleChange(parsedValue);
    fieldApi.onChange?.(parsedValue, e);
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    handleBlur();
    fieldApi.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    fieldApi.onFocus?.(e);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    fieldApi.onKeyDown?.(e);
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    fieldApi.onKeyUp?.(e);
  };

  let displayValue: string | number = '';
  if (typeof value === 'number') {
    displayValue = value;
  } else if (typeof value === 'string') {
    displayValue = value;
  }

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled, inputClassName }) => (
        <Input
          id={name}
          name={name}
          type="number"
          value={displayValue}
          onBlur={onBlur}
          onFocus={onFocus}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          placeholder={wrapperProps.placeholder}
          min={min}
          max={max}
          step={step}
          className={cn(inputClassName)}
          disabled={isDisabled}
        />
      )}
    </BaseFieldWrapper>
  );
};
