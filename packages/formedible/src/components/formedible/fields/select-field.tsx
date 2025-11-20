import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFieldInputClassName, normalizeOptions } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { FieldWrapper } from './base-field-wrapper';
import { useFieldState } from '@/hooks/use-field-state';

interface SelectFieldSpecificProps extends BaseFieldProps {
  options: Array<{ value: string; label: string }> | string[];
}

export const SelectField: React.FC<SelectFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  options = [],
}) => {
  const { name, value, isDisabled, hasErrors, onChange, onBlur } = useFieldState(fieldApi);
  const normalizedOptions = normalizeOptions(options);

  const onValueChange = (newValue: string) => {
    onChange(newValue);
  };

  const computedInputClassName = getFieldInputClassName(inputClassName, hasErrors);

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <Select
        value={(value as string) || ''}
        onValueChange={onValueChange}
        disabled={isDisabled}
      >
        <SelectTrigger
          id={name + "-trigger"}
          onBlur={onBlur}
          className={computedInputClassName}
        >
          <SelectValue placeholder={placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option, index) => (
            <SelectItem key={option.value + index} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
};