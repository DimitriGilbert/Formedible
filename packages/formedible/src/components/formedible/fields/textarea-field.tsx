import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export interface TextareaFieldSpecificProps extends BaseFieldProps {
  rows?: number;
}

export const TextareaField: React.FC<TextareaFieldSpecificProps> = ({
  fieldApi,
  rows = 3,
  ...wrapperProps
}) => {
  if (!fieldApi.state) {
    console.error('TextareaField: fieldApi.state is undefined', fieldApi);
    return null;
  }
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    fieldApi.handleChange(e.target.value);
    fieldApi.eventHandlers?.onChange?.(e.target.value, e);
  };

  const onBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    fieldApi.handleBlur();
    fieldApi.eventHandlers?.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    fieldApi.eventHandlers?.onFocus?.(e);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    fieldApi.eventHandlers?.onKeyDown?.(e);
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    fieldApi.eventHandlers?.onKeyUp?.(e);
  };

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      {({ isDisabled, inputClassName }) => (
        <Textarea
          id={fieldApi.name}
          name={fieldApi.name}
          value={(fieldApi.state.value as string) || ''}
          onBlur={onBlur}
          onFocus={onFocus}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          placeholder={wrapperProps.placeholder}
          rows={rows}
          className={cn(inputClassName)}
          disabled={isDisabled}
        />
      )}
    </BaseFieldWrapper>
  );
};
