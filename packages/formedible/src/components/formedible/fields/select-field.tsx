import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

interface SelectFieldSpecificProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }> | string[];
}

export const SelectField: React.FC<SelectFieldSpecificProps> = ({
  fieldApi,
  options = [],
  
  ...wrapperProps
}) => {
  if (!fieldApi.state) {
    console.error('SelectField: fieldApi.state is undefined');
    return null;
  }

  const onValueChange = (value: string) => {
    fieldApi.handleChange(value);
    fieldApi.onChange?.(value);
  };

  const onBlur = (e: React.FocusEvent) => {
    fieldApi.handleBlur();
    fieldApi.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent) => {
    fieldApi.onFocus?.(e);
  };

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled, inputClassName }) => (
        <Select
          value={(fieldApi.state.value as string) || ''}
          onValueChange={onValueChange}
          disabled={isDisabled}
        >
          <SelectTrigger
            id={fieldApi.name + "-trigger"}
            onBlur={onBlur}
            onFocus={onFocus}
            className={cn(inputClassName)}
          >
            <SelectValue placeholder={wrapperProps.placeholder || "Select an option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, index) => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              return (
                <SelectItem key={value + index} value={value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </BaseFieldWrapper>
  );
};
