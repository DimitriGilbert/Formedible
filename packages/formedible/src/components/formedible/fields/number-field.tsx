'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { getFieldInputClassName } from '@/lib/utils';
import type { NumberFieldSpecificProps } from '@/lib/formedible/types';
import { FieldWrapper } from './base-field-wrapper';
import { useFieldState } from '@/hooks/use-field-state';


export const NumberField: React.FC<NumberFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  min,
  max,
  step,
}) => {
  const { name, value, isDisabled, hasErrors, onChange: onFieldChange, onBlur } = useFieldState(fieldApi);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let parsedValue: number | string | undefined;

    if (val === '') {
      parsedValue = undefined;
    } else {
      const num = parseFloat(val);
      parsedValue = isNaN(num) ? val : num;
    }

    onFieldChange(parsedValue);
  };

  let displayValue: string | number = '';
  if (typeof value === 'number') {
    displayValue = value;
  } else if (typeof value === 'string') {
    displayValue = value;
  }

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
      <Input
        id={name}
        name={name}
        type="number"
        value={displayValue}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        className={computedInputClassName}
        disabled={isDisabled}
        min={min}
        max={max}
        step={step}
      />
    </FieldWrapper>
  );
};