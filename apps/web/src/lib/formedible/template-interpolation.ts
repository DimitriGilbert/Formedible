/**
 * Template interpolation utilities for dynamic form titles, labels, and descriptions
 * Supports {{fieldName}}, {{fieldName.property}}, {{fieldName[index]}}, and {{fieldName|formatter}} syntax
 */

// Supported formatters for template interpolation
export type TemplateFormatter = 
  | 'uppercase' 
  | 'lowercase' 
  | 'capitalize' 
  | 'titlecase'
  | 'pluralize'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'datetime';

// Configuration for formatters
export interface FormatterConfig {
  currency?: {
    currency?: string;
    locale?: string;
  };
  date?: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
  };
  pluralize?: {
    singular?: string;
    plural?: string;
  };
}

// Template interpolation options
export interface TemplateOptions {
  formatters?: FormatterConfig;
  fallbackValue?: string;
  strict?: boolean; // If true, throw errors for missing values
}

/**
 * Extract field dependencies from a template string
 * @param template Template string with {{fieldName}} syntax
 * @returns Array of field names that the template depends on
 */
export function extractTemplateDependencies(template: string): string[] {
  const regex = /\{\{([^}|]+)(?:\|[^}]+)?\}\}/g;
  const dependencies = new Set<string>();
  let match;

  while ((match = regex.exec(template)) !== null) {
    const fieldPath = match[1].trim();
    // Extract root field name (before dots or brackets)
    const rootField = fieldPath.split(/[.\[]/, 1)[0];
    if (rootField) {
      dependencies.add(rootField);
    }
  }

  return Array.from(dependencies);
}

/**
 * Get nested value from an object using dot notation or bracket notation
 * @param obj Source object
 * @param path Path string like "user.name" or "items[0].title"
 * @returns The value at the path or undefined
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  try {
    // Handle array indexing and property access
    const keys = path.split(/[.\[]/).map(key => key.replace(/\]$/, ''));
    let current: any = obj;

    for (const key of keys) {
      if (current == null) return undefined;
      
      // Handle numeric array indices
      if (/^\d+$/.test(key)) {
        current = current[parseInt(key, 10)];
      } else if (key) {
        current = current[key];
      }
    }

    return current;
  } catch {
    return undefined;
  }
}

/**
 * Apply formatter to a value
 * @param value The value to format
 * @param formatter The formatter name
 * @param config Optional formatter configuration
 * @returns Formatted value
 */
function applyFormatter(
  value: unknown, 
  formatter: string, 
  config?: FormatterConfig
): string {
  if (value == null) return '';
  
  const stringValue = String(value);

  switch (formatter) {
    case 'uppercase':
      return stringValue.toUpperCase();
      
    case 'lowercase':
      return stringValue.toLowerCase();
      
    case 'capitalize':
      return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
      
    case 'titlecase':
      return stringValue.replace(/\w\S*/g, (txt: string) => 
        txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
      );
      
    case 'pluralize':
      const num = typeof value === 'number' ? value : parseInt(stringValue, 10);
      if (isNaN(num)) return stringValue;
      
      const { singular = '', plural = stringValue + 's' } = config?.pluralize || {};
      return num === 1 ? singular || stringValue : plural;
      
    case 'number':
      const numValue = typeof value === 'number' ? value : parseFloat(stringValue);
      return isNaN(numValue) ? stringValue : numValue.toLocaleString();
      
    case 'currency':
      const currencyValue = typeof value === 'number' ? value : parseFloat(stringValue);
      if (isNaN(currencyValue)) return stringValue;
      
      const { currency = 'USD', locale = 'en-US' } = config?.currency || {};
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(currencyValue);
      
    case 'date':
      const dateValue = value instanceof Date ? value : new Date(stringValue);
      if (isNaN(dateValue.getTime())) return stringValue;
      
      const { locale: dateLocale = 'en-US', format = 'medium' } = config?.date || {};
      const formatOptions: Intl.DateTimeFormatOptions = {
        short: { dateStyle: 'short' as const },
        medium: { dateStyle: 'medium' as const },
        long: { dateStyle: 'long' as const },
        full: { dateStyle: 'full' as const },
      }[format] || { dateStyle: 'medium' as const };
      
      return new Intl.DateTimeFormat(dateLocale, formatOptions).format(dateValue);
      
    case 'time':
      const timeValue = value instanceof Date ? value : new Date(stringValue);
      if (isNaN(timeValue.getTime())) return stringValue;
      
      return timeValue.toLocaleTimeString();
      
    case 'datetime':
      const datetimeValue = value instanceof Date ? value : new Date(stringValue);
      if (isNaN(datetimeValue.getTime())) return stringValue;
      
      return datetimeValue.toLocaleString();
      
    default:
      return stringValue;
  }
}

/**
 * Interpolate template string with form values
 * @param template Template string with {{fieldName}} syntax
 * @param values Form values object
 * @param options Template interpolation options
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, unknown>,
  options: TemplateOptions = {}
): string {
  const { formatters, fallbackValue = '', strict = false } = options;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, content) => {
    try {
      const trimmedContent = content.trim();
      
      // Split by pipe to separate field path from formatter
      const [fieldPath, formatterName] = trimmedContent.split('|').map((s: string) => s.trim());
      
      // Get the value from the form values
      const value = getNestedValue(values, fieldPath);
      
      if (value == null) {
        if (strict) {
          throw new Error(`Template field '${fieldPath}' not found in form values`);
        }
        return fallbackValue;
      }
      
      // Apply formatter if specified
      if (formatterName) {
        return applyFormatter(value, formatterName, formatters);
      }
      
      return String(value);
    } catch (error) {
      if (strict) {
        throw error;
      }
      console.warn(`Template interpolation error for '${match}':`, error);
      return fallbackValue;
    }
  });
}

/**
 * Check if a string contains template syntax
 * @param str String to check
 * @returns True if string contains {{}} template syntax
 */
export function isTemplate(str: string): boolean {
  return /\{\{[^}]+\}\}/.test(str);
}

/**
 * Resolve a dynamic text value (string or function) to a string
 * @param value String template or function that returns string
 * @param formValues Current form values
 * @param options Template interpolation options
 * @returns Resolved string value
 */
export function resolveDynamicText(
  value: string | ((values: Record<string, unknown>) => string) | undefined,
  formValues: Record<string, unknown>,
  options?: TemplateOptions
): string | undefined {
  if (!value) return undefined;
  
  if (typeof value === 'function') {
    try {
      return value(formValues);
    } catch (error) {
      console.warn('Error executing dynamic text function:', error);
      return options?.fallbackValue || '';
    }
  }
  
  if (typeof value === 'string') {
    if (isTemplate(value)) {
      return interpolateTemplate(value, formValues, options);
    }
    return value;
  }
  
  return undefined;
}

/**
 * Get all field dependencies for a dynamic text value
 * @param value String template or function
 * @returns Array of field names that this value depends on
 */
export function getDynamicTextDependencies(
  value: string | ((values: Record<string, unknown>) => string) | undefined
): string[] {
  if (!value) return [];
  
  if (typeof value === 'string' && isTemplate(value)) {
    return extractTemplateDependencies(value);
  }
  
  // For functions, we can't easily determine dependencies
  // Return empty array and rely on broader form subscription
  return [];
}