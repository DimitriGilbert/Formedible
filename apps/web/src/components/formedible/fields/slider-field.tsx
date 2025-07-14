import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { BaseFieldWrapper } from './base-field-wrapper';

export interface SliderFieldSpecificProps extends BaseFieldProps {
  min?: number;
  max?: number;
  step?: number;
  valueLabelPrefix?: string; // E.g., "Temperature"
  valueLabelSuffix?: string; // E.g., "FPS" 
  valueDisplayPrecision?: number; // For toFixed()
  showRawValue?: boolean; // Optionally show raw value next to formatted one
}

export const SliderField: React.FC<SliderFieldSpecificProps> = ({
  fieldApi,
  min = 0,
  max = 100,
  step = 1,
  valueLabelPrefix = '',
  valueLabelSuffix = '',
  valueDisplayPrecision = 0,
  showRawValue = false,
  
  ...wrapperProps
}) => {
  const { name, state, handleChange, handleBlur } = fieldApi;
  
  if (!state) {
    console.error('SliderField: fieldApi.state is undefined', fieldApi);
    return null;
  }
  
  const fieldValue = typeof state.value === 'number' ? state.value : min;
  const displayValue = fieldValue.toFixed(valueDisplayPrecision);

  const onValueChange = (valueArray: number[]) => {
    const newValue = valueArray[0];
    handleChange(newValue);
    fieldApi.onChange?.(newValue);
  };

  const onBlur = (e: React.FocusEvent) => {
    handleBlur();
    fieldApi.onBlur?.(e);
  };

  const onFocus = (e: React.FocusEvent) => {
    fieldApi.onFocus?.(e);
  };

  // Custom label with value display
  const customLabel = wrapperProps.label 
    ? `${wrapperProps.label} (${valueLabelPrefix}${displayValue}${valueLabelSuffix})`
    : undefined;

  return (
    <BaseFieldWrapper fieldApi={fieldApi} {...wrapperProps} label={customLabel}>
      {({ isDisabled, inputClassName }) => (
        <>
          {showRawValue && (
            <div className="text-xs text-muted-foreground mb-2">
              Raw: {state.value}
            </div>
          )}
          <Slider
            id={name}
            name={name}
            value={[fieldValue]}
            onValueChange={onValueChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={isDisabled}
            min={min}
            max={max}
            step={step}
            className={cn(inputClassName)}
          />
        </>
      )}
    </BaseFieldWrapper>
  );
}; 