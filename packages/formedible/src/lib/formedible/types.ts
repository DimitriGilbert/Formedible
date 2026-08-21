import type { AnyFieldApi, AnyFormApi } from '@tanstack/react-form';
import type { FocusEvent, FormEvent, KeyboardEvent, ReactNode } from 'react';
import type { ComponentType } from 'react';

export type { AnyFieldApi } from '@tanstack/react-form';

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

export interface FormedibleFieldSection {
  /**
   * Section heading rendered before the first visible field in a consecutive section group.
   * Optional for compatibility with sections that only carry a description.
   */
  readonly title?: ReactNode;
  /** Supporting text rendered below the section heading. */
  readonly description?: ReactNode;
  /** When true, renders a collapse/expand toggle and hides the section fields while collapsed. */
  readonly collapsible?: boolean;
  /** Initial expanded state of a collapsible section; defaults to expanded (`false` collapses). */
  readonly defaultExpanded?: boolean;
}

export interface FormedibleArrayObjectConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fields?: readonly FormedibleFieldConfig<TFormValues>[];
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly showCard?: boolean;
  /** Legacy `vertical`/`horizontal` layouts render like `stack`. */
  readonly layout?: 'stack' | 'grid' | 'vertical' | 'horizontal';
  readonly columns?: number;
  readonly [customProp: string]: unknown;
}

export interface FormedibleObjectConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fields?: readonly FormedibleFieldConfig<TFormValues>[];
  /** When true, renders a collapse/expand toggle for the nested fields. */
  readonly collapsible?: boolean;
  /** Initial expanded state of a collapsible object; defaults to expanded (`false` collapses). */
  readonly defaultExpanded?: boolean;
  /** When true, wraps the nested fields in a card-style container. */
  readonly showCard?: boolean;
  /** Toggle label shown while the object fields are expanded. */
  readonly collapseLabel?: ReactNode;
  /** Toggle label shown while the object fields are collapsed. */
  readonly expandLabel?: ReactNode;
  /** Legacy `vertical`/`horizontal` layouts render like `stack`. */
  readonly layout?: 'stack' | 'grid' | 'vertical' | 'horizontal';
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

export interface FormedibleTextareaConfig {
  readonly rows?: number;
  readonly cols?: number;
  readonly maxLength?: number;
  readonly resize?: 'none' | 'both' | 'horizontal' | 'vertical' | 'block' | 'inline';
  readonly showWordCount?: boolean;
  /**
   * `cols` maps to the native textarea attribute; `resize` maps to the CSS
   * resize property for legacy configuration compatibility.
   */
}

export interface FormediblePasswordConfig {
  /** Render a button that lets users switch between hidden and visible password text. */
  readonly showToggle?: boolean;
  /** Render a simple password strength meter derived from the current field value. */
  readonly strengthMeter?: boolean;
  /** Minimum desired strength on the 0-4 legacy scale; shown as guidance by the meter. */
  readonly minStrength?: number;
}

export interface FormedibleHelpLinkConfig {
  readonly url: string;
  readonly text: string;
}

export interface FormedibleHelpConfig {
  /** Supplementary help text rendered below the field. */
  readonly text?: ReactNode;
  /** Tooltip content rendered in a popover behind a help icon button. */
  readonly tooltip?: ReactNode;
  /** Preferred tooltip popover side; defaults to `top` (legacy default). */
  readonly position?: 'top' | 'bottom' | 'left' | 'right';
  /** External documentation link rendered below the field. */
  readonly link?: FormedibleHelpLinkConfig;
}

export interface FormedibleNumberConfig {
  /** Native minimum value for legacy number fields. Top-level `min` takes precedence. */
  readonly min?: number;
  /** Native maximum value for legacy number fields. Top-level `max` takes precedence. */
  readonly max?: number;
  /** Native step value for legacy number fields. Top-level `step` takes precedence. */
  readonly step?: number;
}

/**
 * Legacy email configuration, restored for compatibility. It is accepted and
 * ignored at runtime; email rules were never implemented from it on the legacy
 * main branch either. Use `schema` or `validation` for email-specific rules.
 *
 * @deprecated Declare email rules through `schema` or field `validation` instead.
 */
