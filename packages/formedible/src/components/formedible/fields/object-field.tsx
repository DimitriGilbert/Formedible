"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BaseFieldProps } from "@/lib/formedible/types";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";
import { NumberField } from "./number-field";
import { SelectField } from "./select-field";
import { MultiSelectField } from "./multi-select-field";
import { CheckboxField } from "./checkbox-field";
import { SwitchField } from "./switch-field";
import { RadioField } from "./radio-field";
import { SliderField } from "./slider-field";
import { DateField } from "./date-field";
import { RatingField } from "./rating-field";
import { PhoneField } from "./phone-field";
import { ColorPickerField } from "./color-picker-field";
import { FileUploadField } from "./file-upload-field";

interface ObjectFieldConfig {
  title?: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    description?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    [key: string]: unknown;
  }>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showCard?: boolean;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

interface ObjectFieldProps extends BaseFieldProps {
  objectConfig?: ObjectFieldConfig;
  disabled?: boolean;
}

export const ObjectField: React.FC<ObjectFieldProps> = ({
  fieldApi,
  label,
  description,
  wrapperClassName,
  disabled,
  objectConfig,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = React.useState(
    objectConfig?.defaultExpanded !== false
  );

  const fieldComponents = {
    text: TextField,
    email: TextField,
    password: TextField,
    url: TextField,
    tel: TextField,
    textarea: TextareaField,
    number: NumberField,
    select: SelectField,
    multiselect: MultiSelectField,
    checkbox: CheckboxField,
    switch: SwitchField,
    radio: RadioField,
    slider: SliderField,
    date: DateField,
    rating: RatingField,
    phone: PhoneField,
    color: ColorPickerField,
    file: FileUploadField,
    // Add more as needed
  };

  const renderField = (fieldConfig: ObjectFieldConfig['fields'][0]) => {
    const FieldComponent = fieldComponents[fieldConfig.type as keyof typeof fieldComponents];
    
    if (!FieldComponent) {
      console.warn(`Object field: Unknown field type "${fieldConfig.type}"`);
      return null;
    }

    // Create a mock field API for object subfields
    const mockFieldApi = {
      name: `${fieldApi.name}.${fieldConfig.name}`,
      state: {
        ...fieldApi.state,
        value: fieldApi.state.value?.[fieldConfig.name] || ''
      },
      handleChange: (value: unknown) => {
        const currentValue = fieldApi.state.value || {};
        fieldApi.handleChange({
          ...currentValue,
          [fieldConfig.name]: value
        });
      },
      handleBlur: fieldApi.handleBlur
    } as BaseFieldProps['fieldApi'];

    const fieldProps: BaseFieldProps & Record<string, unknown> = {
      fieldApi: mockFieldApi,
      label: fieldConfig.label,
      placeholder: fieldConfig.placeholder,
      description: fieldConfig.description,
      ...(fieldConfig.min !== undefined && { min: fieldConfig.min }),
      ...(fieldConfig.max !== undefined && { max: fieldConfig.max }),
      ...(fieldConfig.step !== undefined && { step: fieldConfig.step }),
      ...(disabled !== undefined && { disabled }),
    };

    // Handle fields that require options
    if (['select', 'radio', 'multiselect'].includes(fieldConfig.type)) {
      fieldProps.options = fieldConfig.options || [];
    }

    return (
      <div key={fieldConfig.name}>
        <FieldComponent {...(fieldProps as any)} />
      </div>
    );
  };

  const getLayoutClasses = () => {
    const layout = objectConfig?.layout || "vertical";
    const columns = objectConfig?.columns || 2;
    
    switch (layout) {
      case "horizontal":
        return "flex flex-wrap gap-4";
      case "grid":
        return `grid grid-cols-1 md:grid-cols-${columns} gap-4`;
      default:
        return "space-y-4";
    }
  };

  const content = (
    <div className={cn("space-y-4", wrapperClassName)}>
      {/* Main label and description */}
      {(label || description) && (
        <div className="space-y-1">
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Object title and description */}
      {(objectConfig?.title || objectConfig?.description) && (
        <div className="space-y-1">
          {objectConfig?.title && (
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">
                {objectConfig.title}
              </h4>
              {objectConfig?.collapsible && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? "Collapse" : "Expand"}
                </button>
              )}
            </div>
          )}
          {objectConfig?.description && (
            <p className="text-xs text-muted-foreground">
              {objectConfig.description}
            </p>
          )}
        </div>
      )}

      {/* Fields */}
      {(!objectConfig?.collapsible || isExpanded) && (
        <>
          {objectConfig?.title && <div className="border-t my-4" />}
          <div className={getLayoutClasses()}>
            {objectConfig?.fields?.map(renderField)}
          </div>
        </>
      )}

      {/* Show field errors */}
      {fieldApi.state.meta.errors && fieldApi.state.meta.errors.length > 0 && (
        <div className="text-sm text-destructive">
          {fieldApi.state.meta.errors.join(", ")}
        </div>
      )}
    </div>
  );

  // Wrap in card if specified
  if (objectConfig?.showCard) {
    return (
      <Card className="w-full">
        {(objectConfig?.title || objectConfig?.description) && (
          <CardHeader className="pb-3">
            {objectConfig?.title && (
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{objectConfig.title}</CardTitle>
                {objectConfig?.collapsible && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </button>
                )}
              </div>
            )}
            {objectConfig?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {objectConfig.description}
              </p>
            )}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          {(!objectConfig?.collapsible || isExpanded) && (
            <div className={getLayoutClasses()}>
              {objectConfig?.fields?.map(renderField)}
            </div>
          )}
          
          {/* Show field errors */}
          {fieldApi.state.meta.errors && fieldApi.state.meta.errors.length > 0 && (
            <div className="text-sm text-destructive mt-4">
              {fieldApi.state.meta.errors.join(", ")}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return content;
};