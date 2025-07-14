import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BaseFieldProps, FieldEventHandlers } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export const SwitchField: React.FC<BaseFieldProps> = ({
  fieldApi,
  
  ...wrapperProps
}) => {
  const onCheckedChange = (checked: boolean) => {
    fieldApi.handleChange(checked);
    fieldApi.eventHandlers?.onChange?.(checked);
  };

  const onBlur = (e: React.FocusEvent) => {
    fieldApi.handleBlur();
    fieldApi.eventHandlers?.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent) => {
    fieldApi.eventHandlers?.onFocus?.(e);
  };

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps} label={undefined}>
      {({ isDisabled }) => (
        <div className="flex items-center space-x-2">
          <Switch
            id={fieldApi.name}
            checked={!!fieldApi.state.value}
            onCheckedChange={onCheckedChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={isDisabled}
            aria-describedby={wrapperProps.description ? `${fieldApi.name}-description` : undefined}
          />
          {wrapperProps.label && (
            <Label 
              htmlFor={fieldApi.name} 
              className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", wrapperProps.labelClassName)}
            >
              {wrapperProps.label}
            </Label>
          )}
        </div>
      )}
    </BaseFieldWrapper>
  );
};