export interface FormedibleEmailConfig {
  readonly allowedDomains?: string | readonly string[];
  readonly blockedDomains?: string | readonly string[];
  readonly suggestions?: string | readonly string[];
  readonly validateMX?: boolean;
  readonly [customProp: string]: unknown;
}

export interface FormedibleAutocompleteConfig {
  /**
   * Legacy autocomplete compatibility configuration.
   *
   * Supported legacy keys are `options`, `asyncOptions`, `debounceMs`,
   * `minChars`, `maxResults`, `allowCustom`, `placeholder`, `noOptionsText`,
   * and `loadingText`. Static `options` declared here take precedence over the
   * field's top-level `options`; when omitted, autocomplete falls back to the
   * top-level options. `asyncOptions` results are debounced and stale requests
   * are ignored so older responses cannot overwrite the latest query.
   */
  readonly options?: readonly FormedibleFieldOption[];
  readonly asyncOptions?: (query: string) => Promise<readonly FormedibleFieldOption[]>;
  readonly debounceMs?: number;
  readonly minChars?: number;
  readonly maxResults?: number;
  readonly allowCustom?: boolean;
  readonly placeholder?: string;
  readonly noOptionsText?: string;
  readonly loadingText?: string;
}

export interface FormedibleMaskedInputPipeResult {
  readonly value: string;
  readonly indexesOfPipedChars: readonly number[];
}

export type FormedibleMaskedInputMask = string | ((value: string) => string);

export interface FormedibleMaskedInputConfig {
  /** Legacy input mask pattern or formatter. `0`/`9` accept digits and `A`/`a` accept letters. */
  readonly mask: FormedibleMaskedInputMask;
  /** Placeholder used by legacy masked input configs. Field-level `placeholder` takes precedence. */
  readonly placeholder?: string;
  /** Show guide placeholder characters for missing mask positions. */
  readonly showMask?: boolean;
  /** Allow guide placeholder characters when `showMask` is enabled. */
  readonly guide?: boolean;
  /** Legacy cursor-position hint retained for config compatibility. */
  readonly keepCharPositions?: boolean;
  /** Optional post-processing hook for conformed masked values. */
  readonly pipe?: (conformedValue: string, config: FormedibleMaskedInputConfig) => false | string | FormedibleMaskedInputPipeResult;
}

export type FormedibleValidationResult = string | null | undefined | false;

export interface FormedibleStandardFieldSchema {
  readonly '~standard': {
    readonly version: 1;
    readonly validate: (value: unknown) => unknown | Promise<unknown>;
  };
}

export interface FormedibleFieldValidationContext<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly value: unknown;
  readonly values: TFormValues;
  readonly fieldName: string;
}

export type FormedibleFieldValidation<TFormValues extends FormedibleFormValues = FormedibleFormValues> =
  | ((value: unknown, values: TFormValues, context: FormedibleFieldValidationContext<TFormValues>) => FormedibleValidationResult)
  | FormedibleStandardFieldSchema
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

export type FormedibleFieldComponent<TFormValues extends FormedibleFormValues = FormedibleFormValues> = ComponentType<FormedibleFieldComponentProps<TFormValues>>;

export interface FormedibleFieldWrapperProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
  readonly children: ReactNode;
}

export type FormedibleFieldWrapper<TFormValues extends FormedibleFormValues = FormedibleFormValues> = ComponentType<FormedibleFieldWrapperProps<TFormValues>>;

