import React, { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, normalizeOptions } from "@/lib/utils";
import type { ComboboxFieldSpecificProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { useFieldState } from "@/hooks/use-field-state";

export const ComboboxField: React.FC<ComboboxFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  options = [],
  comboboxConfig,
}) => {
  const { name, value, isDisabled, hasErrors, onChange, onBlur } = useFieldState(fieldApi);

  const [open, setOpen] = useState(false);

  const normalizedOptions = normalizeOptions(options);

  const selectedOption = normalizedOptions.find(
    (option) => option.value === (value as string)
  );

  const onSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue;
    onChange(newValue);
    setOpen(false);
  };

  const triggerClassName = cn(
    "w-full justify-between",
    inputClassName,
    hasErrors ? "border-destructive" : ""
  );

  const displayPlaceholder =
    placeholder || comboboxConfig?.placeholder || "Select an option";
  const searchPlaceholder =
    comboboxConfig?.searchPlaceholder || "Search options...";
  const noOptionsText = comboboxConfig?.noOptionsText || "No options found.";
  const searchable = comboboxConfig?.searchable ?? true;

  return (
    <FieldWrapper
      fieldApi={fieldApi}
      label={label}
      description={description}
      inputClassName={inputClassName}
      labelClassName={labelClassName}
      wrapperClassName={wrapperClassName}
      htmlFor={name + "-trigger"}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={triggerClassName}
            disabled={isDisabled}
            id={name + "-trigger"}
            onBlur={onBlur}
          >
            {selectedOption ? selectedOption.label : displayPlaceholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            {searchable && (
              <CommandInput placeholder={searchPlaceholder} className="h-9" />
            )}
            <CommandList>
              <CommandEmpty>{noOptionsText}</CommandEmpty>
              <CommandGroup>
                {normalizedOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => onSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};
