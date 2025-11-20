import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { getFieldInputClassName } from '@/lib/utils';
import type { TextareaFieldSpecificProps } from '@/lib/formedible/types';
import { FieldWrapper } from './base-field-wrapper';
import { useFieldState } from '@/hooks/use-field-state';


export const TextareaField: React.FC<TextareaFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  rows = 3,
}) => {
  const { name, value, isDisabled, hasErrors, onChange: onFieldChange, onBlur } = useFieldState(fieldApi);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFieldChange(e.target.value);
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
      <Textarea
        id={name}
        name={name}
        value={(value as string) || ''}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={computedInputClassName}
        disabled={isDisabled}
      />
    </FieldWrapper>
  );
};