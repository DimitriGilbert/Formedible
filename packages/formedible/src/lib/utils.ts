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