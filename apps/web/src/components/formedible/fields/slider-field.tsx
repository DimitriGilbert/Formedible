import React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { SliderFieldSpecificProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";


export const SliderField: React.FC<SliderFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  inputClassName,
  labelClassName,
  wrapperClassName,
  sliderConfig,
  // Backwards compatibility props
  min: directMin = 0,
  max: directMax = 100,
  step: directStep = 1,
  valueLabelPrefix: directPrefix = "",
  valueLabelSuffix: directSuffix = "",
  valueDisplayPrecision: directPrecision = 0,
  showRawValue: directShowRaw = false,
}) => {
  const name = fieldApi.name;
  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;

  // Use sliderConfig if provided, otherwise use direct props
  const config = sliderConfig || {
    min: directMin,
    max: directMax,
    step: directStep,
    valueLabelPrefix: directPrefix,
    valueLabelSuffix: directSuffix,
    valueDisplayPrecision: directPrecision,
    showRawValue: directShowRaw,
  };

  const {
    min = 0,
    max = 100,
    step = 1,
    valueMapping,
    gradientColors,
    visualizationComponent: VisualizationComponent,
    valueLabelPrefix = "",
    valueLabelSuffix = "",
    valueDisplayPrecision = 0,
    showRawValue = false,
    showValue = true,
    marks = [],
  } = config;

  const fieldValue =
    typeof fieldApi.state?.value === "number" ? fieldApi.state?.value : min;

  // Get display value from mapping or calculate it
  const getDisplayValue = (sliderValue: number) => {
    if (valueMapping) {
      const mapping = valueMapping.find((m) => m.sliderValue === sliderValue);
      return mapping ? mapping.displayValue : sliderValue;
    }
    return sliderValue.toFixed(valueDisplayPrecision);
  };

  const displayValue = getDisplayValue(fieldValue);
  const mappingItem = valueMapping?.find((m) => m.sliderValue === fieldValue);

  const onValueChange = (valueArray: number[]) => {
    const newValue = valueArray[0];
    fieldApi.handleChange(newValue);
  };

  const onBlur = () => {
    fieldApi.handleBlur();
  };

  // Custom label with value display
  const customLabel =
    label && showValue
      ? `${label} (${valueLabelPrefix}${displayValue}${valueLabelSuffix})`
      : label;

  // Generate unique ID for this slider instance
  const sliderId = `slider-${name}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate current color based on slider value
  const getCurrentColor = () => {
    if (!gradientColors) return null;
    
    const percentage = ((fieldValue - min) / (max - min)) * 100;
    
    // Parse hex colors
    const startColor = gradientColors.start;
    const endColor = gradientColors.end;
    
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const startRgb = hexToRgb(startColor);
    const endRgb = hexToRgb(endColor);
    
    if (!startRgb || !endRgb) return startColor;
    
    // Interpolate between start and end colors
    const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * (percentage / 100));
    const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * (percentage / 100));
    const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * (percentage / 100));
    
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const currentColor = getCurrentColor();

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={customLabel}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <div className="space-y-4">
        {showRawValue && (
          <div className="text-xs text-muted-foreground">
            Raw: {fieldApi.state?.value}
          </div>
        )}

        {/* Custom visualization component if provided */}
        {VisualizationComponent && valueMapping && (
          <div className="relative mb-6">
            {/* Visualization components container */}
            <div className="flex justify-between items-end px-2">
              {valueMapping.map((mapping, index) => {
                const isActive = fieldValue === mapping.sliderValue;
                return (
                  <div
                    key={index}
                    className={cn(
                      "relative flex flex-col items-center transition-all duration-300 ease-out cursor-pointer select-none",
                      "hover:scale-105 active:scale-95",
                      isActive ? "z-10" : "z-0"
                    )}
                    onClick={() => {
                      fieldApi.handleChange(mapping.sliderValue);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fieldApi.handleChange(mapping.sliderValue);
                      }
                    }}
                    aria-label={`Set value to ${mapping.displayValue}${mapping.label ? `: ${mapping.label}` : ''}`}
                  >
                    {/* Highlight background for active item */}
                    {isActive && (
                      <div 
                        className="absolute inset-0 -m-2 bg-primary/10 rounded-xl animate-pulse" 
                        style={{ zIndex: -1 }} 
                      />
                    )}
                    
                    {/* Custom visualization component */}
                    <div className={cn(
                      "transition-all duration-300",
                      isActive ? "transform scale-110" : "transform scale-100"
                    )}>
                      <VisualizationComponent
                        value={mapping.sliderValue}
                        displayValue={mapping.displayValue}
                        label={mapping.label}
                        isActive={isActive}
                      />
                    </div>
                    
                    {/* Connection line to slider */}
                    <div 
                      className={cn(
                        "w-0.5 h-4 mt-2 transition-all duration-300",
                        isActive ? "bg-primary scale-x-150" : "bg-border"
                      )} 
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Enhanced connection visualization */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
        )}

        <div className="relative">
          {gradientColors && currentColor && (
            <style>{`
              .${sliderId} [data-slot="slider-range"] {
                background: ${currentColor} !important;
                transition: all 0.3s ease;
              }
              .${sliderId} [data-slot="slider-thumb"] {
                transition: all 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              }
              .${sliderId} [data-slot="slider-thumb"]:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
              }
              .${sliderId} [data-slot="slider-track"] {
                background: hsl(var(--muted));
              }
            `}</style>
          )}
          
          {/* Value indicator above slider */}
          {showValue && (
            <div 
              className="absolute -top-8 left-0 transition-all duration-300 ease-out"
              style={{
                left: `calc(${((fieldValue - min) / (max - min)) * 100}% - 0.5rem)`
              }}
            >
              <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg">
                {valueLabelPrefix}{displayValue}{valueLabelSuffix}
              </div>
              <div className="w-2 h-2 bg-primary transform rotate-45 mx-auto -mt-1"></div>
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
            className={cn(
              "transition-all duration-200 hover:opacity-90",
              inputClassName, 
              gradientColors && sliderId
            )}
          />

          {/* Enhanced marks display */}
          {marks.length > 0 && (
            <div className="relative mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                {marks.map((mark, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="w-px h-2 bg-border mb-1"></div>
                    <span className="text-center font-medium">
                      {mark.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced current mapping info display */}
        {mappingItem?.label && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-muted">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-foreground">
                Current: {mappingItem.label}
              </span>
              <div className="text-xs text-muted-foreground">
                ({valueLabelPrefix}{displayValue}{valueLabelSuffix})
              </div>
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};