export interface FormedibleFieldConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly name: Extract<keyof TFormValues, string> | string;
  /**
   * Field type. Known types resolve through the built-in field registry; custom
   * type strings resolve through `defaultComponents` registrations and fall back
   * to text rendering when unregistered.
   */
  readonly type?: FormedibleFieldType | (string & {});
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder?: string;
  readonly dynamicPlaceholder?: boolean;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
  /** Class applied to the label of this field; the hook-level `labelClassName` is appended. */
  readonly labelClassName?: string;
  /** File acceptance filter; falls back to `fileConfig.accept`. */
  readonly accept?: string;
  /** Multiple selection flag for file inputs; falls back to `fileConfig.multiple`. */
  readonly multiple?: boolean;
  readonly page?: number;
  readonly tab?: string;
  readonly section?: string | FormedibleFieldSection;
  readonly conditional?: FormedibleConditional<TFormValues>;
  readonly options?: readonly FormedibleFieldOption[] | ((values: TFormValues) => readonly FormedibleFieldOption[]);
  readonly optionSets?: Readonly<Record<string, readonly FormedibleFieldOption[]>>;
  readonly nestedFields?: readonly FormedibleFieldConfig<TFormValues>[];
  readonly arrayConfig?: FormedibleArrayConfig<TFormValues>;
  readonly objectConfig?: FormedibleObjectConfig<TFormValues>;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows?: number;
  readonly maxLength?: number;
  /** Legacy input mask pattern. `9` accepts digits, `a` accepts letters, and `*` accepts alphanumeric characters. */
  readonly mask?: FormedibleMaskedInputMask;
  readonly textareaConfig?: FormedibleTextareaConfig;
  readonly passwordConfig?: FormediblePasswordConfig;
  readonly numberConfig?: FormedibleNumberConfig;
  /** Native datalist suggestions for text-like and number inputs. */
  readonly datalist?: readonly FormedibleFieldOption[];
  readonly help?: ReactNode | FormedibleHelpConfig;
  /**
   * Legacy email configuration; accepted and ignored at runtime. It was never
   * implemented on the legacy main branch either — use `schema` or `validation`.
   *
   * @deprecated Declare email rules through `schema` or field `validation` instead.
   */
  readonly emailConfig?: FormedibleEmailConfig;
  readonly dateConfig?: FormedibleDateConfig<TFormValues>;
  readonly sliderConfig?: FormedibleSliderConfig;
  readonly ratingConfig?: FormedibleRatingConfig;
  readonly multiSelectConfig?: FormedibleMultiSelectConfig;
  readonly comboboxConfig?: FormedibleComboboxConfig;
  readonly autocompleteConfig?: FormedibleAutocompleteConfig;
  readonly maskedInputConfig?: FormedibleMaskedInputConfig;
  readonly multiComboboxConfig?: FormedibleMultiSelectConfig & FormedibleComboboxConfig;
  readonly colorConfig?: FormedibleColorConfig;
  readonly phoneConfig?: FormediblePhoneConfig;
  readonly durationConfig?: FormedibleDurationConfig;
  readonly locationConfig?: FormedibleLocationConfig;
  readonly fileConfig?: FormedibleFileConfig;
  readonly validation?: FormedibleFieldValidation<TFormValues>;
  readonly inlineValidation?: FormedibleInlineValidation<TFormValues>;
  readonly component?: FormedibleFieldComponent<TFormValues>;
  readonly wrapper?: FormedibleFieldWrapper<TFormValues>;
  /**
   * Arbitrary props are retained for custom renderers and metadata only.
   * Known behavior configuration must use supported nested config objects, such as
   * `textareaConfig.showWordCount` and `numberConfig.{min,max,step}`. Unsupported
   * top-level legacy keys like `showWordCount` and `precision` are not consumed by
   * built-in renderers.
   */
  readonly [customProp: string]: unknown;
}

