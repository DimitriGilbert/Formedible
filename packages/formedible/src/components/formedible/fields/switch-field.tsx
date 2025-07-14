import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export const SwitchField: React.FC<BaseFieldProps> = ({
  fieldApi,
  
  ...wrapperProps
}) => {
  if (!fieldApi.state) {
    console.error('SwitchField: fieldApi.state is undefined', fieldApi);
    return null;
  }

  const onCheckedChange = (checked: boolean) => {
    fieldApi.handleChange(checked);
    fieldApi.onChange?.(checked);
  };

  const onBlur = (e: React.FocusEvent) => {
    fieldApi.handleBlur();
    fieldApi.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent) => {
    fieldApi.onFocus?.(e);
  };

  return (
    // Note: We pass label={undefined} to BaseFieldWrapper and render the label manually
    // because Switch components need the label positioned next to (not above) the control
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
