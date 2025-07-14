import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { BaseFieldProps } from '@/lib/formedible/types';
import { FieldWrapper } from './base-field-wrapper';

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
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  min = 0,
  max = 100,
  step = 1,
  valueLabelPrefix = '',
  valueLabelSuffix = '',
  valueDisplayPrecision = 0,
  showRawValue = false,
}) => {
  const name = fieldApi.name;
  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;
  const fieldValue = typeof fieldApi.state?.value === 'number' ? fieldApi.state?.value : min;
  const displayValue = fieldValue.toFixed(valueDisplayPrecision);

  const onValueChange = (valueArray: number[]) => {
    const newValue = valueArray[0];
    fieldApi.handleChange(newValue);
  };

  const onBlur = () => {
    fieldApi.handleBlur();
  };

  // Custom label with value display
  const customLabel = label 
    ? `${label} (${valueLabelPrefix}${displayValue}${valueLabelSuffix})`
    : undefined;

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={customLabel}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <div>
        {showRawValue && (
          <div className="text-xs text-muted-foreground mb-2">
            Raw: {fieldApi.state?.value}
          </div>
        )}
        <Slider
          id={name}
          name={name}
          value={[fieldValue]}
          onValueChange={onValueChange}
          onBlur={onBlur}
          disabled={isDisabled}
          min={min}
          max={max}
          step={step}
          className={cn(inputClassName)}
        />
      </div>
    </FieldWrapper>
  );
}; 