export interface NormalizedFieldConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  /** Normalized known field type or a verbatim custom type string. */
  readonly type: NormalizedFieldType | (string & {});
  readonly name: Extract<keyof TFormValues, string> | string;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly placeholder?: string;
  readonly dynamicPlaceholder?: boolean;
  readonly disabled: boolean;
  readonly required: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
  /** Class applied to the label of this field; the hook-level `labelClassName` is appended. */
  readonly labelClassName?: string;
  /** File acceptance filter; falls back to `fileConfig.accept`. */
  readonly accept?: string;
  /** Multiple selection flag for file inputs; falls back to `fileConfig.multiple`. */
  readonly multiple?: boolean;
  readonly page?: number;
  readonly tab?: string;
  readonly section?: string | FormedibleFieldSection;
  readonly conditional?: FormedibleConditional<TFormValues>;
  readonly options?: readonly FormedibleFieldOption[] | ((values: TFormValues) => readonly FormedibleFieldOption[]);
  readonly optionSets?: Readonly<Record<string, readonly FormedibleFieldOption[]>>;
  readonly nestedFields?: readonly FormedibleFieldConfig<TFormValues>[];
  readonly arrayConfig?: FormedibleArrayConfig<TFormValues>;
  readonly objectConfig?: FormedibleObjectConfig<TFormValues>;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows?: number;
  readonly maxLength?: number;
  /** Legacy input mask pattern. `9` accepts digits, `a` accepts letters, and `*` accepts alphanumeric characters. */
  readonly mask?: FormedibleMaskedInputMask;
  readonly textareaConfig?: FormedibleTextareaConfig;
  readonly passwordConfig?: FormediblePasswordConfig;
  readonly numberConfig?: FormedibleNumberConfig;
  /** Native datalist suggestions for text-like and number inputs. */
  readonly datalist?: readonly FormedibleFieldOption[];
  readonly help?: ReactNode | FormedibleHelpConfig;
  /**
   * Legacy email configuration; accepted and ignored at runtime. It was never
   * implemented on the legacy main branch either — use `schema` or `validation`.
   *
   * @deprecated Declare email rules through `schema` or field `validation` instead.
   */
  readonly emailConfig?: FormedibleEmailConfig;
  readonly dateConfig?: FormedibleDateConfig<TFormValues>;
  readonly sliderConfig?: FormedibleSliderConfig;
  readonly ratingConfig?: FormedibleRatingConfig;
  readonly multiSelectConfig?: FormedibleMultiSelectConfig;
  readonly comboboxConfig?: FormedibleComboboxConfig;
  readonly autocompleteConfig?: FormedibleAutocompleteConfig;
  readonly maskedInputConfig?: FormedibleMaskedInputConfig;
  readonly multiComboboxConfig?: FormedibleMultiSelectConfig & FormedibleComboboxConfig;
  readonly colorConfig?: FormedibleColorConfig;
  readonly phoneConfig?: FormediblePhoneConfig;
  readonly durationConfig?: FormedibleDurationConfig;
  readonly locationConfig?: FormedibleLocationConfig;
  readonly fileConfig?: FormedibleFileConfig;
  readonly validation?: FormedibleFieldValidation<TFormValues>;
  readonly inlineValidation?: FormedibleInlineValidation<TFormValues>;
  readonly component?: FormedibleFieldComponent<TFormValues>;
  readonly wrapper?: FormedibleFieldWrapper<TFormValues>;
  readonly [customProp: string]: unknown;
}

export interface FormedibleSubmitContext<TFormValues extends FormedibleFormValues> {
  readonly value: TFormValues;
}

export interface FormedibleFormApiContext<TFormValues extends FormedibleFormValues> {
  readonly state: {
    readonly values: TFormValues;
  };
  readonly handleSubmit: () => void | Promise<void>;
}

export interface FormedibleFormEventContext<TFormValues extends FormedibleFormValues> extends FormedibleSubmitContext<TFormValues> {
  readonly formApi?: FormedibleFormApiContext<TFormValues>;
}

export type FormedibleFormEventHandler<TFormValues extends FormedibleFormValues, TEvent extends FormEvent = FormEvent> = (
  event: TEvent,
  formApi: FormedibleFormApiContext<TFormValues>,
) => void;

