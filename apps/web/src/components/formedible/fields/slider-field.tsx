import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { getNumber } from '@/components/formedible/fields/advanced-field-utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

export function SliderField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.sliderConfig;
  const min = config?.min ?? fieldConfig.min ?? 0;
  const max = config?.max ?? fieldConfig.max ?? 100;
  const step = config?.step ?? fieldConfig.step ?? 1;
  const value = getNumber(field.value, min);
  const mappingItem = config?.valueMapping?.find((item) => item.sliderValue === value);
  const displayValue = mappingItem?.displayValue ?? value.toFixed(config?.valueDisplayPrecision ?? 0);
  const VisualizationComponent = config?.visualizationComponent;
  const label = fieldConfig.label && config?.showValue !== false ? `${fieldConfig.label} (${config?.valueLabelPrefix ?? ''}${displayValue}${config?.valueLabelSuffix ?? ''})` : fieldConfig.label;

  return (
    <FieldWrapper fieldConfig={{ ...fieldConfig, label }} field={field}>
      <div className="space-y-3">
        {config?.showRawValue && <div className="text-xs text-muted-foreground">Raw: {value}</div>}
        {VisualizationComponent && config?.valueMapping && (
          <div className="flex items-center justify-between gap-2">
            {config.valueMapping.map((item) => (
              <Button key={item.sliderValue} type="button" variant="ghost" disabled={fieldConfig.disabled} onClick={() => field.onChange(item.sliderValue)}>
                <VisualizationComponent value={item.sliderValue} displayValue={item.displayValue} label={item.label} isActive={value === item.sliderValue} />
              </Button>
            ))}
          </div>
        )}
        <InputRange
          id={field.id}
          name={field.name}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={fieldConfig.disabled}
          invalid={field.error !== undefined}
          className={fieldConfig.inputClassName}
          onBlur={field.onBlur}
          onChange={field.onChange}
        />
        {config?.marks && config.marks.length > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground">
            {config.marks.map((mark) => (
              <span key={mark.value}>{mark.label}</span>
            ))}
          </div>
        )}
        {mappingItem?.label && <div className="text-center text-sm text-muted-foreground">{mappingItem.label}</div>}
      </div>
    </FieldWrapper>
  );
}

interface InputRangeProps {
  readonly id: string;
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly className?: string;
  readonly onBlur: () => void;
  readonly onChange: (value: number) => void;
}

function InputRange({ id, name, min, max, step, value, disabled, invalid, className, onBlur, onChange }: InputRangeProps) {
  return <Slider id={id} name={name} min={min} max={max} step={step} value={value} disabled={disabled} aria-invalid={invalid ? true : undefined} className={className} onBlur={onBlur} onValueChange={onChange} />;
}
