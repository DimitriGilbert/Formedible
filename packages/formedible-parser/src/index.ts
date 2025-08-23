// Export the main parser class
export { FormedibleParser } from './components/formedible/parser/formedible-parser';

// Export all types
export type { 
  ParsedFormConfig, 
  ParsedFieldConfig, 
  ParserOptions,
  ParserError,
  FieldOption,
  FieldOptions,
  ObjectConfig,
  PageConfig,
  ProgressConfig
} from './components/formedible/parser/types';

// Export version info
export const version = '0.1.0';

// Export compatibility info
export const supportedFieldTypes = [
  'text', 'email', 'password', 'url', 'tel', 'textarea', 'select', 
  'checkbox', 'switch', 'number', 'date', 'slider', 'file', 'rating',
  'phone', 'colorPicker', 'location', 'duration', 'multiSelect',
  'autocomplete', 'masked', 'object', 'array', 'radio'
] as const;

export type SupportedFieldType = typeof supportedFieldTypes[number];