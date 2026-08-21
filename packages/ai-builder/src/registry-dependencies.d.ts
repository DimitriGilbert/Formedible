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

declare module '@/components/formedible/builder/field-store' {
  export type FieldStore = import('../../builder/src/components/formedible/builder/field-store').FieldStore;
  export type FormField = import('../../builder/src/lib/formedible/builder-types').FormField;
  export const globalFieldStore: typeof import('../../builder/src/components/formedible/builder/field-store').globalFieldStore;
  export const FieldStoreContext: typeof import('../../builder/src/components/formedible/builder/field-store').FieldStoreContext;
  export function useFieldStore(): import('../../builder/src/components/formedible/builder/field-store').FieldStore;
}

declare module '@/lib/formedible/builder-types' {
  export type BuilderFieldTypeDefinition = import('../../builder/src/lib/formedible/builder-types').BuilderFieldTypeDefinition;
  export type FormField = import('../../builder/src/lib/formedible/builder-types').FormField;
  export type FormPage = import('../../builder/src/lib/formedible/builder-types').FormPage;
  export type FormTab = import('../../builder/src/lib/formedible/builder-types').FormTab;
  export type FormSettings = import('../../builder/src/lib/formedible/builder-types').FormSettings;
  export type FormMetadata = import('../../builder/src/lib/formedible/builder-types').FormMetadata;
  export type TabContentProps = import('../../builder/src/lib/formedible/builder-types').TabContentProps;
  export type TabConfig = import('../../builder/src/lib/formedible/builder-types').TabConfig;
  export type FormBuilderProps = import('../../builder/src/lib/formedible/builder-types').FormBuilderProps;
  export const builderFieldTypes: typeof import('../../builder/src/lib/formedible/builder-types').builderFieldTypes;
  export const defaultFormMetadata: typeof import('../../builder/src/lib/formedible/builder-types').defaultFormMetadata;
}

declare module '@/components/formedible/builder/form-builder' {
  export const FormBuilder: import('react').ComponentType<import('../../builder/src/lib/formedible/builder-types').FormBuilderProps>;
}

declare module '@/components/formedible/builder/field-configurator' {
  export const FieldConfigurator: import('react').ComponentType<{
    readonly fieldId: string;
    readonly initialField: import('../../builder/src/lib/formedible/builder-types').FormField;
    readonly availablePages?: readonly number[];
    readonly metadata?: import('../../builder/src/lib/formedible/builder-types').FormMetadata;
    readonly onFieldChange?: (field: import('../../builder/src/lib/formedible/builder-types').FormField) => void;
    readonly className?: string;
  }>;
}

declare module '@/components/formedible/builder/form-preview' {
  export const FormPreview: import('react').ComponentType<{
    readonly config: import('../../formedible/src/lib/formedible/types').UseFormedibleOptions<import('../../formedible/src/lib/formedible/types').FormedibleFormValues>;
    readonly onFormSubmit?: (values: import('../../formedible/src/lib/formedible/types').FormedibleFormValues) => void;
    readonly className?: string;
  }>;
}

declare module '@/components/formedible/builder/default-tabs' {
  export const defaultTabs: readonly import('../../builder/src/lib/formedible/builder-types').TabConfig[];
}

