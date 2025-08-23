"use client";

import type { 
  ParsedFieldConfig, 
  ParsedFormConfig, 
  ParserOptions, 
  ObjectConfig,
  ParserError,
  PageConfig
} from './types';

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
 * - Supports all 24 field types
 * - 100% backward compatibility with existing parser
 * 
 * Usage:
 *   const parsed = FormedibleParser.parse(codeString);
 * 
 * @version 2.0.0
 * @standalone-ready This class is designed as a standalone package
 */
export class FormedibleParser {
  // All 24 supported field types in formedible
  private static readonly ALLOWED_FIELD_TYPES = [
    'text', 'email', 'password', 'url', 'tel', 'textarea', 'select', 
    'checkbox', 'switch', 'number', 'date', 'slider', 'file', 'rating',
    'phone', 'colorPicker', 'location', 'duration', 'multiSelect',
    'autocomplete', 'masked', 'object', 'array', 'radio'
  ] as const;

  // Allowed top-level keys in form definitions
  private static readonly ALLOWED_KEYS = [
    'schema', 'fields', 'pages', 'progress', 'submitLabel', 'nextLabel', 
    'previousLabel', 'formClassName', 'fieldClassName', 'formOptions',
    'title', 'description'
  ] as const;

  // Configuration for parser behavior
  private static CONFIG = {
    ZOD_PLACEHOLDER: '__ZOD_SCHEMA__',
    MAX_RECURSION_DEPTH: 10,
    ENABLE_STRICT_VALIDATION: true,
    MAX_CODE_LENGTH: 1000000, // 1MB limit
    MAX_NESTING_DEPTH: 50
  };

  /**
   * Main parser method - parses formedible form definition code
   * @param code - The form definition code (JSON or JS object literal)
   * @param options - Optional parsing configuration
   * @returns Parsed and validated form definition
   * @throws {ParserError} When parsing fails with detailed error information
   */
  static parse(code: string, options?: ParserOptions): ParsedFormConfig {
    if (!code || typeof code !== 'string') {
      throw this.createParserError('Input code must be a non-empty string', 'INVALID_INPUT');
    }

    if (code.length > this.CONFIG.MAX_CODE_LENGTH) {
      throw this.createParserError(
        `Code length exceeds maximum allowed size of ${this.CONFIG.MAX_CODE_LENGTH} characters`,
        'CODE_TOO_LARGE'
      );
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
      if (error instanceof Error && error.name === 'ParserError') {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw this.createParserError(
        `Failed to parse form definition - ${errorMessage}`,
        'PARSE_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Validates if a field type is supported
   * @param type - The field type to validate
   * @returns True if the field type is valid
   */
  static isValidFieldType(type: string): boolean {
    return this.ALLOWED_FIELD_TYPES.includes(type as any);
  }

  /**
   * Gets all supported field types
   * @returns Array of supported field types
   */
  static getSupportedFieldTypes(): readonly string[] {
    return [...this.ALLOWED_FIELD_TYPES];
  }

  /**
   * Validates a form configuration without parsing code
   * @param config - The form configuration to validate
   * @returns Validation result with errors if any
   */
  static validateConfig(config: unknown): { isValid: boolean; errors: string[] } {
    try {
      this.validateAndSanitize(config as Record<string, unknown>);
      return { isValid: true, errors: [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { isValid: false, errors: [errorMessage] };
    }
  }

  /**
   * Creates a standardized parser error with additional metadata
   * @private
   */
  private static createParserError(
    message: string, 
    code: string, 
    metadata?: Record<string, unknown>
  ): ParserError {
    const error = new Error(message) as ParserError;
    error.name = 'ParserError';
    error.code = code;
    
    if (metadata) {
      Object.assign(error, metadata);
    }
    
    return error;
  }

  /**
   * Enhanced code sanitization with better security measures
   * @private
   */
  private static sanitizeCode(code: string): string {
    // Remove comments first
    let sanitized = code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
      .replace(/\/\/.*$/gm, ''); // Line comments
    
    // Remove dangerous patterns more aggressively
    const dangerousPatterns = [
      /\b(eval|Function|setTimeout|setInterval|require|import)\s*\(/g,
      /\b(document|window|global|process)\b/g,
      /\b__proto__\b/g,
      /\bconstructor\b/g,
      /\bprototype\b/g
    ];
    
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '""');
    });
    
    // Remove any arrow functions or function expressions more thoroughly
    sanitized = sanitized.replace(/=>\s*[\{]?[^}]*[\}]?/g, '""');
    sanitized = sanitized.replace(/function\s*\([^)]*\)\s*{[^}]*}/g, '""');
    
    // Handle Date objects more safely
    sanitized = sanitized.replace(
      /new\s+Date\(\)\.toISOString\(\)\.split\('[^']*'\)\[0\]/g, 
      '"2024-01-01"'
    );
    sanitized = sanitized.replace(/new\s+Date\(\)/g, '"2024-01-01T00:00:00Z"');
    
    // Remove any remaining 'new' keyword usage
    sanitized = sanitized.replace(/\bnew\s+\w+\(/g, '""');
    
    return sanitized;
  }

  /**
   * Enhanced object literal parsing with better error handling
   * @private
   */
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
        
        // Convert unquoted keys to quoted keys with better regex
        processedCode = processedCode.replace(
          /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, 
          '$1"$2":'
        );
        
        // Remove trailing commas more thoroughly
        processedCode = processedCode.replace(/,(\s*[}\]])/g, '$1');
        
