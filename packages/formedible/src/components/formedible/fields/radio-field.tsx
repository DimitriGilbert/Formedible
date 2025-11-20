"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, normalizeOptions, getFieldInputClassName } from "@/lib/utils";
import type { RadioFieldSpecificProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { useFieldState } from "@/hooks/use-field-state";

export const RadioField: React.FC<RadioFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  inputClassName,
  labelClassName,
  wrapperClassName,
  options = [],
  direction = "vertical",
}) => {
  const { name, value, isDisabled, hasErrors, onChange, onBlur } = useFieldState(fieldApi);
  const normalizedOptions = normalizeOptions(options);

  const onValueChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <RadioGroup
        value={(value as string) || ""}
        onValueChange={onValueChange}
        onBlur={onBlur}
        disabled={isDisabled}
        className={cn(
          direction === "horizontal"
            ? "flex flex-wrap gap-6"
            : "flex flex-col space-y-2",
          inputClassName
        )}
      >
        {normalizedOptions.map((option, index) => (
          <div
            key={`${option.value}-${index}`}
            className="flex items-center space-x-2"
          >
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
              className={getFieldInputClassName(undefined, hasErrors)}
            />
            <Label
              htmlFor={`${name}-${option.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </FieldWrapper>
  );
};
