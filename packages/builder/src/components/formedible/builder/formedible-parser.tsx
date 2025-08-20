"use client";

import type { FieldConfig, PageConfig, ProgressConfig, ObjectConfig } from "@/lib/formedible/types";

// Use actual formedible types - no more duplicated interfaces!
export type ParsedFieldConfig = FieldConfig;

export interface ParsedFormConfig {
  schema?: unknown;
  fields: FieldConfig[];
  pages?: PageConfig[];
  title?: string;
  description?: string;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  formClassName?: string;
  fieldClassName?: string;
  progress?: ProgressConfig;
  formOptions?: {
    defaultValues?: Record<string, unknown>;
    onSubmit?: (data: { value: Record<string, unknown> }) => void | Promise<void>;
  };
}

export interface ParserOptions {
  strictValidation?: boolean;
}

/**
 * FormedibleParser - A safe parser for Formedible form definitions
 * 
 * This parser can handle:
 * - Pure JSON format
 * - JavaScript object literals (unquoted keys)
 * - Zod schema expressions (z.string(), z.number(), etc.)
 * - Nested and chained Zod validations (z.string().min(1).max(50))
 * 
 * Features:
 * - Sanitizes dangerous code patterns
 * - Validates field types and structure
 * - Removes unknown/dangerous keys
 * - Handles balanced parentheses in Zod expressions
 * 
 * Usage:
 *   const parsed = FormedibleParser.parse(codeString);
 * 
 * @version 1.0.0
 * @standalone-ready This class can be extracted to a separate package
 */
export class FormedibleParser {
  // Supported field types in formedible
  private static readonly ALLOWED_FIELD_TYPES = [
    'text', 'email', 'password', 'url', 'tel', 'textarea', 'select', 
    'checkbox', 'switch', 'number', 'date', 'slider', 'file', 'rating',
    'phone', 'colorPicker', 'location', 'duration', 'multiSelect',
    'autocomplete', 'masked', 'object', 'array', 'radio'
  ];

  // Allowed top-level keys in form definitions
  private static readonly ALLOWED_KEYS = [
    'schema', 'fields', 'pages', 'progress', 'submitLabel', 'nextLabel', 
    'previousLabel', 'formClassName', 'fieldClassName', 'formOptions',
    'title', 'description'
  ];

  // Configuration for parser behavior
  private static readonly CONFIG = {
    ZOD_PLACEHOLDER: '__ZOD_SCHEMA__',
    MAX_RECURSION_DEPTH: 10,
    ENABLE_STRICT_VALIDATION: true
  };

  /**
   * Main parser method - parses formedible form definition code
   * @param code - The form definition code (JSON or JS object literal)
   * @param options - Optional parsing configuration
   * @returns Parsed and validated form definition
   */
  static parse(code: string, options?: ParserOptions): ParsedFormConfig {
    if (!code || typeof code !== 'string') {
      throw new Error('Input code must be a non-empty string');
    }

    try {
      // Apply configuration overrides
      if (options?.strictValidation !== undefined) {
        this.CONFIG.ENABLE_STRICT_VALIDATION = options.strictValidation;
      }

      // Remove any potential function calls or dangerous patterns
      const sanitizedCode = this.sanitizeCode(code);
      
      // Parse the JSON-like structure
      const parsed = this.parseObjectLiteral(sanitizedCode);
      
      // Validate and sanitize the parsed object
      return this.validateAndSanitize(parsed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`FormedibleParser: Failed to parse form definition - ${errorMessage}`);
    }
  }

  /**
   * Validates if a field type is supported
   * @param type - The field type to validate
   * @returns True if the field type is valid
   */
  static isValidFieldType(type: string): boolean {
    return this.ALLOWED_FIELD_TYPES.includes(type);
  }

  /**
   * Gets all supported field types
   * @returns Array of supported field types
   */
  static getSupportedFieldTypes(): string[] {
    return [...this.ALLOWED_FIELD_TYPES];
  }

