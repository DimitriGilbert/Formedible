import type { ReactNode } from 'react';

export type FormedibleFormValues = Record<string, unknown>;

export type FormedibleFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'url'
  | 'tel'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'slider'
  | 'rating'
  | 'phone'
  | 'file'
  | 'array'
  | 'object'
  | 'multiSelect'
  | 'multiselect'
  | 'combobox'
  | 'autocomplete'
  | 'multiCombobox'
  | 'multicombobox'
  | 'color'
  | 'colorPicker'
  | 'duration'
  | 'location'
  | 'masked'
  | 'maskedInput';

export type NormalizedFieldType = Exclude<FormedibleFieldType, 'multiselect' | 'multicombobox' | 'colorPicker' | 'maskedInput'>;

export interface FormedibleOptionConfig {
  readonly value: string;
  readonly label: ReactNode;
  readonly disabled?: boolean;
  readonly description?: ReactNode;
  readonly [customProp: string]: unknown;
}

export type FormedibleFieldOption = string | FormedibleOptionConfig;

export type FormedibleConditional<TFormValues extends FormedibleFormValues = FormedibleFormValues> =
  | string
  | ((values: TFormValues) => boolean);

export interface FormedibleArrayObjectConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fields?: readonly FormedibleFieldConfig<TFormValues>[];
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly showCard?: boolean;
  readonly layout?: 'stack' | 'grid';
  readonly columns?: number;
  readonly [customProp: string]: unknown;
}

export interface FormedibleArrayConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly itemType?: FormedibleFieldType | 'string' | 'email';
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly sortable?: boolean;
  readonly defaultValue?: unknown;
  readonly objectConfig?: FormedibleArrayObjectConfig<TFormValues>;
  readonly [customProp: string]: unknown;
}

export interface FormedibleFieldConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly name: Extract<keyof TFormValues, string> | string;
  readonly type?: FormedibleFieldType;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder?: string;
  readonly dynamicPlaceholder?: boolean;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
  readonly page?: number;
  readonly tab?: string;
  readonly section?: string;
  readonly conditional?: FormedibleConditional<TFormValues>;
  readonly options?: readonly FormedibleFieldOption[] | ((values: TFormValues) => readonly FormedibleFieldOption[]);
  readonly optionSets?: Readonly<Record<string, readonly FormedibleFieldOption[]>>;
  readonly nestedFields?: readonly FormedibleFieldConfig<TFormValues>[];
  readonly arrayConfig?: FormedibleArrayConfig<TFormValues>;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows?: number;
  readonly maxLength?: number;
  readonly [customProp: string]: unknown;
}

export interface NormalizedFieldConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly type: NormalizedFieldType;
  readonly name: Extract<keyof TFormValues, string> | string;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder?: string;
  readonly dynamicPlaceholder?: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
  readonly page?: number;
  readonly tab?: string;
  readonly section?: string;
  readonly conditional?: FormedibleConditional<TFormValues>;
  readonly options?: readonly FormedibleFieldOption[] | ((values: TFormValues) => readonly FormedibleFieldOption[]);
  readonly optionSets?: Readonly<Record<string, readonly FormedibleFieldOption[]>>;
  readonly nestedFields?: readonly FormedibleFieldConfig<TFormValues>[];
  readonly arrayConfig?: FormedibleArrayConfig<TFormValues>;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows?: number;
  readonly maxLength?: number;
  readonly [customProp: string]: unknown;
}

export interface FormedibleSubmitContext<TFormValues extends FormedibleFormValues> {
  readonly value: TFormValues;
}

export interface FormedibleFormOptions<TFormValues extends FormedibleFormValues> {
  readonly defaultValues: TFormValues;
  readonly onSubmit?: (context: FormedibleSubmitContext<TFormValues>) => void | Promise<void>;
  readonly [customProp: string]: unknown;
}

export interface FormediblePageConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly page: number;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly conditional?: FormedibleConditional<TFormValues>;
  readonly [customProp: string]: unknown;
}

export interface FormedibleTabConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly id: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly conditional?: FormedibleConditional<TFormValues>;
  readonly [customProp: string]: unknown;
}

export interface FormedibleProgressConfig {
  readonly showSteps?: boolean;
  readonly showPercentage?: boolean;
  readonly [customProp: string]: unknown;
}

export interface FormediblePersistenceConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly key: string;
  readonly storage?: 'localStorage' | 'sessionStorage';
  readonly debounceMs?: number;
  readonly exclude?: readonly (Extract<keyof TFormValues, string> | string)[];
  readonly restoreOnMount?: boolean;
  readonly [customProp: string]: unknown;
}

export interface FormedibleAnalyticsConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly onFormStart?: () => void;
  readonly onFieldFocus?: (fieldName: Extract<keyof TFormValues, string> | string) => void;
  readonly onFieldBlur?: (fieldName: Extract<keyof TFormValues, string> | string) => void;
  readonly onPageChange?: (context: { readonly fromPage: number; readonly toPage: number; readonly timeSpent: number }) => void;
  readonly onFormComplete?: (context: { readonly formData: TFormValues; readonly timeSpent: number }) => void;
  readonly onFormAbandon?: (context: { readonly formData: Partial<TFormValues>; readonly timeSpent: number }) => void;
  readonly [customProp: string]: unknown;
}

export interface UseFormedibleOptions<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fields: readonly FormedibleFieldConfig<TFormValues>[];
  readonly formOptions: FormedibleFormOptions<TFormValues>;
  readonly schema?: unknown;
  readonly pages?: readonly FormediblePageConfig<TFormValues>[];
  readonly tabs?: readonly (string | FormedibleTabConfig<TFormValues>)[];
  readonly progress?: FormedibleProgressConfig;
  readonly persistence?: FormediblePersistenceConfig<TFormValues>;
  readonly analytics?: FormedibleAnalyticsConfig<TFormValues>;
  readonly submitLabel?: ReactNode;
  readonly nextLabel?: ReactNode;
  readonly previousLabel?: ReactNode;
  readonly collapseLabel?: ReactNode;
  readonly expandLabel?: ReactNode;
  readonly formClassName?: string;
  readonly [customProp: string]: unknown;
}

export interface NormalizedUseFormedibleOptions<TFormValues extends FormedibleFormValues = FormedibleFormValues>
  extends Omit<UseFormedibleOptions<TFormValues>, 'fields'> {
  readonly fields: readonly NormalizedFieldConfig<TFormValues>[];
}

export interface FormedibleFieldController {
  readonly id: string;
  readonly name: string;
  readonly value: unknown;
  readonly error?: string;
  readonly onBlur: () => void;
  readonly onChange: (value: unknown) => void;
}

export interface FormedibleFieldRenderProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
}
