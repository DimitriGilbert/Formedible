"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X, ChevronDown, Check } from "lucide-react";
import type { MultiComboboxFieldSpecificProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";

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

  const selectedValues = Array.isArray(fieldApi.state?.value)
    ? fieldApi.state?.value
    : [];

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter(
    (option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add create option if enabled and query doesn't match existing options
  const canCreate =
    creatable &&
    searchQuery.trim() &&
    !normalizedOptions.some(
      (opt) =>
        opt.value.toLowerCase() === searchQuery.toLowerCase() ||
        opt.label.toLowerCase() === searchQuery.toLowerCase()
    ) &&
    !selectedValues.includes(searchQuery.trim());

  type DisplayOption = { value: string; label: string; isCreateOption?: boolean };
  
  const displayOptions: DisplayOption[] = [...filteredOptions];
  if (canCreate) {
    displayOptions.unshift({
      value: searchQuery.trim(),
      label: `Create "${searchQuery.trim()}"`,
      isCreateOption: true,
    });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      // Remove if already selected
      const newValues = selectedValues.filter((v) => v !== optionValue);
      fieldApi.handleChange(newValues);
    } else if (selectedValues.length < maxSelections) {
      // Add if not at max selections
      const newValues = [...selectedValues, optionValue];
      fieldApi.handleChange(newValues);
    }

    setSearchQuery("");
    // Keep dropdown open for multi-select
  };

  const handleRemove = (valueToRemove: string) => {
    const newValues = selectedValues.filter((v) => v !== valueToRemove);
    fieldApi.handleChange(newValues);
    fieldApi.handleBlur();
  };

  const getSelectedLabels = () => {
    return selectedValues.map((value) => {
      const option = normalizedOptions.find((opt) => opt.value === value);
      return option ? option.label : value;
    });
  };

  const isDisabled = fieldApi.form?.state?.isSubmitting ?? false;

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
                fieldApi.state?.meta?.errors.length ? "border-destructive" : ""
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
                        <button
                          type="button"
                          className="h-3 w-3 p-0 rounded-sm hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(value);
                          }}
                          disabled={isDisabled}
                        >
                          <X className="h-2 w-2" />
                        </button>
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
            <Command>
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
                        onSelect={() => !isDisabledOption && handleSelect(option.value)}
                        className={cn(
                          "flex items-center justify-between",
                          isSelected ? "bg-accent" : "",
                          isDisabledOption ? "opacity-50 cursor-not-allowed" : "",
                          option.isCreateOption ? "font-medium text-primary" : ""
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