  private static sanitizeCode(code: string): string {
    // Remove comments
    let sanitized = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    
    // Remove any function calls or expressions that could be dangerous
    sanitized = sanitized.replace(/\b(eval|Function|setTimeout|setInterval|require|import)\s*\(/g, '');
    
    // Remove any arrow functions or function expressions
    sanitized = sanitized.replace(/=>\s*{[^}]*}/g, '""');
    sanitized = sanitized.replace(/function\s*\([^)]*\)\s*{[^}]*}/g, '""');
    
    // Replace new Date() calls with ISO string
    sanitized = sanitized.replace(/new\s+Date\(\)\.toISOString\(\)\.split\('[^']*'\)\[0\]/g, '"2024-01-01"');
    sanitized = sanitized.replace(/new\s+Date\(\)/g, '"2024-01-01T00:00:00Z"');
    
    return sanitized;
  }

  private static parseObjectLiteral(code: string): Record<string, unknown> {
    try {
      // First try direct JSON parsing
      return JSON.parse(code);
    } catch (jsonError) {
      // If that fails, try to convert JS object literal to JSON
      let processedCode = code.trim();
      try {
        
        // Replace Zod expressions with placeholder strings - handle nested structures
        processedCode = this.replaceZodExpressions(processedCode);
        
        // Convert unquoted keys to quoted keys
        processedCode = processedCode.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        
        // Remove trailing commas
        processedCode = processedCode.replace(/,(\s*[}\]])/g, '$1');
        
        // Convert single quotes to double quotes
        processedCode = processedCode.replace(/'/g, '"');
        
        return JSON.parse(processedCode);
      } catch (conversionError) {
        console.error('Failed to parse after conversion:', {
          originalCode: code.substring(0, 200),
          processedCode: processedCode.substring(0, 200),
          error: conversionError instanceof Error ? conversionError.message : String(conversionError)
        });
        throw new Error(`Invalid syntax. Please use valid JSON format or JavaScript object literal syntax. Error: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
      }
    }
  }

  private static replaceZodExpressions(code: string): string {
    // Handle nested Zod expressions by finding balanced parentheses
    let result = code;
    let changed = true;
    
    while (changed) {
      changed = false;
      // Match z.method( and find the matching closing parenthesis
      const zodMatch = result.match(/z\.[a-zA-Z]+\(/);
      if (zodMatch) {
        const startIndex = zodMatch.index!;
        const openParenIndex = startIndex + zodMatch[0].length - 1;
        
        // Find the matching closing parenthesis
        let depth = 1;
        let endIndex = openParenIndex + 1;
        
        while (endIndex < result.length && depth > 0) {
          if (result[endIndex] === '(') {
            depth++;
          } else if (result[endIndex] === ')') {
            depth--;
          }
          endIndex++;
        }
        
        if (depth === 0) {
          // Check for chained methods like .min().max()
          let chainEnd = endIndex;
          while (chainEnd < result.length) {
            const chainMatch = result.slice(chainEnd).match(/^\.[a-zA-Z]+\(/);
            if (chainMatch) {
              // Find the closing parenthesis for this chained method
              let chainDepth = 1;
              let chainParenIndex = chainEnd + chainMatch[0].length - 1;
              let chainEndIndex = chainParenIndex + 1;
              
              while (chainEndIndex < result.length && chainDepth > 0) {
                if (result[chainEndIndex] === '(') {
                  chainDepth++;
                } else if (result[chainEndIndex] === ')') {
                  chainDepth--;
                }
                chainEndIndex++;
              }
              
              if (chainDepth === 0) {
                chainEnd = chainEndIndex;
              } else {
                break;
              }
            } else {
              break;
            }
          }
          
          // Replace the entire Zod expression with a placeholder
          result = result.slice(0, startIndex) + `"${this.CONFIG.ZOD_PLACEHOLDER}"` + result.slice(chainEnd);
          changed = true;
        } else {
          // If we can't find matching parentheses, just replace the method name
          result = result.replace(/z\.[a-zA-Z]+/, `"${this.CONFIG.ZOD_PLACEHOLDER}"`);
          changed = true;
        }
      }
    }
    
    // Handle standalone z.enum() calls  
    result = result.replace(/z\.enum\(\[[^\]]*\]\)/g, `"${this.CONFIG.ZOD_PLACEHOLDER}"`);
    
    return result;
  }

  private static validateAndSanitize(obj: Record<string, unknown>): ParsedFormConfig {
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('Definition must be an object');
    }

    const sanitized: ParsedFormConfig = {
      fields: []
    };

    // Validate top-level keys
    for (const [key, value] of Object.entries(obj)) {
      if (!this.ALLOWED_KEYS.includes(key)) {
        continue; // Skip unknown keys
      }

      switch (key) {
        case 'schema':
          // Pass through the schema - it's needed for object field validation
          sanitized.schema = value;
          break;
        case 'fields':
          sanitized.fields = this.validateFields(value);
          break;
        case 'pages':
          if (Array.isArray(value)) {
            sanitized.pages = value;
          }
          break;
        case 'title':
          if (typeof value === 'string') {
            sanitized.title = value;
          }
          break;
        case 'description':
          if (typeof value === 'string') {
            sanitized.description = value;
          }
          break;
        case 'submitLabel':
          if (typeof value === 'string') {
            sanitized.submitLabel = value;
          }
          break;
        case 'nextLabel':
          if (typeof value === 'string') {
            sanitized.nextLabel = value;
          }
          break;
        case 'previousLabel':
          if (typeof value === 'string') {
            sanitized.previousLabel = value;
          }
          break;
        case 'formClassName':
          if (typeof value === 'string') {
            sanitized.formClassName = value;
          }
          break;
        case 'fieldClassName':
          if (typeof value === 'string') {
            sanitized.fieldClassName = value;
          }
          break;
        case 'progress':
          sanitized.progress = value as ParsedFormConfig['progress'];
          break;
        case 'formOptions':
          sanitized.formOptions = value as ParsedFormConfig['formOptions'];
          break;
      }
    }

    return sanitized;
  }

  private static validateFields(fields: unknown): ParsedFieldConfig[] {
    if (!Array.isArray(fields)) {
      throw new Error('Fields must be an array');
    }

    return fields.map((field, index): ParsedFieldConfig => {
      if (typeof field !== 'object' || field === null) {
        throw new Error(`Field at index ${index} must be an object`);
      }

      const fieldObj = field as Record<string, unknown>;

      // Ensure required fields
      if (!fieldObj.name || !fieldObj.type) {
        throw new Error(`Field at index ${index} must have 'name' and 'type' properties`);
      }

      if (typeof fieldObj.name !== 'string' || typeof fieldObj.type !== 'string') {
        throw new Error(`Field at index ${index} must have string 'name' and 'type' properties`);
      }

      if (!this.ALLOWED_FIELD_TYPES.includes(fieldObj.type)) {
        throw new Error(`Field at index ${index} has invalid type '${fieldObj.type}'`);
      }

      // Build properly typed field config
      const validatedField: ParsedFieldConfig = {
        name: fieldObj.name,
        type: fieldObj.type,
      };

      // Add optional properties with proper type checks
      if (fieldObj.label && typeof fieldObj.label === 'string') {
        validatedField.label = fieldObj.label;
      }
      if (fieldObj.placeholder && typeof fieldObj.placeholder === 'string') {
        validatedField.placeholder = fieldObj.placeholder;
      }
      if (fieldObj.description && typeof fieldObj.description === 'string') {
        validatedField.description = fieldObj.description;
      }
      if (typeof fieldObj.required === 'boolean') {
        validatedField.required = fieldObj.required;
      }
      if (fieldObj.defaultValue !== undefined) {
        validatedField.defaultValue = fieldObj.defaultValue;
      }
      if (typeof fieldObj.min === 'number') {
        validatedField.min = fieldObj.min;
      }
      if (typeof fieldObj.max === 'number') {
        validatedField.max = fieldObj.max;
      }
      if (typeof fieldObj.step === 'number') {
        validatedField.step = fieldObj.step;
      }
      // Handle required field
      if (typeof fieldObj.required === 'boolean') {
        validatedField.required = fieldObj.required;
      }

      // Handle array config
      if (fieldObj.arrayConfig && typeof fieldObj.arrayConfig === 'object') {
        validatedField.arrayConfig = fieldObj.arrayConfig as ParsedFieldConfig['arrayConfig'];
      }

      // Handle object config with nested field validation
      if (fieldObj.objectConfig && typeof fieldObj.objectConfig === 'object') {
        const objectConfig = fieldObj.objectConfig as Record<string, unknown>;
        
        const parsedObjectConfig: ObjectConfig = {
          fields: objectConfig.fields ? this.validateFields(objectConfig.fields).map(field => ({
            name: field.name,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            description: field.description,
            options: field.options,
            min: field.min,
            max: field.max,
            step: field.step,
          })) : [],
        };

        if (objectConfig.title && typeof objectConfig.title === 'string') {
          parsedObjectConfig.title = objectConfig.title;
        }
        if (objectConfig.description && typeof objectConfig.description === 'string') {
          parsedObjectConfig.description = objectConfig.description;
        }
        if (typeof objectConfig.collapsible === 'boolean') {
          parsedObjectConfig.collapsible = objectConfig.collapsible;
        }
        if (typeof objectConfig.defaultExpanded === 'boolean') {
          parsedObjectConfig.defaultExpanded = objectConfig.defaultExpanded;
        }
        if (typeof objectConfig.showCard === 'boolean') {
          parsedObjectConfig.showCard = objectConfig.showCard;
        }
        if (objectConfig.layout && ['vertical', 'horizontal', 'grid'].includes(objectConfig.layout as string)) {
          parsedObjectConfig.layout = objectConfig.layout as 'vertical' | 'horizontal' | 'grid';
        }
        if (typeof objectConfig.columns === 'number') {
          parsedObjectConfig.columns = objectConfig.columns;
        }
        if (objectConfig.collapseLabel && typeof objectConfig.collapseLabel === 'string') {
          parsedObjectConfig.collapseLabel = objectConfig.collapseLabel;
        }
        if (objectConfig.expandLabel && typeof objectConfig.expandLabel === 'string') {
          parsedObjectConfig.expandLabel = objectConfig.expandLabel;
        }

        validatedField.objectConfig = parsedObjectConfig;
      }

      // Handle options array
      if (fieldObj.options && Array.isArray(fieldObj.options)) {
        validatedField.options = fieldObj.options.filter(option => 
          typeof option === 'object' && option !== null &&
          typeof (option as any).value === 'string' &&
          typeof (option as any).label === 'string'
        ).map(option => ({
          value: (option as any).value,
          label: (option as any).label
        }));
      }

      // Pass through other configs with proper type handling
      if (fieldObj.validation !== undefined && fieldObj.validation !== null && typeof fieldObj.validation === 'object') {
        validatedField.validation = fieldObj.validation as any; // Complex Zod schema handling
      }
      if (fieldObj.multiSelectConfig !== undefined && fieldObj.multiSelectConfig !== null && typeof fieldObj.multiSelectConfig === 'object') {
        validatedField.multiSelectConfig = fieldObj.multiSelectConfig as any;
      }
      if (fieldObj.colorConfig !== undefined && fieldObj.colorConfig !== null && typeof fieldObj.colorConfig === 'object') {
        validatedField.colorConfig = fieldObj.colorConfig as any;
      }
      if (fieldObj.ratingConfig !== undefined && fieldObj.ratingConfig !== null && typeof fieldObj.ratingConfig === 'object') {
        validatedField.ratingConfig = fieldObj.ratingConfig as any;
      }
      if (fieldObj.phoneConfig !== undefined && fieldObj.phoneConfig !== null && typeof fieldObj.phoneConfig === 'object') {
        validatedField.phoneConfig = fieldObj.phoneConfig as any;
      }
      if (fieldObj.datalist !== undefined && fieldObj.datalist !== null && typeof fieldObj.datalist === 'object') {
        validatedField.datalist = fieldObj.datalist as any;
      }

      return validatedField;
    });
  }
}