"use client";
import React, { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import type { FormedibleFormApi, FieldComponentProps, BaseFieldProps } from "@/lib/formedible/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TextField } from "@/components/formedible/fields/text-field";
import { TextareaField } from "@/components/formedible/fields/textarea-field";
import { SelectField } from "@/components/formedible/fields/select-field";
import { CheckboxField } from "@/components/formedible/fields/checkbox-field";
import { SwitchField } from "@/components/formedible/fields/switch-field";
import { NumberField } from "@/components/formedible/fields/number-field";
import { DateField } from "@/components/formedible/fields/date-field";
import { SliderField } from "@/components/formedible/fields/slider-field";
import { FileUploadField } from "@/components/formedible/fields/file-upload-field";
import { ArrayField } from "@/components/formedible/fields/array-field";
import { RadioField } from "@/components/formedible/fields/radio-field";
import { FormTabs } from "@/components/formedible/layout/form-tabs";
import { MultiSelectField } from "@/components/formedible/fields/multi-select-field";
import { ColorPickerField } from "@/components/formedible/fields/color-picker-field";
import { RatingField } from "@/components/formedible/fields/rating-field";
import { PhoneField } from "@/components/formedible/fields/phone-field";
import { LocationPickerField } from "@/components/formedible/fields/location-picker-field";
import { DurationPickerField } from "@/components/formedible/fields/duration-picker-field";
import { AutocompleteField } from "@/components/formedible/fields/autocomplete-field";
import { MaskedInputField } from "@/components/formedible/fields/masked-input-field";
import { ObjectField } from "@/components/formedible/fields/object-field";
import { InlineValidationWrapper } from "@/components/formedible/fields/inline-validation-wrapper";
import { FieldHelp } from "@/components/formedible/fields/field-help";

interface FormProps {
  className?: string;
  children?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  // HTML form attributes
  action?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  encType?: 'application/x-www-form-urlencoded' | 'multipart/form-data' | 'text/plain';
  target?: '_blank' | '_self' | '_parent' | '_top' | string;
  autoComplete?: 'on' | 'off';
  noValidate?: boolean;
  acceptCharset?: string;
  // Event handlers
  onReset?: (e: React.FormEvent) => void;
  onInput?: (e: React.FormEvent) => void;
  onInvalid?: (e: React.FormEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onKeyUp?: (e: React.KeyboardEvent) => void;

  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  // Accessibility
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  tabIndex?: number;
}

export interface FieldConfig {
  name: string;
  type: string;
  label?: string;
  placeholder?: string;
  description?: string;
  options?: string[] | { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  multiple?: boolean;
  component?: React.ComponentType<FieldComponentProps>;
  wrapper?: React.ComponentType<{ children: React.ReactNode; field: FieldConfig }>;
  page?: number;
  tab?: string;
  validation?: z.ZodSchema<unknown>;
  dependencies?: string[];
  conditional?: (values: Record<string, unknown>) => boolean;
  // Array field configuration
  arrayConfig?: {
    itemType: string; // Type of items in the array ('text', 'email', 'number', etc.)
    itemLabel?: string; // Label for each item (e.g., "Email Address")
    itemPlaceholder?: string; // Placeholder for each item
    itemValidation?: z.ZodSchema<unknown>; // Validation for each item
    minItems?: number; // Minimum number of items
    maxItems?: number; // Maximum number of items
    addButtonLabel?: string; // Label for add button
    removeButtonLabel?: string; // Label for remove button
    addLabel?: string; // Alternative name for add button label
    removeLabel?: string; // Alternative name for remove button label
    itemComponent?: React.ComponentType<FieldComponentProps>; // Custom component for each item
    sortable?: boolean; // Whether items can be reordered
    defaultValue?: unknown; // Default value for new items
  };
  // Datalist configuration for text inputs
  datalist?: {
    options?: string[]; // Static options
    asyncOptions?: (query: string) => Promise<string[]>; // Async function for dynamic options
    debounceMs?: number; // Debounce time for async calls
    minChars?: number; // Minimum characters to trigger async search
    maxResults?: number; // Maximum number of results to show
  };
  // Help and tooltip configuration
  help?: {
    text?: string; // Help text displayed below field
    tooltip?: string; // Tooltip text on hover/focus
    position?: 'top' | 'bottom' | 'left' | 'right'; // Tooltip position
    link?: { url: string; text: string }; // Help link
  };
  // Inline validation configuration
  inlineValidation?: {
    enabled?: boolean; // Enable inline validation
    debounceMs?: number; // Debounce time for validation
    showSuccess?: boolean; // Show success state
    asyncValidator?: (value: unknown) => Promise<string | null>; // Async validation function
  };
  // Field grouping
  group?: string; // Group name for organizing fields
  section?: {
    title: string; // Section title
    description?: string; // Section description
    collapsible?: boolean; // Whether section can be collapsed
    defaultExpanded?: boolean; // Default expansion state
  };
  // Rating field specific
  ratingConfig?: {
    max?: number; // Maximum rating (default 5)
    allowHalf?: boolean; // Allow half ratings
    icon?: 'star' | 'heart' | 'thumbs'; // Rating icon type
    size?: 'sm' | 'md' | 'lg'; // Icon size
    showValue?: boolean; // Show numeric value
  };
  // Phone field specific
  phoneConfig?: {
    defaultCountry?: string; // Default country code
    format?: 'national' | 'international'; // Phone format
    allowedCountries?: string[]; // Allowed country codes
    placeholder?: string; // Custom placeholder
  };
  // Color picker specific
  colorConfig?: {
    format?: 'hex' | 'rgb' | 'hsl'; // Color format
    showPreview?: boolean; // Show color preview
    presetColors?: string[]; // Preset color options
    allowCustom?: boolean; // Allow custom colors
  };
  // Multi-select specific
  multiSelectConfig?: {
    maxSelections?: number; // Maximum selections
    searchable?: boolean; // Enable search
    creatable?: boolean; // Allow creating new options
    placeholder?: string; // Placeholder text
    noOptionsText?: string; // Text when no options
    loadingText?: string; // Loading text
  };
  // Location picker specific
  locationConfig?: {
    apiKey?: string;
    defaultLocation?: { lat: number; lng: number };
    zoom?: number;
    searchPlaceholder?: string;
    enableSearch?: boolean;
    enableGeolocation?: boolean;
    mapProvider?: 'google' | 'openstreetmap';
  };
  // Duration picker specific
  durationConfig?: {
    format?: 'hms' | 'hm' | 'ms' | 'hours' | 'minutes' | 'seconds';
    maxHours?: number;
    maxMinutes?: number;
    maxSeconds?: number;
    showLabels?: boolean;
    allowNegative?: boolean;
  };
  // Autocomplete specific
  autocompleteConfig?: {
    options?: string[] | { value: string; label: string }[];
    asyncOptions?: (query: string) => Promise<string[] | { value: string; label: string }[]>;
    debounceMs?: number;
    minChars?: number;
    maxResults?: number;
    allowCustom?: boolean;
    placeholder?: string;
    noOptionsText?: string;
    loadingText?: string;
  };
  // Masked input specific
  maskedInputConfig?: {
    mask: string | ((value: string) => string);
    placeholder?: string;
    showMask?: boolean;
    guide?: boolean;
    keepCharPositions?: boolean;
    pipe?: (conformedValue: string, config: unknown) => false | string | { value: string; indexesOfPipedChars: number[] };
  };
  // Object field specific
  objectConfig?: {
    title?: string;
    description?: string;
    fields: Array<{
      name: string;
      type: string;
      label?: string;
      placeholder?: string;
      description?: string;
      options?: Array<{ value: string; label: string }>;
      min?: number;
      max?: number;
      step?: number;
      [key: string]: any;
    }>;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    showCard?: boolean;
    layout?: "vertical" | "horizontal" | "grid";
    columns?: number;
  };
  // Slider field specific
  sliderConfig?: {
    min?: number;
    max?: number;
    step?: number;
    marks?: Array<{ value: number; label: string }>;
    showTooltip?: boolean;
    showValue?: boolean;
    orientation?: "horizontal" | "vertical";
  };
  // Number field specific
  numberConfig?: {
    min?: number;
    max?: number;
    step?: number;
    precision?: number;
    allowNegative?: boolean;
    showSpinButtons?: boolean;
  };
  // Date field specific
  dateConfig?: {
    format?: string;
    minDate?: Date;
    maxDate?: Date;
    disabledDates?: Date[];
    showTime?: boolean;
    timeFormat?: string;
  };
  // File upload specific
  fileConfig?: {
    accept?: string;
    multiple?: boolean;
    maxSize?: number;
    maxFiles?: number;
    allowedTypes?: string[];
  };
  // Textarea specific
  textareaConfig?: {
    rows?: number;
    cols?: number;
    resize?: "none" | "vertical" | "horizontal" | "both";
    maxLength?: number;
    showWordCount?: boolean;
  };
  // Password field specific
  passwordConfig?: {
    showToggle?: boolean;
    strengthMeter?: boolean;
    minStrength?: number;
    requirements?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSymbols?: boolean;
    };
  };
  // Email field specific
  emailConfig?: {
    allowedDomains?: string | string[];
    blockedDomains?: string | string[];
    suggestions?: string | string[];
    validateMX?: boolean;
  };
  // Simplified validation configuration for builder
  validationConfig?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
    includes?: string;
    startsWith?: string;
    endsWith?: string;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    transform?: string;
    refine?: string;
    customMessages?: Record<string, string>;
  };
}

interface PageConfig {
  page: number;
  title?: string;
  description?: string;
  component?: React.ComponentType<{ 
    children: React.ReactNode; 
    title?: string; 
    description?: string; 
    page: number;
    totalPages: number;
  }>;
}

interface ProgressConfig {
  component?: React.ComponentType<{ 
    value: number; 
    currentPage: number; 
    totalPages: number; 
    className?: string;
  }>;
  showSteps?: boolean;
  showPercentage?: boolean;
  className?: string;
}

interface UseFormedibleOptions<TFormValues> {
  fields?: FieldConfig[];
  schema?: z.ZodSchema<TFormValues>;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
  formClassName?: string;
  fieldClassName?: string;
  pages?: PageConfig[];
  progress?: ProgressConfig;
  tabs?: {
    id: string;
    label: string;
    description?: string;
  }[];
  defaultComponents?: {
    [key: string]: React.ComponentType<FieldComponentProps>;
  };
  globalWrapper?: React.ComponentType<{ children: React.ReactNode; field: FieldConfig }>;
  formOptions?: Partial<{
    defaultValues: TFormValues;
    onSubmit: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => unknown | Promise<unknown>;
    onSubmitInvalid: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => void;
    onChange?: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => void;
    onBlur?: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => void;
    onFocus?: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => void;
    onReset?: (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => void;
    asyncDebounceMs: number;
    canSubmitWhenInvalid: boolean;

  }>;
  onPageChange?: (page: number, direction: 'next' | 'previous') => void;
  autoSubmitOnChange?: boolean;
  autoSubmitDebounceMs?: number;
  disabled?: boolean;
  loading?: boolean;
  resetOnSubmitSuccess?: boolean;
  showSubmitButton?: boolean;
  // Form-level event handlers
  onFormReset?: (e: React.FormEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  onFormInput?: (e: React.FormEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  onFormInvalid?: (e: React.FormEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  onFormKeyDown?: (e: React.KeyboardEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  onFormKeyUp?: (e: React.KeyboardEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  onFormFocus?: (e: React.FocusEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  onFormBlur?: (e: React.FocusEvent, formApi: FormedibleFormApi<TFormValues>) => void;
  // Advanced validation features
  crossFieldValidation?: {
    fields: (keyof TFormValues)[];
    validator: (values: Partial<TFormValues>) => string | null;
    message: string;
  }[];
  asyncValidation?: {
    [fieldName: string]: {
      validator: (value: unknown) => Promise<string | null>;
      debounceMs?: number;
      loadingMessage?: string;
    };
  };
  // Form analytics and tracking
  analytics?: {
    onFieldFocus?: (fieldName: string, timestamp: number) => void;
    onFieldBlur?: (fieldName: string, timeSpent: number) => void;
    onFormAbandon?: (completionPercentage: number) => void;
    onPageChange?: (fromPage: number, toPage: number, timeSpent: number) => void;
    onFieldChange?: (fieldName: string, value: unknown, timestamp: number) => void;
    onFormStart?: (timestamp: number) => void;
    onFormComplete?: (timeSpent: number, formData: Record<string, unknown>) => void;
  };
  // Layout configuration
  layout?: {
    type: 'grid' | 'flex' | 'tabs' | 'accordion' | 'stepper';
    columns?: number;
    gap?: string;
    responsive?: boolean;
    className?: string;
  };
  // Conditional sections
  conditionalSections?: {
    condition: (values: TFormValues) => boolean;
    fields: string[];
    layout?: {
      type: 'grid' | 'flex' | 'tabs' | 'accordion' | 'stepper';
      columns?: number;
      gap?: string;
      responsive?: boolean;
      className?: string;
    };
  }[];
  // Form persistence
  persistence?: {
    key: string;
    storage: 'localStorage' | 'sessionStorage';
    debounceMs?: number;
    exclude?: string[];
    restoreOnMount?: boolean;
  };
}

// Note: Using 'any' here is necessary because field components have different specific prop requirements
// that cannot be unified into a single type without losing type safety within each component
const defaultFieldComponents: Record<string, React.ComponentType<any>> = {
  text: TextField,
  email: TextField,
  password: TextField,
  url: TextField,
  textarea: TextareaField,
  select: SelectField,
  checkbox: CheckboxField,
  switch: SwitchField,
  number: NumberField,
  date: DateField,
  slider: SliderField,
  file: FileUploadField,
  array: ArrayField,
  radio: RadioField,
  multiSelect: MultiSelectField,
  colorPicker: ColorPickerField,
  rating: RatingField,
  phone: PhoneField,
  location: LocationPickerField,
  duration: DurationPickerField,
  autocomplete: AutocompleteField,
  masked: MaskedInputField,
  object: ObjectField,
};

const DefaultProgressComponent: React.FC<{
  value: number;
  currentPage: number;
  totalPages: number;
  className?: string;
}> = ({ value, currentPage, totalPages, className }) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>Step {currentPage} of {totalPages}</span>
      <span>{Math.round(value)}%</span>
    </div>
    <Progress value={value} className="h-2" />
  </div>
);

const DefaultPageComponent: React.FC<{
  children: React.ReactNode;
  title?: string;
  description?: string;
  page: number;
  totalPages: number;
}> = ({ children, title, description }) => (
  <div className="space-y-6">
    {(title || description) && (
      <div className="space-y-2">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    )}
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

interface SectionRendererProps {
  sectionKey: string;
  sectionData: {
    section?: {
      title: string;
      description?: string;
      collapsible?: boolean;
      defaultExpanded?: boolean;
    };
    groups: Record<string, FieldConfig[]>;
  };
  renderField: (field: FieldConfig) => React.ReactNode;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ sectionKey, sectionData, renderField }) => {
  const { section, groups } = sectionData;
  const [isExpanded, setIsExpanded] = React.useState(
    section?.defaultExpanded !== false
  );

  const sectionContent = (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupKey, groupFields]) => (
        <div key={groupKey} className={cn(
          groupKey !== 'default' ? "p-4 border rounded-lg bg-muted/20" : ""
        )}>
          {groupKey !== 'default' && (
            <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
              {groupKey}
            </h4>
          )}
          <div className={cn(
            groupKey !== 'default' ? "space-y-3" : "space-y-4"
          )}>
            {(groupFields as FieldConfig[]).map(field => renderField(field))}
          </div>
        </div>
      ))}
    </div>
  );

  if (section && sectionKey !== 'default') {
    return (
      <div key={sectionKey} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.collapsible && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
          {section.description && (
            <p className="text-muted-foreground text-sm">{section.description}</p>
          )}
        </div>
        
        {(!section.collapsible || isExpanded) && sectionContent}
      </div>
    );
  }

  return sectionContent;
};

export function useFormedible<TFormValues extends Record<string, unknown>>(
  options: UseFormedibleOptions<TFormValues>
) {
  const {
    fields = [],

    submitLabel = "Submit",
    nextLabel = "Next",
    previousLabel = "Previous",
    formClassName,
    fieldClassName,
    pages,
    progress,
    tabs,
    defaultComponents,
    globalWrapper,
    formOptions,
    onPageChange,
    autoSubmitOnChange,
    autoSubmitDebounceMs,
    disabled,
    loading,
    resetOnSubmitSuccess,
    showSubmitButton = true,
    onFormReset,
    onFormInput,
    onFormInvalid,
    onFormKeyDown,
    onFormKeyUp,
    onFormFocus,
    onFormBlur,
    // Advanced features
    crossFieldValidation = [],
    asyncValidation = {},
    analytics,
    conditionalSections = [],
    persistence,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);
  
  // Advanced features state
  const [crossFieldErrors, setCrossFieldErrors] = useState<Record<string, string>>({});
  const [asyncValidationStates, setAsyncValidationStates] = useState<Record<string, { loading: boolean; error?: string }>>({});
  const [formStartTime] = useState<number>(Date.now());
  const [fieldFocusTimes, setFieldFocusTimes] = useState<Record<string, number>>({});
  const [pageStartTime, setPageStartTime] = useState<number>(Date.now());

  // Combine default components with user overrides
  const fieldComponents = { ...defaultFieldComponents, ...defaultComponents };

  // Group fields by pages
  const fieldsByPage = useMemo(() => {
    const grouped: { [page: number]: FieldConfig[] } = {};
    
    fields.forEach(field => {
      const page = field.page || 1;
      if (!grouped[page]) grouped[page] = [];
      grouped[page].push(field);
    });

    return grouped;
  }, [fields]);

  // Group fields by tabs
  const fieldsByTab = useMemo(() => {
    const grouped: { [tab: string]: FieldConfig[] } = {};
    
    fields.forEach(field => {
      const tab = field.tab || 'default';
      if (!grouped[tab]) grouped[tab] = [];
      grouped[tab].push(field);
    });

    return grouped;
  }, [fields]);

  const totalPages = Math.max(...Object.keys(fieldsByPage).map(Number), 1);
  const hasPages = totalPages > 1;
  const hasTabs = tabs && tabs.length > 0;

  // Calculate progress
  const progressValue = hasPages ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100;

  // Create a ref to store the form instance for the onSubmit callback
  const formRef = React.useRef<FormedibleFormApi<TFormValues> | null>(null);
  
  // Refs for async validation debouncing
  const asyncValidationTimeouts = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Keep track of AbortControllers for async validations
  const asyncValidationAbortControllers = React.useRef<Record<string, AbortController>>({});
  
  // Cross-field validation function
  const validateCrossFields = React.useCallback((values: Partial<TFormValues>) => {
    const errors: Record<string, string> = {};
    
    crossFieldValidation.forEach((validation) => {
      const relevantValues = validation.fields.reduce((acc, field) => {
        acc[field] = values[field];
        return acc;
      }, {} as Partial<TFormValues>);
      
      const error = validation.validator(relevantValues);
      if (error) {
        validation.fields.forEach(field => {
          errors[field as string] = validation.message;
        });
      }
    });
    
    setCrossFieldErrors(errors);
    return errors;
  }, [crossFieldValidation]);
  
  // Async validation function
  const validateFieldAsync = React.useCallback(async (fieldName: string, value: unknown) => {
    const asyncConfig = asyncValidation[fieldName];
    if (!asyncConfig) return;
    
    // Cancel any existing validation for this field
    if (asyncValidationAbortControllers.current[fieldName]) {
      asyncValidationAbortControllers.current[fieldName].abort();
    }
    
    // Create new abort controller
    const abortController = new AbortController();
    asyncValidationAbortControllers.current[fieldName] = abortController;
    
    // Clear existing timeout
    if (asyncValidationTimeouts.current[fieldName]) {
      clearTimeout(asyncValidationTimeouts.current[fieldName]);
    }
    
    // Set loading state
    setAsyncValidationStates(prev => ({
      ...prev,
      [fieldName]: { loading: true }
    }));
    
    // Debounce the validation
    asyncValidationTimeouts.current[fieldName] = setTimeout(async () => {
      try {
        if (abortController.signal.aborted) return;
        
        const error = await asyncConfig.validator(value);
        
        if (abortController.signal.aborted) return;
        
        setAsyncValidationStates(prev => ({
          ...prev,
          [fieldName]: { loading: false, error: error || undefined }
        }));
        
        // Update form field error if needed
        if (formRef.current) {
          formRef.current?.setFieldMeta(fieldName, (prev) => ({
            ...prev,
            errors: error ? [error] : []
          }));
        }
      } catch {
        setAsyncValidationStates(prev => ({
          ...prev,
          [fieldName]: { loading: false, error: 'Validation failed' }
        }));
      }
    }, asyncConfig.debounceMs || 500);
  }, [asyncValidation]);

  // Setup form with schema validation if provided
  const formConfig = {
    ...formOptions,
    ...(resetOnSubmitSuccess && formOptions?.onSubmit && {
      onSubmit: async (props: { value: TFormValues; formApi: FormedibleFormApi<TFormValues> }) => {
        // Run cross-field validation before submit
        const crossFieldErrors = validateCrossFields(props.value as Partial<TFormValues>);
        if (Object.keys(crossFieldErrors).length > 0) {
          throw new Error('Cross-field validation failed');
        }
        
        // Call analytics if provided
        if (analytics?.onFormComplete) {
          const timeSpent = Date.now() - formStartTime;
          analytics.onFormComplete(timeSpent, props.value);
        }
        
        const result = await formOptions.onSubmit!(props);
        
        // Clear storage on successful submit
        clearStorage();
        
        // Reset form on successful submit if option is enabled
        if (formRef.current) {
          formRef.current?.reset();
        }
        return result;
      }
    })
  };

  const form = useForm(formConfig);

  // Store form reference for the onSubmit callback
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Form persistence logic
  const persistenceTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  const saveToStorage = React.useCallback((values: Partial<TFormValues>) => {
    if (!persistence) return;
    
    try {
      const storage = persistence.storage === 'localStorage' ? localStorage : sessionStorage;
      const filteredValues = persistence.exclude 
        ? Object.fromEntries(
            Object.entries(values as Record<string, unknown>).filter(([key]) => !persistence.exclude!.includes(key))
          )
        : values;
      
      storage.setItem(persistence.key, JSON.stringify({
        values: filteredValues,
        timestamp: Date.now(),
        currentPage
      }));
    } catch (error) {
      console.warn('Failed to save form data to storage:', error);
    }
  }, [persistence, currentPage]);
  
  const clearStorage = React.useCallback(() => {
    if (!persistence) return;
    
    try {
      const storage = persistence.storage === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem(persistence.key);
    } catch (error) {
      console.warn('Failed to clear form data from storage:', error);
    }
  }, [persistence]);
  
  const loadFromStorage = React.useCallback(() => {
    if (!persistence?.restoreOnMount) return null;
    
    try {
      const storage = persistence.storage === 'localStorage' ? localStorage : sessionStorage;
      const saved = storage.getItem(persistence.key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load form data from storage:', error);
    }
    return null;
  }, [persistence]);

  // Restore form data on mount
  React.useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData && savedData.values) {
      // Restore form values
      Object.entries(savedData.values as Record<string, unknown>).forEach(([key, value]) => {
        try {
          form.setFieldValue(key as keyof TFormValues & string, value as any);
        } catch (error) {
          console.warn(`Failed to restore field value for ${key}:`, error);
        }
      });
      
      // Restore current page if it was saved
      if (savedData.currentPage && savedData.currentPage <= totalPages) {
        setCurrentPage(savedData.currentPage);
      }
    }
  }, [loadFromStorage, form, totalPages]);

  // Set up form event listeners if provided
  React.useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    let autoSubmitTimeout: ReturnType<typeof setTimeout>;
    let onChangeTimeout: ReturnType<typeof setTimeout>;
    let onBlurTimeout: ReturnType<typeof setTimeout>;

    // Call analytics onFormStart if provided
    if (analytics?.onFormStart) {
      analytics.onFormStart(formStartTime);
    }

    if (formOptions?.onChange || autoSubmitOnChange || crossFieldValidation.length > 0 || analytics || persistence) {
      const unsubscribe = form.store.subscribe(() => {
        const formApi = form;
        const values = formApi.state.values;
        
        // Run cross-field validation on change
        if (crossFieldValidation.length > 0) {
          validateCrossFields(values as Partial<TFormValues>);
        }
        
        // Save to storage (debounced)
        if (persistence) {
          clearTimeout(persistenceTimeout.current);
          persistenceTimeout.current = setTimeout(() => {
            saveToStorage(values as Partial<TFormValues>);
          }, persistence.debounceMs || 1000);
        }
        
        // Call user's onChange handler only if form is valid (debounced)
        if (formOptions?.onChange && formApi.state.isValid) {
          clearTimeout(onChangeTimeout);
          onChangeTimeout = setTimeout(() => {
            formOptions.onChange!({ value: values as TFormValues, formApi });
          }, 300); // 300ms debounce
        }

        // Handle auto-submit on change
        if (autoSubmitOnChange && !disabled && !loading) {
          clearTimeout(autoSubmitTimeout);
          autoSubmitTimeout = setTimeout(() => {
            if (form.state.canSubmit) {
              form.handleSubmit();
            }
          }, autoSubmitDebounceMs);
        }
      });
      unsubscribers.push(unsubscribe);
    }

    // Set up onBlur event listener and analytics tracking
    if (formOptions?.onBlur || analytics) {
      let lastFocusedField: string | null = null;
      
      const handleBlur = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        const fieldName = target.getAttribute('name');
        
        if (fieldName && lastFocusedField === fieldName) {
          // Analytics tracking
          if (analytics?.onFieldBlur && fieldFocusTimes[fieldName]) {
            const timeSpent = Date.now() - fieldFocusTimes[fieldName];
            analytics.onFieldBlur(fieldName, timeSpent);
          }
          
          // User's onBlur handler
          if (formOptions?.onBlur) {
            clearTimeout(onBlurTimeout);
            onBlurTimeout = setTimeout(() => {
              const formApi = form;
              const values = formApi.state.values;
              formOptions.onBlur!({ value: values as TFormValues, formApi });
            }, 100); // 100ms debounce for blur
          }
        }
      };

      const handleFocus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        const fieldName = target.getAttribute('name');
        lastFocusedField = fieldName;
        
        // Analytics tracking
        if (fieldName && analytics?.onFieldFocus) {
          const timestamp = Date.now();
          setFieldFocusTimes(prev => ({ ...prev, [fieldName]: timestamp }));
          analytics.onFieldFocus(fieldName, timestamp);
        }
      };

      const handleChange = (event: Event) => {
        const target = event.target as HTMLElement;
        const fieldName = target.getAttribute('name');
        
        if (fieldName && analytics?.onFieldChange) {
          const value = (target as HTMLInputElement).value;
          analytics.onFieldChange(fieldName, value, Date.now());
          
          // Trigger async validation if configured
          if (asyncValidation[fieldName]) {
            validateFieldAsync(fieldName, value);
          }
        }
      };

      // Add event listeners to document for blur/focus/change events
      document.addEventListener('blur', handleBlur, true);
      document.addEventListener('focus', handleFocus, true);
      document.addEventListener('change', handleChange, true);
      document.addEventListener('input', handleChange, true);
      
      unsubscribers.push(() => {
        document.removeEventListener('blur', handleBlur, true);
        document.removeEventListener('focus', handleFocus, true);
        document.removeEventListener('change', handleChange, true);
        document.removeEventListener('input', handleChange, true);
      });
    }

    // Clean up timeouts on unmount
    unsubscribers.push(() => {
      clearTimeout(autoSubmitTimeout);
      clearTimeout(onChangeTimeout);
      clearTimeout(onBlurTimeout);
      clearTimeout(persistenceTimeout.current);
      // Clear async validation timeouts
      Object.values(asyncValidationTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      
      // Cancel all in-flight async validations
      Object.values(asyncValidationAbortControllers.current).forEach(controller => {
        controller.abort();
      });
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    form, 
    autoSubmitOnChange, 
    autoSubmitDebounceMs, 
    disabled, 
    loading, 
    formOptions?.onChange, 
    formOptions?.onBlur,
    crossFieldValidation,
    analytics,
    asyncValidation,
    fieldFocusTimes,
    validateFieldAsync,
    persistence,
    saveToStorage,
    currentPage,
    formStartTime,
    validateCrossFields
  ]);

  const getCurrentPageFields = () => {
    if (hasTabs) {
      // When using tabs, return all fields (tabs handle their own filtering)
      return fields;
    }
    return fieldsByPage[currentPage] || [];
  };

  const getCurrentPageConfig = () => pages?.find(p => p.page === currentPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      // Check if current page has validation errors
      const currentPageFields = getCurrentPageFields();
      const formState = form.state;
      
      const hasPageErrors = currentPageFields.some(field => {
        const fieldState = formState.fieldMeta[field.name as keyof typeof formState.fieldMeta];
        return fieldState && fieldState.errors && fieldState.errors.length > 0;
      });

      if (hasPageErrors) {
        // Mark all fields on current page as touched to show validation errors
        currentPageFields.forEach(field => {
          form.setFieldMeta(field.name, (prev) => ({ ...prev, isTouched: true }));
        });
        return; // Don't navigate if there are errors
      }

      const newPage = currentPage + 1;
      
      // Analytics tracking
      if (analytics?.onPageChange) {
        const timeSpent = Date.now() - pageStartTime;
        analytics.onPageChange(currentPage, newPage, timeSpent);
      }
      
      setCurrentPage(newPage);
      setPageStartTime(Date.now());
      onPageChange?.(newPage, 'next');
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      
      // Analytics tracking
      if (analytics?.onPageChange) {
        const timeSpent = Date.now() - pageStartTime;
        analytics.onPageChange(currentPage, newPage, timeSpent);
      }
      
      setCurrentPage(newPage);
      setPageStartTime(Date.now());
      onPageChange?.(newPage, 'previous');
    }
  };

  const isLastPage = currentPage === totalPages;
  const isFirstPage = currentPage === 1;

  // Validated setCurrentPage that checks all pages between current and target
  const setCurrentPageWithValidation = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === currentPage) {
      return;
    }

    // If going forward, validate all pages between current and target
    if (targetPage > currentPage) {
      for (let page = currentPage; page < targetPage; page++) {
        const pageFields = fieldsByPage[page] || [];
        const formState = form.state;
        
        const hasPageErrors = pageFields.some(field => {
        const fieldState = formState.fieldMeta[field.name as keyof typeof formState.fieldMeta];
          return fieldState && fieldState.errors && fieldState.errors.length > 0;
        });

        if (hasPageErrors) {
          // Mark all fields on this page as touched to show validation errors
          pageFields.forEach(field => {
            form.setFieldMeta(field.name, (prev) => ({ ...prev, isTouched: true }));
          });
          return; // Don't navigate if there are errors
        }
      }
    }

    // If validation passes or going backward, allow navigation
    setCurrentPage(targetPage);
    onPageChange?.(targetPage, targetPage > currentPage ? 'next' : 'previous');
  };

  const Form: React.FC<FormProps> = ({ 
    className, 
    children, 
    onSubmit,
    // HTML form attributes
    action,
    method,
    encType,
    target,
    autoComplete,
    noValidate,
    acceptCharset,
    // Event handlers
    onReset,
    onInput,
    onInvalid,
    onKeyDown,
    onKeyUp,

    onFocus,
    onBlur,
    // Accessibility
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    tabIndex,
  }) => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (onSubmit) {
        onSubmit(e);
      } else if (isLastPage) {
        form.handleSubmit();
      } else {
        goToNextPage();
      }
    };

    const handleReset = (e: React.FormEvent) => {
      if (onReset) {
        onReset(e);
      }
      if (onFormReset) {
        onFormReset(e, form);
      }
      form.reset();
    };

    const handleInput = (e: React.FormEvent) => {
      if (onInput) {
        onInput(e);
      }
      if (onFormInput) {
        onFormInput(e, form);
      }
    };

    const handleInvalid = (e: React.FormEvent) => {
      if (onInvalid) {
        onInvalid(e);
      }
      if (onFormInvalid) {
        onFormInvalid(e, form);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (onKeyDown) {
        onKeyDown(e);
      }
      if (onFormKeyDown) {
        onFormKeyDown(e, form);
      }
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
      if (onKeyUp) {
        onKeyUp(e);
      }
      if (onFormKeyUp) {
        onFormKeyUp(e, form);
      }
    };

    // Tab state for controlled FormTabs component
    const [activeTab, setActiveTab] = useState(() => {
      if (tabs && tabs.length > 0) return tabs[0].id;
      return '';
    });



    const handleFocus = (e: React.FocusEvent) => {
      if (onFocus) {
        onFocus(e);
      }
      if (onFormFocus) {
        onFormFocus(e, form);
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      if (onBlur) {
        onBlur(e);
      }
      if (onFormBlur) {
        onFormBlur(e, form);
      }
    };

    const formClass = cn("space-y-6", formClassName, className);

    const renderField = React.useCallback((fieldConfig: FieldConfig) => {
      const { 
        name, 
        type, 
        label, 
        placeholder, 
        description, 
        options,
        min,
        max,
        step,
        accept,
        multiple,
        component: CustomComponent,
        wrapper: CustomWrapper,
        conditional,
        validation,
        arrayConfig,
        datalist,
        help,
        inlineValidation,

        ratingConfig,
        phoneConfig,
        colorConfig,
        multiSelectConfig,
        locationConfig,
        durationConfig,
        autocompleteConfig,
        maskedInputConfig,
        objectConfig,
        sliderConfig,
        numberConfig,
        dateConfig,
        fileConfig,
        textareaConfig,
        passwordConfig,
        emailConfig
      } = fieldConfig;

      return (
        <form.Field 
          key={name} 
          name={name as keyof TFormValues & string}
          validators={validation ? { 
            onChange: ({ value }) => {
              const result = validation.safeParse(value);
              return result.success ? undefined : result.error.errors[0]?.message || 'Invalid value';
            }
          } : undefined}
        >
          {(field) => {
            // Get current form values directly from the field
            const currentValues = field.form.state.values;
            
            // Check conditional rendering with current form values
            if (conditional && !conditional(currentValues)) {
              return null;
            }

            // Check for cross-field validation errors
            const crossFieldError = crossFieldErrors[name];
            const asyncValidationState = asyncValidationStates[name];
            
            const baseProps = {
              fieldApi: field,
              label,
              placeholder,
              description,
              wrapperClassName: fieldClassName,
              min,
              max,
              step,
              accept,
              multiple,
              disabled: disabled || loading || field.form.state.isSubmitting,
              crossFieldError,
              asyncValidationState,
            };

            // Select the component to use
            const FieldComponent = CustomComponent || fieldComponents[type] || TextField;

            // Add type-specific props
            let props: FieldComponentProps = { ...baseProps };
            
            // Normalize options to the expected format
            const normalizedOptions = options ? options.map(opt => 
              typeof opt === 'string' ? { value: opt, label: opt } : opt
            ) : [];

            if (type === 'select') {
              props = { ...props, options: normalizedOptions };
            } else if (type === 'array') {
              const mappedArrayConfig = arrayConfig ? {
                itemType: arrayConfig.itemType || 'text',
                itemLabel: arrayConfig.itemLabel,
                itemPlaceholder: arrayConfig.itemPlaceholder,
                minItems: arrayConfig.minItems,
                maxItems: arrayConfig.maxItems,
                itemValidation: arrayConfig.itemValidation,
                itemComponent: arrayConfig.itemComponent as React.ComponentType<BaseFieldProps>,
                addButtonLabel: arrayConfig.addButtonLabel,
                removeButtonLabel: arrayConfig.removeButtonLabel,
                sortable: arrayConfig.sortable,
                defaultValue: arrayConfig.defaultValue
              } : undefined;
              props = { ...props, arrayConfig: mappedArrayConfig };
            } else if (['text', 'email', 'password', 'url', 'tel'].includes(type)) {
              props = { ...props, type: type as 'text' | 'email' | 'password' | 'url' | 'tel', datalist: datalist?.options };
            } else if (type === 'radio') {
              props = { ...props, options: normalizedOptions };
            } else if (type === 'multiSelect') {
              props = { ...props, options: normalizedOptions, multiSelectConfig };
            } else if (type === 'colorPicker') {
              props = { ...props, colorConfig };
            } else if (type === 'rating') {
              props = { ...props, ratingConfig };
            } else if (type === 'phone') {
              props = { ...props, phoneConfig };
            } else if (type === 'location') {
              props = { ...props, locationConfig };
            } else if (type === 'duration') {
              props = { ...props, durationConfig };
            } else if (type === 'autocomplete') {
              props = { ...props, autocompleteConfig };
            } else if (type === 'masked') {
              props = { ...props, maskedInputConfig };
            } else if (type === 'object') {
              props = { ...props, objectConfig };
            } else if (type === 'slider') {
              props = { ...props, sliderConfig };
            } else if (type === 'number') {
              props = { ...props, numberConfig };
            } else if (type === 'date') {
              props = { ...props, dateConfig };
            } else if (type === 'file') {
              props = { ...props, fileConfig };
            } else if (type === 'textarea') {
              props = { ...props, textareaConfig };
            } else if (type === 'password') {
              props = { ...props, passwordConfig };
            } else if (type === 'email') {
              props = { ...props, emailConfig };
            }

            // Render the field component
            const fieldElement = <FieldComponent {...props} />;

            // Apply inline validation wrapper if enabled
            const wrappedFieldElement = inlineValidation?.enabled 
              ? (
                  <InlineValidationWrapper
                    fieldApi={field}
                    inlineValidation={inlineValidation}
                  >
                    {fieldElement}
                  </InlineValidationWrapper>
                )
              : fieldElement;

            // Add field help if provided
            const fieldWithHelp = help ? (
              <div className="space-y-2">
                {wrappedFieldElement}
                <FieldHelp help={help} />
              </div>
            ) : wrappedFieldElement;

            // Apply custom wrapper or global wrapper
            const Wrapper = CustomWrapper || globalWrapper;
            
            return Wrapper 
              ? <Wrapper field={fieldConfig}>{fieldWithHelp}</Wrapper>
              : fieldWithHelp;
          }}
        </form.Field>
      );
    }, [form, fieldComponents, globalWrapper, disabled, loading, crossFieldErrors, asyncValidationStates, fieldClassName]);

    const renderTabContent = React.useCallback((tabFields: FieldConfig[]) => {
      const currentValues = form.state.values;
      
      // Filter fields based on conditional sections
      const visibleFields = tabFields.filter(field => {
        // Check if field is part of any conditional section
        const conditionalSection = conditionalSections.find(section => 
          section.fields.includes(field.name)
        );
        
        if (conditionalSection) {
          return conditionalSection.condition(currentValues as TFormValues);
        }
        
        return true;
      });
      
      // Group fields by section and group
      const groupedFields = visibleFields.reduce((acc, field) => {
        const sectionKey = field.section?.title || 'default';
        const groupKey = field.group || 'default';
        
        if (!acc[sectionKey]) {
          acc[sectionKey] = {
            section: field.section,
            groups: {}
          };
        }
        
        if (!acc[sectionKey].groups[groupKey]) {
          acc[sectionKey].groups[groupKey] = [];
        }
        
        acc[sectionKey].groups[groupKey].push(field);
        return acc;
      }, {} as Record<string, { section?: { title: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean }; groups: Record<string, FieldConfig[]> }>);

      const renderSection = (sectionKey: string, sectionData: { section?: { title: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean }; groups: Record<string, FieldConfig[]> }) => (
        <SectionRenderer
          key={sectionKey}
          sectionKey={sectionKey}
          sectionData={sectionData}
          renderField={renderField}
        />
      );

      const sectionsToRender = Object.entries(groupedFields);
      
      return sectionsToRender.length === 1 && sectionsToRender[0][0] === 'default' 
        ? sectionsToRender[0][1].groups.default?.map((field: FieldConfig) => renderField(field))
        : sectionsToRender.map(([sectionKey, sectionData]) => 
            renderSection(sectionKey, sectionData)
          );
    }, [form.state.values, conditionalSections, renderField]);

    const renderPageContent = React.useCallback(() => {
      if (hasTabs) {
        // Render tabs - memoize tab content to prevent rerenders
        const tabsToRender = tabs!.map(tab => ({
          id: tab.id,
          label: tab.label,
          content: renderTabContent(fieldsByTab[tab.id] || [])
        }));

        return (
          <FormTabs
            tabs={tabsToRender}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        );
      }

      // Original page rendering logic
      const currentFields = getCurrentPageFields();
      const pageConfig = getCurrentPageConfig();
      const currentValues = form.state.values;
      
      // Filter fields based on conditional sections
      const visibleFields = currentFields.filter(field => {
        // Check if field is part of any conditional section
        const conditionalSection = conditionalSections.find(section => 
          section.fields.includes(field.name)
        );
        
        if (conditionalSection) {
          return conditionalSection.condition(currentValues as TFormValues);
        }
        
        return true;
      });
      
      // Group fields by section and group
      const groupedFields = visibleFields.reduce((acc, field) => {
        const sectionKey = field.section?.title || 'default';
        const groupKey = field.group || 'default';
        
        if (!acc[sectionKey]) {
          acc[sectionKey] = {
            section: field.section,
            groups: {}
          };
        }
        
        if (!acc[sectionKey].groups[groupKey]) {
          acc[sectionKey].groups[groupKey] = [];
        }
        
        acc[sectionKey].groups[groupKey].push(field);
        return acc;
      }, {} as Record<string, { section?: { title: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean }; groups: Record<string, FieldConfig[]> }>);

      const renderSection = (sectionKey: string, sectionData: { section?: { title: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean }; groups: Record<string, FieldConfig[]> }) => (
        <SectionRenderer
          key={sectionKey}
          sectionKey={sectionKey}
          sectionData={sectionData}
          renderField={renderField}
        />
      );

      const sectionsToRender = Object.entries(groupedFields);
      
      const PageComponent = pageConfig?.component || DefaultPageComponent;

      return (
        <PageComponent
          title={pageConfig?.title}
          description={pageConfig?.description}
          page={currentPage}
          totalPages={totalPages}
        >
          {sectionsToRender.length === 1 && sectionsToRender[0][0] === 'default' 
                         ? sectionsToRender[0][1].groups.default?.map((field: FieldConfig) => renderField(field))
            : sectionsToRender.map(([sectionKey, sectionData]) => 
                renderSection(sectionKey, sectionData)
              )
          }
        </PageComponent>
      );
    }, [hasTabs, tabs, fieldsByTab, renderTabContent, getCurrentPageFields, getCurrentPageConfig, form.state.values, conditionalSections, renderField, currentPage, totalPages]);

    const renderProgress = () => {
      if (!hasPages || !progress) return null;

      const ProgressComponent = progress.component || DefaultProgressComponent;
      
      return (
        <ProgressComponent
          value={progressValue}
          currentPage={currentPage}
          totalPages={totalPages}
          className={progress.className}
        />
      );
    };

    const renderNavigation = () => {
      if (!showSubmitButton) return null;
      if (!hasPages) {
        return (
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {(state) => {
              const { canSubmit, isSubmitting } = state as { canSubmit: boolean; isSubmitting: boolean };
              return (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || disabled || loading}
                  className="w-full"
                >
                  {loading ? "Loading..." : isSubmitting ? "Submitting..." : submitLabel}
                </Button>
              );
            }}
          </form.Subscribe>
        );
      }

      return (
        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {(state) => {
            const { canSubmit, isSubmitting } = state as { canSubmit: boolean; isSubmitting: boolean };
            return (
              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={isFirstPage || disabled || loading}
                  className={isFirstPage ? "invisible" : ""}
                >
                  {previousLabel}
                </Button>
                
                <Button
                  type="submit"
                  disabled={(!canSubmit || isSubmitting || disabled || loading) && isLastPage}
                  className="flex-1 max-w-xs"
                >
                  {loading && isLastPage
                    ? "Loading..."
                    : isSubmitting && isLastPage
                    ? "Submitting..."
                    : isLastPage
                    ? submitLabel
                    : nextLabel}
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      );
    };

          return (
        <form 
          onSubmit={handleSubmit} 
          className={formClass}
          action={action}
          method={method}
          encType={encType}
          target={target}
          autoComplete={autoComplete}
          noValidate={noValidate}
          acceptCharset={acceptCharset}
          onReset={handleReset}
          onInput={handleInput}
          onInvalid={handleInvalid}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}

          onFocus={handleFocus}
          onBlur={handleBlur}
          role={role}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-describedby={ariaDescribedby}
          tabIndex={tabIndex}
        >
        {children || (
          <>
            {renderProgress()}
            {renderPageContent()}
            {renderNavigation()}
          </>
        )}
      </form>
    );
  };

  return {
    form,
    Form,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage: setCurrentPageWithValidation,
    isFirstPage,
    isLastPage,
    progressValue,
    // Advanced features
    crossFieldErrors,
    asyncValidationStates,
    validateCrossFields,
    validateFieldAsync,
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
}