        // Convert single quotes to double quotes (but preserve escaped quotes)
        processedCode = processedCode.replace(/(?<!\\)'/g, '"');
        
        // Handle undefined values
        processedCode = processedCode.replace(/:\s*undefined/g, ': null');
        
        const result = JSON.parse(processedCode);
        return result;
      } catch (conversionError) {
        // Enhanced error reporting
        const originalPreview = code.substring(0, 200) + (code.length > 200 ? '...' : '');
        const processedPreview = processedCode.substring(0, 200) + (processedCode.length > 200 ? '...' : '');
        
        throw this.createParserError(
          `Invalid syntax. Please use valid JSON format or JavaScript object literal syntax.`,
          'SYNTAX_ERROR',
          {
            originalCode: originalPreview,
            processedCode: processedPreview,
            jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
            conversionError: conversionError instanceof Error ? conversionError.message : String(conversionError)
          }
        );
      }
    }
  }

  /**
   * Enhanced Zod expression replacement with better handling of complex expressions
   * @private
   */
  private static replaceZodExpressions(code: string): string {
    let result = code;
    let changed = true;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops
    
    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;
      
      // Match z.method( and find the matching closing parenthesis
      const zodMatch = result.match(/z\.[a-zA-Z]+\(/);
      if (zodMatch) {
        const startIndex = zodMatch.index!;
        const openParenIndex = startIndex + zodMatch[0].length - 1;
        
        // Find the matching closing parenthesis with better depth tracking
        let depth = 1;
        let endIndex = openParenIndex + 1;
        let stringChar: string | null = null;
        let escaped = false;
        
        while (endIndex < result.length && depth > 0) {
          const char = result[endIndex];
          
          // Handle string literals to avoid counting parentheses inside strings
          if (!escaped && (char === '"' || char === "'")) {
            if (!stringChar) {
              stringChar = char;
            } else if (stringChar === char) {
              stringChar = null;
            }
          } else if (!stringChar) {
            if (char === '(') {
              depth++;
            } else if (char === ')') {
              depth--;
            }
          }
          
          escaped = char === '\\' && !escaped;
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
              let chainStringChar: string | null = null;
              let chainEscaped = false;
              
              while (chainEndIndex < result.length && chainDepth > 0) {
                const char = result[chainEndIndex];
                
                if (!chainEscaped && (char === '"' || char === "'")) {
                  if (!chainStringChar) {
                    chainStringChar = char;
                  } else if (chainStringChar === char) {
                    chainStringChar = null;
                  }
                } else if (!chainStringChar) {
                  if (char === '(') {
                    chainDepth++;
                  } else if (char === ')') {
                    chainDepth--;
                  }
                }
                
                chainEscaped = char === '\\' && !chainEscaped;
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
    
    // Handle standalone z.enum() calls and other complex patterns
    result = result.replace(/z\.enum\(\[[^\]]*\]\)/g, `"${this.CONFIG.ZOD_PLACEHOLDER}"`);
    result = result.replace(/z\.\w+/g, `"${this.CONFIG.ZOD_PLACEHOLDER}"`);
    
    return result;
  }

  /**
   * Enhanced validation and sanitization with comprehensive field type support
   * @private
   */
  private static validateAndSanitize(obj: Record<string, unknown>): ParsedFormConfig {
    if (typeof obj !== 'object' || obj === null) {
      throw this.createParserError('Definition must be an object', 'INVALID_DEFINITION');
    }

    const sanitized: ParsedFormConfig = {
      fields: []
    };

    // Validate top-level keys
    for (const [key, value] of Object.entries(obj)) {
      if (!this.ALLOWED_KEYS.includes(key as any)) {
        if (this.CONFIG.ENABLE_STRICT_VALIDATION) {
          console.warn(`Unknown key '${key}' found in form definition, skipping`);
        }
        continue; // Skip unknown keys
      }

      switch (key) {
        case 'schema':
          // Pass through the schema - it's needed for validation
          sanitized.schema = value;
          break;
          
        case 'fields':
          if (!Array.isArray(value)) {
            throw this.createParserError('Fields must be an array', 'INVALID_FIELDS');
          }
          sanitized.fields = this.validateFields(value);
          break;
          
        case 'pages':
          if (Array.isArray(value)) {
            sanitized.pages = value.map((page, index) => this.validatePage(page, index));
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
          if (value && typeof value === 'object') {
            sanitized.progress = value as ParsedFormConfig['progress'];
          }
          break;
          
        case 'formOptions':
          if (value && typeof value === 'object') {
            sanitized.formOptions = value as ParsedFormConfig['formOptions'];
          }
          break;
      }
    }

    return sanitized;
  }

  /**
   * Enhanced field validation with support for all 24 field types
   * @private
   */
  private static validateFields(fields: unknown[]): ParsedFieldConfig[] {
    return fields.map((field, index): ParsedFieldConfig => {
      if (typeof field !== 'object' || field === null) {
        throw this.createParserError(
          `Field at index ${index} must be an object`,
          'INVALID_FIELD',
          { fieldIndex: index }
        );
      }

      const fieldObj = field as Record<string, unknown>;

      // Ensure required fields
      if (!fieldObj.name || !fieldObj.type) {
        throw this.createParserError(
          `Field at index ${index} must have 'name' and 'type' properties`,
          'MISSING_REQUIRED_FIELD',
          { fieldIndex: index }
        );
      }

      if (typeof fieldObj.name !== 'string' || typeof fieldObj.type !== 'string') {
        throw this.createParserError(
          `Field at index ${index} must have string 'name' and 'type' properties`,
          'INVALID_FIELD_TYPE',
          { fieldIndex: index }
        );
      }

      if (!this.ALLOWED_FIELD_TYPES.includes(fieldObj.type as any)) {
        throw this.createParserError(
          `Field at index ${index} has invalid type '${fieldObj.type}'. Supported types: ${this.ALLOWED_FIELD_TYPES.join(', ')}`,
          'UNSUPPORTED_FIELD_TYPE',
          { fieldIndex: index, fieldType: fieldObj.type }
        );
      }

      // Build properly typed field config
      const validatedField: ParsedFieldConfig = {
        name: fieldObj.name,
        type: fieldObj.type,
      };

      // Add optional properties with proper type checks
      this.addOptionalStringProperty(validatedField, fieldObj, 'label');
      this.addOptionalStringProperty(validatedField, fieldObj, 'placeholder');
      this.addOptionalStringProperty(validatedField, fieldObj, 'description');
      
      if (typeof fieldObj.required === 'boolean') {
        validatedField.required = fieldObj.required;
      }
      
      if (fieldObj.defaultValue !== undefined) {
        validatedField.defaultValue = fieldObj.defaultValue;
      }
      
      // Numeric properties
      this.addOptionalNumberProperty(validatedField, fieldObj, 'min');
      this.addOptionalNumberProperty(validatedField, fieldObj, 'max');
      this.addOptionalNumberProperty(validatedField, fieldObj, 'step');

      // Handle complex configurations for different field types
      this.addFieldSpecificConfigurations(validatedField, fieldObj, index);

      // Handle options array
      if (fieldObj.options && Array.isArray(fieldObj.options)) {
        validatedField.options = this.validateOptions(fieldObj.options);
      }

      // Pass through validation configuration
      if (fieldObj.validation !== undefined && fieldObj.validation !== null) {
        validatedField.validation = fieldObj.validation;
      }

      return validatedField;
    });
  }

  /**
   * Adds field-specific configurations based on field type
   * @private
   */
  private static addFieldSpecificConfigurations(
    validatedField: ParsedFieldConfig,
    fieldObj: Record<string, unknown>,
    index: number
  ): void {
    const fieldType = validatedField.type;

    // Array field configuration
    if (fieldType === 'array' && fieldObj.arrayConfig) {
      validatedField.arrayConfig = this.validateArrayConfig(fieldObj.arrayConfig, index);
    }

    // Object field configuration
    if (fieldType === 'object' && fieldObj.objectConfig) {
      validatedField.objectConfig = this.validateObjectConfig(fieldObj.objectConfig, index);
    }

    // Multi-select configuration
    if (fieldType === 'multiSelect' && fieldObj.multiSelectConfig) {
      validatedField.multiSelectConfig = this.validateMultiSelectConfig(fieldObj.multiSelectConfig);
    }

    // Color picker configuration
    if (fieldType === 'colorPicker' && fieldObj.colorConfig) {
      validatedField.colorConfig = this.validateColorConfig(fieldObj.colorConfig);
    }

    // Rating configuration
    if (fieldType === 'rating' && fieldObj.ratingConfig) {
      validatedField.ratingConfig = this.validateRatingConfig(fieldObj.ratingConfig);
    }

    // Phone configuration
    if (fieldType === 'phone' && fieldObj.phoneConfig) {
      validatedField.phoneConfig = this.validatePhoneConfig(fieldObj.phoneConfig);
    }

    // Datalist configuration
    if (fieldObj.datalist) {
      validatedField.datalist = this.validateDatalistConfig(fieldObj.datalist);
    }

    // Pass through other configurations with validation
    const configKeys = [
      'sliderConfig', 'fileConfig', 'locationConfig', 'durationConfig',
      'autocompleteConfig', 'maskedConfig', 'dateConfig', 'textareaConfig',
      'passwordConfig', 'emailConfig', 'numberConfig'
    ];

    configKeys.forEach(configKey => {
      if (fieldObj[configKey] && typeof fieldObj[configKey] === 'object') {
        (validatedField as any)[configKey] = fieldObj[configKey];
      }
    });
  }

  /**
   * Helper methods for adding optional properties
   * @private
   */
  private static addOptionalStringProperty(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    key: string
  ): void {
    if (source[key] && typeof source[key] === 'string') {
      target[key] = source[key];
    }
  }

  private static addOptionalNumberProperty(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    key: string
  ): void {
    if (typeof source[key] === 'number') {
      target[key] = source[key];
    }
  }

  /**
   * Configuration validators
   * @private
   */
  private static validateArrayConfig(config: unknown, fieldIndex: number): ParsedFieldConfig['arrayConfig'] {
    if (typeof config !== 'object' || !config) {
      throw this.createParserError(
        `Array config at field index ${fieldIndex} must be an object`,
        'INVALID_ARRAY_CONFIG'
      );
    }

    const arrayConfig = config as Record<string, unknown>;
    const validated: ParsedFieldConfig['arrayConfig'] = {
      itemType: 'text'
    };

    if (arrayConfig.itemType && typeof arrayConfig.itemType === 'string') {
      validated.itemType = arrayConfig.itemType;
    }

    // Add other array config properties
    ['itemLabel', 'itemPlaceholder', 'addButtonLabel', 'removeButtonLabel'].forEach(key => {
      if (arrayConfig[key] && typeof arrayConfig[key] === 'string') {
        (validated as any)[key] = arrayConfig[key];
      }
    });

    ['minItems', 'maxItems'].forEach(key => {
      if (typeof arrayConfig[key] === 'number') {
        (validated as any)[key] = arrayConfig[key];
      }
    });

    if (typeof arrayConfig.sortable === 'boolean') {
      validated.sortable = arrayConfig.sortable;
    }

    if (arrayConfig.objectConfig) {
      validated.objectConfig = this.validateObjectConfig(arrayConfig.objectConfig, fieldIndex);
    }

    return validated;
  }

  private static validateObjectConfig(config: unknown, fieldIndex: number): ObjectConfig {
    if (typeof config !== 'object' || !config) {
      throw this.createParserError(
        `Object config at field index ${fieldIndex} must be an object`,
        'INVALID_OBJECT_CONFIG'
      );
    }

    const objectConfig = config as Record<string, unknown>;
    const validated: ObjectConfig = {
      fields: []
    };

    if (objectConfig.fields && Array.isArray(objectConfig.fields)) {
      validated.fields = objectConfig.fields.map(field => {
        if (typeof field !== 'object' || !field) {
          return { name: '', type: 'text' };
        }
        const f = field as Record<string, unknown>;
        const validatedField: ObjectConfig['fields'][0] = {
          name: typeof f.name === 'string' ? f.name : '',
          type: typeof f.type === 'string' ? f.type : 'text',
        };
        
        if (typeof f.label === 'string') validatedField.label = f.label;
        if (typeof f.placeholder === 'string') validatedField.placeholder = f.placeholder;
        if (typeof f.description === 'string') validatedField.description = f.description;
        if (typeof f.min === 'number') validatedField.min = f.min;
        if (typeof f.max === 'number') validatedField.max = f.max;
        if (typeof f.step === 'number') validatedField.step = f.step;
        
        if (f.options && (Array.isArray(f.options) || typeof f.options === 'function')) {
          validatedField.options = f.options as ObjectConfig['fields'][0]['options'];
        }
        
        return validatedField;
      });
    }

    // Add other object config properties
    ['title', 'description', 'collapseLabel', 'expandLabel'].forEach(key => {
      if (objectConfig[key] && typeof objectConfig[key] === 'string') {
        (validated as any)[key] = objectConfig[key];
      }
    });

    ['collapsible', 'defaultExpanded', 'showCard'].forEach(key => {
      if (typeof objectConfig[key] === 'boolean') {
        (validated as any)[key] = objectConfig[key];
      }
    });

    if (objectConfig.layout && ['vertical', 'horizontal', 'grid'].includes(objectConfig.layout as string)) {
      validated.layout = objectConfig.layout as ObjectConfig['layout'];
    }

    if (typeof objectConfig.columns === 'number') {
      validated.columns = objectConfig.columns;
    }

    return validated;
  }

  private static validateMultiSelectConfig(config: unknown): ParsedFieldConfig['multiSelectConfig'] {
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const multiSelectConfig = config as Record<string, unknown>;
    const validated: NonNullable<ParsedFieldConfig['multiSelectConfig']> = {};

    if (typeof multiSelectConfig.maxSelections === 'number') {
      validated.maxSelections = multiSelectConfig.maxSelections;
    }

    ['searchable', 'creatable'].forEach(key => {
      if (typeof multiSelectConfig[key] === 'boolean') {
        (validated as any)[key] = multiSelectConfig[key];
      }
    });

    ['placeholder', 'noOptionsText', 'loadingText'].forEach(key => {
      if (multiSelectConfig[key] && typeof multiSelectConfig[key] === 'string') {
        (validated as any)[key] = multiSelectConfig[key];
      }
    });

    return validated;
  }

  private static validateColorConfig(config: unknown): ParsedFieldConfig['colorConfig'] {
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const colorConfig = config as Record<string, unknown>;
    const validated: NonNullable<ParsedFieldConfig['colorConfig']> = {};

    if (colorConfig.format && ['hex', 'rgb', 'hsl'].includes(colorConfig.format as string)) {
      validated.format = colorConfig.format as 'hex' | 'rgb' | 'hsl';
    }

    ['showPreview', 'showAlpha', 'allowCustom'].forEach(key => {
      if (typeof colorConfig[key] === 'boolean') {
        (validated as any)[key] = colorConfig[key];
      }
    });

    if (Array.isArray(colorConfig.presetColors)) {
      validated.presetColors = colorConfig.presetColors.filter(color => typeof color === 'string');
    }

    return validated;
  }

  private static validateRatingConfig(config: unknown): ParsedFieldConfig['ratingConfig'] {
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const ratingConfig = config as Record<string, unknown>;
    const validated: NonNullable<ParsedFieldConfig['ratingConfig']> = {};

    if (typeof ratingConfig.max === 'number') {
      validated.max = ratingConfig.max;
    }

    ['allowHalf', 'allowClear', 'showValue'].forEach(key => {
      if (typeof ratingConfig[key] === 'boolean') {
        (validated as any)[key] = ratingConfig[key];
      }
    });

    if (ratingConfig.icon && ['star', 'heart', 'thumbs'].includes(ratingConfig.icon as string)) {
      validated.icon = ratingConfig.icon as 'star' | 'heart' | 'thumbs';
    }

    if (ratingConfig.size && ['sm', 'md', 'lg', 'small', 'medium', 'large'].includes(ratingConfig.size as string)) {
      validated.size = ratingConfig.size as 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
    }

    return validated;
  }

  private static validatePhoneConfig(config: unknown): ParsedFieldConfig['phoneConfig'] {
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const phoneConfig = config as Record<string, unknown>;
    const validated: NonNullable<ParsedFieldConfig['phoneConfig']> = {};

    if (phoneConfig.defaultCountry && typeof phoneConfig.defaultCountry === 'string') {
      validated.defaultCountry = phoneConfig.defaultCountry;
    }

    ['preferredCountries', 'onlyCountries', 'excludeCountries'].forEach(key => {
      if (Array.isArray(phoneConfig[key])) {
        (validated as any)[key] = phoneConfig[key].filter((item: unknown) => typeof item === 'string');
      }
    });

    if (phoneConfig.format && ['national', 'international'].includes(phoneConfig.format as string)) {
      validated.format = phoneConfig.format as 'national' | 'international';
    }

    return validated;
  }

  private static validateDatalistConfig(config: unknown): ParsedFieldConfig['datalist'] {
    if (typeof config !== 'object' || !config) {
      return undefined;
    }

    const datalistConfig = config as Record<string, unknown>;
    const validated: NonNullable<ParsedFieldConfig['datalist']> = {};

    if (Array.isArray(datalistConfig.options)) {
      validated.options = datalistConfig.options.filter(option => typeof option === 'string');
    }

    ['debounceMs', 'minChars', 'maxResults'].forEach(key => {
      if (typeof datalistConfig[key] === 'number') {
        (validated as any)[key] = datalistConfig[key];
      }
    });

    return validated;
  }

  private static validateOptions(options: unknown[]): Array<{ value: string; label: string }> {
    return options
      .filter(option => 
        typeof option === 'object' && 
        option !== null &&
        typeof (option as any).value === 'string' &&
        typeof (option as any).label === 'string'
      )
      .map(option => ({
        value: (option as any).value,
        label: (option as any).label
      }));
  }

  private static validatePage(page: unknown, index: number): PageConfig {
    if (typeof page !== 'object' || !page) {
      return { page: index };
    }

    const pageObj = page as Record<string, unknown>;
    const validated: PageConfig = {
      page: typeof pageObj.page === 'number' ? pageObj.page : index
    };

    if (pageObj.title && typeof pageObj.title === 'string') {
      validated.title = pageObj.title;
    }

    if (pageObj.description && typeof pageObj.description === 'string') {
      validated.description = pageObj.description;
    }

    return validated;
  }
}