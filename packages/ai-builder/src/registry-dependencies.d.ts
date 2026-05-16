declare module '@/components/formedible/hooks/use-formedible' {
  export function useFormedible<TFormValues extends import('../../formedible/src/lib/formedible/types').FormedibleFormValues = import('../../formedible/src/lib/formedible/types').FormedibleFormValues>(
    options: import('../../formedible/src/lib/formedible/types').UseFormedibleOptions<TFormValues>,
  ): { readonly Form: import('react').ComponentType<{ readonly className?: string }> };
}

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

declare module '@/components/formedible/lib/formedible-parser' {
  export const FormedibleParser: typeof import('../../formedible-parser/src/lib/formedible/formedible-parser').FormedibleParser;
  export const extractFormedibleCode: typeof import('../../formedible-parser/src/lib/formedible/formedible-parser').extractFormedibleCode;
}

declare module '@/components/formedible/lib/parser-config-schema' {
  export const defaultParserConfig: typeof import('../../formedible-parser/src/lib/formedible/parser-config-schema').defaultParserConfig;
  export const generateSystemPrompt: typeof import('../../formedible-parser/src/lib/formedible/parser-config-schema').generateSystemPrompt;
  export const mergeParserConfig: typeof import('../../formedible-parser/src/lib/formedible/parser-config-schema').mergeParserConfig;
  export const parserConfigFields: typeof import('../../formedible-parser/src/lib/formedible/parser-config-schema').parserConfigFields;
  export const validateParserConfig: typeof import('../../formedible-parser/src/lib/formedible/parser-config-schema').validateParserConfig;
  export type ParserConfig = import('../../formedible-parser/src/lib/formedible/parser-config-schema').ParserConfig;
}

declare module '@/components/formedible/lib/parser-types' {
  export type EnhancedParserError = import('../../formedible-parser/src/lib/formedible/parser-types').EnhancedParserError;
  export type EnhancedParserOptions = import('../../formedible-parser/src/lib/formedible/parser-types').EnhancedParserOptions;
  export type FormedibleExtractionResult = import('../../formedible-parser/src/lib/formedible/parser-types').FormedibleExtractionResult;
  export type FormedibleParseResult = import('../../formedible-parser/src/lib/formedible/parser-types').FormedibleParseResult;
  export type FormedibleStructuredOutput = import('../../formedible-parser/src/lib/formedible/parser-types').FormedibleStructuredOutput;
  export type ParserError = import('../../formedible-parser/src/lib/formedible/parser-types').ParserError;
  export type ParserOptions = import('../../formedible-parser/src/lib/formedible/parser-types').ParserOptions;
  export type ParsedFieldConfig = import('../../formedible-parser/src/lib/formedible/parser-types').ParsedFieldConfig;
  export type ParsedFormConfig = import('../../formedible-parser/src/lib/formedible/parser-types').ParsedFormConfig;
  export type SchemaInferenceOptions = import('../../formedible-parser/src/lib/formedible/parser-types').SchemaInferenceOptions;
  export type SchemaInferenceResult = import('../../formedible-parser/src/lib/formedible/parser-types').SchemaInferenceResult;
  export type ValidationWithSuggestionsResult = import('../../formedible-parser/src/lib/formedible/parser-types').ValidationWithSuggestionsResult;
}

declare module '@/components/ui/scroll-area' {
  export const ScrollArea: import('react').ComponentType<{ readonly className?: string; readonly children?: import('react').ReactNode }>;
  export const ScrollBar: import('react').ComponentType<{ readonly className?: string }>;
}