export interface FormedibleFormOptions<TFormValues extends FormedibleFormValues> {
  /** Initial form values; defaults to an empty object when omitted. */
  readonly defaultValues?: TFormValues;
  readonly onSubmit?: (context: FormedibleFormEventContext<TFormValues>) => void | Promise<void>;
  readonly onChange?: (context: FormedibleFormEventContext<TFormValues>) => void;
  readonly onBlur?: (context: FormedibleFormEventContext<TFormValues>) => void;
  readonly onFocus?: (context: FormedibleFormEventContext<TFormValues>) => void;
  readonly onReset?: (context: FormedibleFormEventContext<TFormValues>) => void;
  /**
   * Standard TanStack Form submit-invalid callback, forwarded verbatim from the
   * underlying `useForm` config (legacy configs received the same props because
   * `formOptions` used to be spread straight into `useForm`).
   */
  readonly onSubmitInvalid?: (props: {
    readonly value: TFormValues;
    readonly formApi: AnyFormApi;
    readonly meta: unknown;
  }) => void;
  /** Debounce for async validation passes, forwarded into the TanStack `useForm` config. */
  readonly asyncDebounceMs?: number;
  /** Allows submitting while invalid (keeps the submit button enabled); forwarded into the TanStack `useForm` config. */
  readonly canSubmitWhenInvalid?: boolean;
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

export interface FormedibleValidationSummaryConfig {
  readonly autoNavigate?: boolean;
  readonly showBadges?: boolean;
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
  readonly onFormStart?: (timestamp: number) => void;
  readonly onFieldFocus?: (fieldName: Extract<keyof TFormValues, string> | string, timestamp: number) => void;
  readonly onFieldBlur?: (fieldName: Extract<keyof TFormValues, string> | string, timeSpent: number) => void;
  readonly onFieldChange?: (fieldName: Extract<keyof TFormValues, string> | string, value: unknown, timestamp: number) => void;
  readonly onFieldComplete?: (fieldName: Extract<keyof TFormValues, string> | string, isValid: boolean, timeSpent: number) => void;
  readonly onFieldError?: (fieldName: Extract<keyof TFormValues, string> | string, errors: readonly string[], timestamp: number) => void;
  readonly onPageChange?: (
    fromPage: number,
    toPage: number,
    timeSpent: number,
    pageValidationState?: { readonly hasErrors: boolean; readonly completionPercentage: number },
  ) => void;
  /** Superseded: current package runtime does not emit page completion analytics. */
  readonly onPageComplete?: never;
  /** Superseded: current package runtime does not emit page abandonment analytics. */
  readonly onPageAbandon?: never;
  /** Superseded by TanStack Form validation state and rendered field errors. */
  readonly onPageValidationError?: never;
  /** Fired on tab switch with the legacy from/to tab, time spent, and completion state arguments. */
  readonly onTabChange?: (
    fromTab: string,
    toTab: string,
    timeSpent: number,
    tabCompletionState?: { readonly completionPercentage: number; readonly hasErrors: boolean },
  ) => void;
  /** Superseded: current package runtime does not emit tab completion analytics. */
  readonly onTabComplete?: never;
  /** Superseded: current package runtime does not emit tab abandonment analytics. */
  readonly onTabAbandon?: never;
  /** Superseded: current package runtime does not emit tab validation-error analytics. */
  readonly onTabValidationError?: never;
  /** Fired the first time a tab becomes active (including the initial tab on mount). */
  readonly onTabFirstVisit?: (tabId: string, timestamp: number) => void;
  readonly onFormComplete?: (timeSpent: number, formData: TFormValues) => void;
  readonly onFormAbandon?: (
    completionPercentage: number,
    context?: { readonly currentPage?: number; readonly currentTab?: string; readonly lastActiveField?: string },
  ) => void;
  readonly onFormReset?: (timestamp: number, reason?: string) => void;
  /** Superseded: current package runtime does not measure render performance. */
  readonly onRenderPerformance?: never;
  /** Superseded: current package runtime does not measure validation performance. */
  readonly onValidationPerformance?: never;
  /**
   * Fired after a successful submit with the legacy timing arguments:
   * total time since form start, validation time (always 0, matching legacy
   * runtime behavior), and processing time around the consumer's `onSubmit`.
   */
  readonly onSubmissionPerformance?: (submissionTime: number, validationTime: number, processingTime: number) => void;
  readonly [customProp: string]: unknown;
}

export interface UseFormedibleOptions<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  /** Field configurations; defaults to an empty list when omitted. */
  readonly fields?: readonly FormedibleFieldConfig<TFormValues>[];
  /** Form options forwarded to the hook runtime; all members are optional. */
  readonly formOptions?: FormedibleFormOptions<TFormValues>;
  readonly schema?: unknown;
  readonly crossFieldValidation?: readonly FormedibleCrossFieldValidation<TFormValues>[];
  readonly asyncValidation?: Partial<Record<Extract<keyof TFormValues, string> | string, FormedibleAsyncValidation<TFormValues>>>;
  readonly pages?: readonly FormediblePageConfig<TFormValues>[];
  readonly tabs?: readonly (string | FormedibleTabConfig<TFormValues>)[];
  readonly progress?: FormedibleProgressConfig;
  readonly validationSummary?: boolean | FormedibleValidationSummaryConfig;
  readonly persistence?: FormediblePersistenceConfig<TFormValues>;
  readonly analytics?: FormedibleAnalyticsConfig<TFormValues>;
  /**
   * Component registry keyed by field type. Known type keys (including legacy
   * aliases like `multiselect`) are normalized before lookup; custom type
   * strings are registered verbatim so fields declaring them render the mapped
   * component. Unregistered types fall back to the built-in registry (text).
   */
  readonly defaultComponents?: Readonly<Record<string, FormedibleFieldComponent<TFormValues>>>;
  readonly globalWrapper?: FormedibleFieldWrapper<TFormValues>;
  readonly submitLabel?: ReactNode;
  readonly nextLabel?: ReactNode;
  readonly previousLabel?: ReactNode;
  readonly onPageChange?: (page: number, direction: 'next' | 'previous') => void;
  readonly autoSubmitOnChange?: boolean;
  readonly autoSubmitDebounceMs?: number;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly showSubmitButton?: boolean;
  readonly onFormReset?: FormedibleFormEventHandler<TFormValues>;
  readonly onFormInput?: FormedibleFormEventHandler<TFormValues>;
  readonly onFormInvalid?: FormedibleFormEventHandler<TFormValues>;
  readonly onFormKeyDown?: FormedibleFormEventHandler<TFormValues, KeyboardEvent>;
  readonly onFormKeyUp?: FormedibleFormEventHandler<TFormValues, KeyboardEvent>;
  readonly onFormFocus?: FormedibleFormEventHandler<TFormValues, FocusEvent>;
  readonly onFormBlur?: FormedibleFormEventHandler<TFormValues, FocusEvent>;
  readonly collapseLabel?: ReactNode;
  readonly expandLabel?: ReactNode;
  readonly formClassName?: string;
  /** Class appended to every field wrapper alongside each field's own `className`. */
  readonly fieldClassName?: string;
  /** Class appended to every field label alongside each field's own `labelClassName`. */
  readonly labelClassName?: string;
  /** Class applied to the navigation buttons (Previous/Next). */
  readonly buttonClassName?: string;
  /** Class applied to the submit button. */
  readonly submitButtonClassName?: string;
  /**
   * Reset the form to its default values after a successful submit. Defaults to
   * `true` (legacy main behavior); pass `false` to keep the submitted values.
   */
  readonly resetOnSubmitSuccess?: boolean;
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
  readonly onFocus?: () => void;
  readonly onBlur: () => void;
  readonly onChange: (value: unknown) => void;
}

