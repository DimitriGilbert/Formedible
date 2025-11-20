"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { cn, normalizeOptions, getFieldInputClassName } from "@/lib/utils";
import { X, ChevronDown, Check } from "lucide-react";
import type { MultiComboboxFieldSpecificProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { useFieldState } from "@/hooks/use-field-state";

export const MultiComboboxField: React.FC<MultiComboboxFieldSpecificProps> = ({
  fieldApi,
  options = [],
  multiComboboxConfig = {},
  ...wrapperProps
}) => {
  const {
    maxSelections = Infinity,
    searchable = true,
    creatable = false,
    placeholder = "Select options...",
    searchPlaceholder = "Search options...",
    noOptionsText = "No options found",
  } = multiComboboxConfig;

  const { value, isDisabled, hasErrors, onChange, onBlur } = useFieldState(fieldApi);
  const selectedValues = Array.isArray(value) ? value : [];

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = normalizeOptions(options);

  type DisplayOption = {
    value: string;
    label: string;
    isCreateOption?: boolean;
  };

  const displayOptions: DisplayOption[] = [...normalizedOptions];

  const handleSelect = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      // Remove if already selected
      const newValues = selectedValues.filter((v) => v !== optionValue);
      onChange(newValues);
    } else if (selectedValues.length < maxSelections) {
      // Add if not at max selections
      const newValues = [...selectedValues, optionValue];
      onChange(newValues);
    }

    setSearchQuery("");
    // Keep dropdown open for multi-select
  };

  const handleRemove = (valueToRemove: string) => {
    const newValues = selectedValues.filter((v) => v !== valueToRemove);
    onChange(newValues);
    onBlur();
  };

  const getSelectedLabels = () => {
    return selectedValues.map((value) => {
      const option = normalizedOptions.find((opt) => opt.value === value);
      return option ? option.label : value;
    });
  };

  return (
    <FieldWrapper fieldApi={fieldApi} {...wrapperProps}>
      <div className="space-y-2" ref={containerRef}>
        {wrapperProps.label && maxSelections < Infinity && (
          <div className="text-sm text-muted-foreground">
            ({selectedValues.length}/{maxSelections})
          </div>
        )}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className={cn(
                "w-full justify-start min-h-10 h-auto px-3 py-2",
                getFieldInputClassName(undefined, hasErrors)
              )}
              disabled={isDisabled}
            >
              <div className="flex flex-wrap gap-1 items-center w-full">
                {/* Selected tags */}
                {selectedValues.length > 0 ? (
                  selectedValues.map((value, index) => {
                    const label = getSelectedLabels()[index];
                    return (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="text-xs h-6 px-2 gap-1"
                      >
                        {label}
                        <span
                          className="h-3 w-3 p-0 rounded-sm hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            !isDisabled && handleRemove(value);
                          }}
                        >
                          <X className="h-2 w-2" />
                        </span>
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}

                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command
              filter={(value, search) => {
                const option = displayOptions.find(
                  (opt) => opt.value === value
                );
                return option?.label
                  .toLowerCase()
                  .includes(search.toLowerCase())
                  ? 1
                  : 0;
              }}
            >
              {searchable && (
                <CommandInput
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="h-9"
                />
              )}
              <CommandList>
                <CommandEmpty>{noOptionsText}</CommandEmpty>
                <CommandGroup>
                  {displayOptions.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value);
                    const isDisabledOption =
                      !isSelected && selectedValues.length >= maxSelections;

                    return (
                      <CommandItem
                        key={`${option.value}-${index}`}
                        value={option.value}
                        onSelect={() =>
                          !isDisabledOption && handleSelect(option.value)
                        }
                        className={cn(
                          "flex items-center justify-between",
                          isSelected ? "bg-accent" : "",
                          isDisabledOption
                            ? "opacity-50 cursor-not-allowed"
                            : "",
                          option.isCreateOption
                            ? "font-medium text-primary"
                            : ""
                        )}
                        disabled={isDisabledOption}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </FieldWrapper>
  );
};
