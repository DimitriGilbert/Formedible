// Export the main parser class
export { FormedibleParser } from "./lib/formedible/formedible-parser";

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
  ProgressConfig,
  // Phase 2: Enhanced types
  EnhancedParserOptions,
  EnhancedParserError,
  SchemaInferenceOptions,
  SchemaInferenceResult,
  ValidationWithSuggestionsResult,
} from "./lib/formedible/parser-types";

// Export version info
export const version = "0.1.0";

// Export compatibility info
export const supportedFieldTypes = [
  "text",
  "email",
  "password",
  "url",
  "tel",
  "textarea",
  "select",
  "checkbox",
  "switch",
  "number",
  "date",
  "slider",
  "file",
  "rating",
  "phone",
  "colorPicker",
  "location",
  "duration",
  "multiSelect",
  "autocomplete",
  "masked",
  "object",
  "array",
  "radio",
] as const;

export type SupportedFieldType = (typeof supportedFieldTypes)[number];

// Export parser configuration schema (Phase 2)
export type { ParserConfig } from "./lib/formedible/parser-config-schema";
export {
  defaultParserConfig,
  parserConfigFields,
  parserConfigFormDefinition,
  parserConfigSchemaDefinition,
  validateParserConfig,
  mergeParserConfig,
  generateSystemPrompt,
} from "./lib/formedible/parser-config-schema";
