import React from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateFieldProps } from "@/lib/formedible/types";
import { buildDisabledMatchers } from "@/lib/formedible/date";
import { FieldWrapper } from "./base-field-wrapper";

export const DateField: React.FC<DateFieldProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  dateConfig,
}) => {
  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;
  const hasErrors =
    fieldApi.state?.meta?.isTouched && fieldApi.state?.meta?.errors?.length > 0;

  const [isOpen, setIsOpen] = React.useState(false);

  // Subscribe to form values for dynamic date restrictions
  const [formValues, setFormValues] = React.useState(
    fieldApi.form?.state?.values || {}
  );

  React.useEffect(() => {
    if (!fieldApi.form) return;
    const unsubscribe = fieldApi.form.store.subscribe((state) => {
      setFormValues((state as any).values);
    });
    return unsubscribe;
  }, [fieldApi.form]);

  const value = fieldApi.state?.value;
  const selectedDate = value
    ? value instanceof Date
      ? value
      : typeof value === "string"
      ? parseISO(value)
      : undefined
    : undefined;

  // Build disabled matchers from dateConfig with access to form values
  const disabledMatchers = React.useMemo(() => {
    // If disableDate is a function that needs form values, call it with form values
    let enhancedDateConfig = dateConfig;
    if (dateConfig?.disableDate && typeof dateConfig.disableDate === 'function') {
      // Create a wrapper that provides form values to the disable function
      const originalDisableDate = dateConfig.disableDate;
      enhancedDateConfig = {
        ...dateConfig,
        disableDate: (date: Date) => originalDisableDate(date, formValues)
      };
    }

    const matchers = buildDisabledMatchers(enhancedDateConfig);
    // If form is disabled, add a matcher that disables all dates
    if (isDisabled) {
      return true; // Disable all dates when form is disabled
    }
    return matchers.length > 0 ? matchers : undefined;
  }, [dateConfig, isDisabled, formValues]);

  const handleDateSelect = (date: Date | undefined) => {
    fieldApi.handleChange(date);
    fieldApi.handleBlur();
    setIsOpen(false);
  };

  const computedInputClassName = cn(
    "w-full justify-start text-left font-normal",
    !selectedDate && "text-muted-foreground",
    hasErrors ? "border-destructive" : "",
    inputClassName
  );

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={computedInputClassName}
            disabled={isDisabled}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP")
            ) : (
              <span>{placeholder || "Pick a date"}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            disabled={disabledMatchers}
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};