export interface FormedibleNestedRenderOptions {
  readonly name?: string;
  readonly key?: string;
  readonly localValues?: FormedibleFormValues;
}

export interface FormedibleFieldRenderProps<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly fieldConfig: NormalizedFieldConfig<TFormValues>;
  readonly field: FormedibleFieldController;
  readonly renderField?: (fieldConfig: NormalizedFieldConfig<TFormValues>, options?: FormedibleNestedRenderOptions) => ReactNode;
  readonly defaultComponent?: FormedibleFieldComponent<TFormValues>;
  readonly globalWrapper?: FormedibleFieldWrapper<TFormValues>;
}

/**
 * Props delivered to custom field components (`field.component` and
 * `defaultComponents` entries). Dual-shape contract: the legacy flat props
 * (`fieldApi`, `label`, `options`, resolved config objects, ...) are delivered
 * alongside the render-props shape (`field`, `fieldConfig`, `renderField`), so
 * legacy flat-prop components and new render-props components both work.
 *
 * Flat text props (`label`, `description`) are strings; labels declared as
 * ReactNode remain available through `fieldConfig.label`.
 */
export interface FormedibleFieldComponentProps<TFormValues extends FormedibleFormValues = FormedibleFormValues>
  extends FormedibleFieldRenderProps<TFormValues> {
  /** TanStack Form field api backing the rendered field (legacy alias). */
  readonly fieldApi: AnyFieldApi;
  /** Resolved label; only string labels are surfaced here. */
  readonly label?: string;
  /** Resolved placeholder. */
  readonly placeholder?: string;
  /** Resolved description; only string descriptions are surfaced here. */
  readonly description?: string;
  /** True when the field, form, or submit lifecycle disables the control. */
  readonly disabled?: boolean;
  readonly required?: boolean;
  /** Resolved and normalized options; only present when the field declares options. */
  readonly options?: { value: string; label: string; disabled?: boolean }[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly rows?: number;
  readonly maxLength?: number;
  /** File acceptance filter; falls back to `fileConfig.accept`. */
  readonly accept?: string;
  /** Multiple selection flag; falls back to `fileConfig.multiple`. */
  readonly multiple?: boolean;
  readonly className?: string;
  readonly inputClassName?: string;
  /** Class applied to the element wrapping label and control. */
  readonly wrapperClassName?: string;
  readonly labelClassName?: string;
  readonly arrayConfig?: FormedibleArrayConfig<TFormValues>;
  readonly objectConfig?: FormedibleObjectConfig<TFormValues>;
  readonly datalist?: readonly FormedibleFieldOption[];
  readonly textareaConfig?: FormedibleTextareaConfig;
  readonly passwordConfig?: FormediblePasswordConfig;
  readonly numberConfig?: FormedibleNumberConfig;
  readonly dateConfig?: FormedibleDateConfig<TFormValues>;
  readonly sliderConfig?: FormedibleSliderConfig;
  readonly ratingConfig?: FormedibleRatingConfig;
  readonly multiSelectConfig?: FormedibleMultiSelectConfig;
  readonly comboboxConfig?: FormedibleComboboxConfig;
  readonly autocompleteConfig?: FormedibleAutocompleteConfig;
  readonly maskedInputConfig?: FormedibleMaskedInputConfig;
  readonly multiComboboxConfig?: FormedibleMultiSelectConfig & FormedibleComboboxConfig;
  readonly colorConfig?: FormedibleColorConfig;
  readonly phoneConfig?: FormediblePhoneConfig;
  readonly durationConfig?: FormedibleDurationConfig;
  readonly locationConfig?: FormedibleLocationConfig;
  readonly fileConfig?: FormedibleFileConfig;
}

export interface FormedibleDateConfig<TFormValues extends FormedibleFormValues = FormedibleFormValues> {
  readonly minDate?: Date | string;
  readonly maxDate?: Date | string;
  /** When true, dates before today's local date are unselectable (effective min becomes the later of minDate and today). */
  readonly disablePastDates?: boolean;
  /** When true, dates after today's local date are unselectable (effective max becomes the earlier of maxDate and today). */
  readonly disableFutureDates?: boolean;
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

export interface FormedibleSliderGradientColors {
  /** Gradient start color (hex, e.g. `#ef4444`). */
  readonly start: string;
  /** Gradient end color (hex, e.g. `#22c55e`). */
  readonly end: string;
  /** Gradient direction; defaults to `horizontal`. */
  readonly direction?: 'horizontal' | 'vertical';
}

export interface FormedibleSliderConfig {
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** Paints the slider track as a gradient between the configured colors. */
  readonly gradientColors?: FormedibleSliderGradientColors;
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

export interface FormedibleFileRejection {
  readonly file: File;
  readonly reason: 'maxSize' | 'maxFiles';
}

export interface FormedibleFileConfig {
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxSize?: number;
  readonly maxFiles?: number;
  readonly onFilesChange?: (files: readonly File[]) => void;
  readonly onFileRemove?: (file: File) => void;
  readonly onFilesRejected?: (rejections: readonly FormedibleFileRejection[]) => void;
  readonly [customProp: string]: unknown;
}
