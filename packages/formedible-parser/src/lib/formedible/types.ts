import type { ReactNode } from 'react';
import type { ComponentType } from 'react';

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

export type FormedibleValidationResult = string | null | undefined | false;

export interface FormedibleFieldValidationContext<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly value: unknown;
  readonly values: TFormValues;
  readonly fieldName: string;
}

export type FormedibleFieldValidation<TFormValues extends FormedibleFormValues = FormedibleFormValues> =
  | ((value: unknown, values: TFormValues, context: FormedibleFieldValidationContext<TFormValues>) => FormedibleValidationResult)
  | {
      readonly validator: (value: unknown, values: TFormValues) => FormedibleValidationResult;
      readonly message?: string;
    };

export interface FormedibleCrossFieldValidation<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fields: readonly (Extract<keyof TFormValues, string> | string)[];
  readonly validator: (values: TFormValues) => FormedibleValidationResult;
}

export interface FormedibleAsyncValidation<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly validator: (value: unknown, values: TFormValues, signal: AbortSignal) => FormedibleValidationResult | Promise<FormedibleValidationResult>;
  readonly debounceMs?: number;
  readonly loadingMessage?: string;
}

export interface FormedibleInlineValidation<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly enabled?: boolean;
  readonly debounceMs?: number;
  readonly validator?: (value: unknown, values: TFormValues, signal: AbortSignal) => FormedibleValidationResult | Promise<FormedibleValidationResult>;
  readonly showSuccess?: boolean;
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
  readonly dateConfig?: FormedibleDateConfig<TFormValues>;
  readonly sliderConfig?: FormedibleSliderConfig;
  readonly ratingConfig?: FormedibleRatingConfig;
  readonly multiSelectConfig?: FormedibleMultiSelectConfig;
  readonly comboboxConfig?: FormedibleComboboxConfig;
  readonly multiComboboxConfig?: FormedibleMultiSelectConfig & FormedibleComboboxConfig;
  readonly colorConfig?: FormedibleColorConfig;
  readonly phoneConfig?: FormediblePhoneConfig;
  readonly durationConfig?: FormedibleDurationConfig;
  readonly locationConfig?: FormedibleLocationConfig;
  readonly fileConfig?: FormedibleFileConfig;
  readonly validation?: FormedibleFieldValidation<TFormValues>;
  readonly inlineValidation?: FormedibleInlineValidation<TFormValues>;
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
  readonly dateConfig?: FormedibleDateConfig<TFormValues>;
  readonly sliderConfig?: FormedibleSliderConfig;
  readonly ratingConfig?: FormedibleRatingConfig;
  readonly multiSelectConfig?: FormedibleMultiSelectConfig;
  readonly comboboxConfig?: FormedibleComboboxConfig;
  readonly multiComboboxConfig?: FormedibleMultiSelectConfig & FormedibleComboboxConfig;
  readonly colorConfig?: FormedibleColorConfig;
  readonly phoneConfig?: FormediblePhoneConfig;
  readonly durationConfig?: FormedibleDurationConfig;
  readonly locationConfig?: FormedibleLocationConfig;
  readonly fileConfig?: FormedibleFileConfig;
  readonly validation?: FormedibleFieldValidation<TFormValues>;
  readonly inlineValidation?: FormedibleInlineValidation<TFormValues>;
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
  readonly crossFieldValidation?: readonly FormedibleCrossFieldValidation<TFormValues>[];
  readonly asyncValidation?: Partial<Record<Extract<keyof TFormValues, string> | string, FormedibleAsyncValidation<TFormValues>>>;
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
  readonly formValues?: FormedibleFormValues;
  readonly error?: string;
  readonly onBlur: () => void;
  readonly onChange: (value: unknown) => void;
}

export interface FormedibleFieldRenderProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
}

export interface FormedibleDateConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly minDate?: Date | string;
  readonly maxDate?: Date | string;
  readonly disableDate?: (date: Date, values: TFormValues) => boolean;
  readonly format?: string;
  readonly [customProp: string]: unknown;
}

