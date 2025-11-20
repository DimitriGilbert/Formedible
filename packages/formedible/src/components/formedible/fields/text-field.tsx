"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn, getFieldInputClassName } from "@/lib/utils";
import type { TextFieldSpecificProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { useFieldState } from "@/hooks/use-field-state";


export const TextField: React.FC<TextFieldSpecificProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  inputClassName,
  labelClassName,
  wrapperClassName,
  type = "text",
  datalist,
}) => {
  const { name, value, isDisabled, hasErrors, onChange: onFieldChange, onBlur } = useFieldState(fieldApi);

  // Datalist state
  const [datalistOptions, setDatalistOptions] = useState<string[]>(
    datalist?.options || []
  );
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  // Debounced async options fetching
  const fetchAsyncOptions = useCallback(
    async (query: string) => {
      if (!datalist?.asyncOptions) return;

      const minChars = datalist.minChars || 1;
      if (query.length < minChars) {
        setDatalistOptions(datalist.options || []);
        return;
      }

      if (query === lastQuery) return;

      setIsLoadingOptions(true);
      setLastQuery(query);

      try {
        const results = await datalist.asyncOptions(query);
        const maxResults = datalist.maxResults || 10;
        const limitedResults = results.slice(0, maxResults);

        // Combine static options with async results
        const staticOptions = datalist.options || [];
        const combinedOptions = [...staticOptions, ...limitedResults];

        // Remove duplicates
        const uniqueOptions = Array.from(new Set(combinedOptions));

        setDatalistOptions(uniqueOptions);
      } catch (error) {
        console.error("Error fetching datalist options:", error);
        // Fallback to static options on error
        setDatalistOptions(datalist.options || []);
      } finally {
        setIsLoadingOptions(false);
      }
    },
    [datalist, lastQuery]
  );

  // Debounced effect for async options
  useEffect(() => {
    if (!datalist?.asyncOptions) return;

    const debounceMs = datalist.debounceMs || 300;
    const currentValue = String(value || "");

    const timeoutId = setTimeout(() => {
      fetchAsyncOptions(currentValue);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, fetchAsyncOptions, datalist]);

  // Generate unique datalist id
  const datalistId = useMemo(
    () => (datalist ? `${name}-datalist` : undefined),
    [name, datalist]
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange(e.target.value);
  };

  const computedInputClassName = getFieldInputClassName(
    inputClassName,
    hasErrors,
    isLoadingOptions ? "pr-8" : ""
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
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          value={value === undefined || value === null ? "" : String(value)}
          onBlur={onBlur}
          onChange={onChange}
          placeholder={placeholder}
          className={computedInputClassName}
          disabled={isDisabled}
          list={datalistId}
          autoComplete={datalist ? "off" : undefined}
        />
        {isLoadingOptions && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <span className="text-xs text-muted-foreground">Loading...</span>
          </div>
        )}
        {datalist && datalistOptions.length > 0 && (
          <datalist id={datalistId}>
            {datalistOptions.map((option, index) => (
              <option key={`${option}-${index}`} value={option} />
            ))}
          </datalist>
        )}
      </div>
    </FieldWrapper>
  );
};
