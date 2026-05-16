declare module '@/components/formedible/lib/types' {
  export type FormedibleFieldConfig<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').FormedibleFieldConfig<TFormValues>;
  export type FormedibleFieldOption = import('../../formedible/src/lib/formedible/types').FormedibleFieldOption;
  export type FormedibleFieldType = import('../../formedible/src/lib/formedible/types').FormedibleFieldType;
  export type FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues;
  export type FormedibleObjectConfig<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').FormedibleObjectConfig<TFormValues>;
  export type FormediblePageConfig<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').FormediblePageConfig<TFormValues>;
  export type FormedibleProgressConfig = import('../../formedible/src/lib/formedible/types').FormedibleProgressConfig;
  export type UseFormedibleOptions<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues> = import('../../formedible/src/lib/formedible/types').UseFormedibleOptions<TFormValues>;
}

declare module '@/components/formedible/lib/parser-types' {
  export type EnhancedParserError = import('./lib/formedible/parser-types').EnhancedParserError;
  export type EnhancedParserOptions = import('./lib/formedible/parser-types').EnhancedParserOptions;
  export type FormedibleExtractionResult = import('./lib/formedible/parser-types').FormedibleExtractionResult;
  export type FormedibleParseResult = import('./lib/formedible/parser-types').FormedibleParseResult;
  export type FormedibleStructuredOutput = import('./lib/formedible/parser-types').FormedibleStructuredOutput;
  export type ParserError = import('./lib/formedible/parser-types').ParserError;
  export type ParserOptions = import('./lib/formedible/parser-types').ParserOptions;
  export type ParsedFieldConfig = import('./lib/formedible/parser-types').ParsedFieldConfig;
  export type ParsedFormConfig = import('./lib/formedible/parser-types').ParsedFormConfig;
  export type SchemaInferenceOptions = import('./lib/formedible/parser-types').SchemaInferenceOptions;
  export type SchemaInferenceResult = import('./lib/formedible/parser-types').SchemaInferenceResult;
  export type ValidationWithSuggestionsResult = import('./lib/formedible/parser-types').ValidationWithSuggestionsResult;
}