export interface FormedibleSliderValueMapping {
  readonly sliderValue: number;
  readonly displayValue: ReactNode;
  readonly label?: ReactNode;
}

export interface FormedibleSliderMark {
  readonly value: number;
  readonly label: ReactNode;
}

export interface FormedibleSliderVisualizationProps {
  readonly value: number;
  readonly displayValue: ReactNode;
  readonly label?: ReactNode;
  readonly isActive: boolean;
}

export interface FormedibleSliderConfig {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly valueMapping?: readonly FormedibleSliderValueMapping[];
  readonly visualizationComponent?: ComponentType<FormedibleSliderVisualizationProps>;
  readonly valueLabelPrefix?: string;
  readonly valueLabelSuffix?: string;
  readonly valueDisplayPrecision?: number;
  readonly showRawValue?: boolean;
  readonly showValue?: boolean;
  readonly marks?: readonly FormedibleSliderMark[];
  readonly [customProp: string]: unknown;
}

export interface FormedibleRatingConfig {
  readonly max?: number;
  readonly allowHalf?: boolean;
  readonly icon?: 'star' | 'heart' | 'thumbs';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showValue?: boolean;
  readonly [customProp: string]: unknown;
}

export interface FormedibleMultiSelectConfig {
  readonly maxSelections?: number;
  readonly searchable?: boolean;
  readonly creatable?: boolean;
  readonly placeholder?: string;
  readonly noOptionsText?: string;
  readonly [customProp: string]: unknown;
}

export interface FormedibleComboboxConfig {
  readonly searchable?: boolean;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly noOptionsText?: string;
  readonly [customProp: string]: unknown;
}

export interface FormedibleColorConfig {
  readonly format?: 'hex' | 'rgb' | 'hsl';
  readonly showPreview?: boolean;
  readonly presetColors?: readonly string[];
  readonly allowCustom?: boolean;
  readonly [customProp: string]: unknown;
}

export interface FormediblePhoneConfig {
  readonly defaultCountry?: string;
  readonly format?: 'national' | 'international';
  readonly allowedCountries?: readonly string[];
  readonly placeholder?: string;
  readonly [customProp: string]: unknown;
}

export interface FormedibleDurationValue {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly totalSeconds: number;
}

export interface FormedibleDurationConfig {
  readonly format?: 'hms' | 'hm' | 'ms' | 'hours' | 'minutes' | 'seconds';
  readonly maxHours?: number;
  readonly maxMinutes?: number;
  readonly maxSeconds?: number;
  readonly showLabels?: boolean;
  readonly [customProp: string]: unknown;
}

export interface FormedibleLocationValue {
  readonly lat: number;
  readonly lng: number;
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly country?: string;
  readonly [customProp: string]: unknown;
}

export interface FormedibleLocationSearchOptions {
  readonly limit?: number;
}

export interface FormedibleLocationConfig {
  readonly defaultLocation?: FormedibleLocationValue;
  readonly enableSearch?: boolean;
  readonly enableGeolocation?: boolean;
  readonly enableManualEntry?: boolean;
  readonly showMap?: boolean;
  readonly searchPlaceholder?: string;
  readonly searchOptions?: {
    readonly debounceMs?: number;
    readonly minQueryLength?: number;
    readonly maxResults?: number;
  };
  readonly searchCallback?: (query: string, options: FormedibleLocationSearchOptions) => readonly FormedibleLocationValue[] | Promise<readonly FormedibleLocationValue[]>;
  readonly reverseGeocodeCallback?: (lat: number, lng: number) => FormedibleLocationValue | Promise<FormedibleLocationValue>;
  readonly [customProp: string]: unknown;
}

export interface FormedibleFileConfig {
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxSize?: number;
  readonly maxFiles?: number;
  readonly onFilesChange?: (files: readonly File[]) => void;
  readonly onFileRemove?: (file: File) => void;
  readonly [customProp: string]: unknown;
}
