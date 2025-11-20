import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface NormalizedOption {
  value: string;
  label: string;
}

export function normalizeOptions(
  options: (string | NormalizedOption)[]
): NormalizedOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );
}

/**
 * Utility to generate input className with error styling
 * @param baseClassName - Base className(s) for the input
 * @param hasErrors - Whether the field has validation errors
 * @param additionalClassNames - Additional className(s) to merge
 * @returns Combined className string with error styling applied
 */
export function getFieldInputClassName(
  baseClassName?: string,
  hasErrors?: boolean,
  ...additionalClassNames: (string | undefined)[]
): string {
  return cn(
    baseClassName,
    hasErrors ? "border-destructive" : "",
    ...additionalClassNames
  );
}