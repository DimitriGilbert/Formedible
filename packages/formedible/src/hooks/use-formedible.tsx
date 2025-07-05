"use client";
import React, { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TextField } from "@/components/fields/text-field";
import { TextareaField } from "@/components/fields/textarea-field";
import { SelectField } from "@/components/fields/select-field";
import { CheckboxField } from "@/components/fields/checkbox-field";
import { SwitchField } from "@/components/fields/switch-field";
import { NumberField } from "@/components/fields/number-field";
import { DateField } from "@/components/fields/date-field";
import { SliderField } from "@/components/fields/slider-field";
import { FileUploadField } from "@/components/fields/file-upload-field";
import { ArrayField } from "@/components/fields/array-field";
import { RadioField } from "@/components/fields/radio-field";
import { MultiSelectField } from "@/components/fields/multi-select-field";
import { ColorPickerField } from "@/components/fields/color-picker-field";
import { RatingField } from "@/components/fields/rating-field";
import { PhoneField } from "@/components/fields/phone-field";
import { InlineValidationWrapper } from "@/components/fields/inline-validation-wrapper";
import { FieldHelp } from "@/components/fields/field-help";

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
  onKeyPress?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  // Accessibility
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  tabIndex?: number;
}

interface FieldConfig {
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
  component?: React.ComponentType<any>;
  wrapper?: React.ComponentType<{ children: React.ReactNode; field: FieldConfig }>;
  page?: number;
  validation?: z.ZodSchema<any>;
  dependencies?: string[];
  conditional?: (values: any) => boolean;
  // Array field configuration
  arrayConfig?: {
    itemType: string; // Type of items in the array ('text', 'email', 'number', etc.)
    itemLabel?: string; // Label for each item (e.g., "Email Address")
    itemPlaceholder?: string; // Placeholder for each item
    itemValidation?: z.ZodSchema<any>; // Validation for each item
    minItems?: number; // Minimum number of items
    maxItems?: number; // Maximum number of items
    addButtonLabel?: string; // Label for add button
    removeButtonLabel?: string; // Label for remove button
    itemComponent?: React.ComponentType<any>; // Custom component for each item
    sortable?: boolean; // Whether items can be reordered
    defaultValue?: any; // Default value for new items
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
    asyncValidator?: (value: any) => Promise<string | null>; // Async validation function
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
  defaultComponents?: {
    [key: string]: React.ComponentType<any>;
  };
  globalWrapper?: React.ComponentType<{ children: React.ReactNode; field: FieldConfig }>;
  formOptions?: Partial<{
    defaultValues: TFormValues;
    onSubmit: (props: { value: TFormValues; formApi: any }) => any | Promise<any>;
    onSubmitInvalid: (props: { value: TFormValues; formApi: any }) => void;
    onChange?: (props: { value: TFormValues; formApi: any }) => void;
    onBlur?: (props: { value: TFormValues; formApi: any }) => void;
    onFocus?: (props: { value: TFormValues; formApi: any }) => void;
    onReset?: (props: { value: TFormValues; formApi: any }) => void;
    asyncDebounceMs: number;
    canSubmitWhenInvalid: boolean;
    validators: {
      onChange?: z.ZodSchema<any>;
      onChangeAsync?: z.ZodSchema<any>;
      onChangeAsyncDebounceMs?: number;
      onBlur?: z.ZodSchema<any>;
      onBlurAsync?: z.ZodSchema<any>;
      onBlurAsyncDebounceMs?: number;
      onSubmit?: z.ZodSchema<any>;
      onSubmitAsync?: z.ZodSchema<any>;
    };
  }>;
  onPageChange?: (page: number, direction: 'next' | 'previous') => void;
  autoSubmitOnChange?: boolean;
  autoSubmitDebounceMs?: number;
  disabled?: boolean;
  loading?: boolean;
  resetOnSubmitSuccess?: boolean;
  showSubmitButton?: boolean;
  // Form-level event handlers
  onFormReset?: (e: React.FormEvent, formApi: any) => void;
  onFormInput?: (e: React.FormEvent, formApi: any) => void;
  onFormInvalid?: (e: React.FormEvent, formApi: any) => void;
  onFormKeyDown?: (e: React.KeyboardEvent, formApi: any) => void;
  onFormKeyUp?: (e: React.KeyboardEvent, formApi: any) => void;
  onFormFocus?: (e: React.FocusEvent, formApi: any) => void;
  onFormBlur?: (e: React.FocusEvent, formApi: any) => void;
}

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
    section?: any;
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

export function useFormedible<TFormValues extends Record<string, any>>(
  options: UseFormedibleOptions<TFormValues>
) {
  const {
    fields = [],
    schema,
    submitLabel = "Submit",
    nextLabel = "Next",
    previousLabel = "Previous",
    formClassName,
    fieldClassName,
    pages = [],
    progress,
    defaultComponents = {},
    globalWrapper,
    formOptions,
    onPageChange,
    autoSubmitOnChange = false,
    autoSubmitDebounceMs = 1000,
    disabled = false,
    loading = false,
    resetOnSubmitSuccess = false,
    showSubmitButton = true,
    // Form-level event handlers
    onFormReset,
    onFormInput,
    onFormInvalid,
    onFormKeyDown,
    onFormKeyUp,
    onFormFocus,
    onFormBlur,
  } = options;

  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(...Object.keys(fieldsByPage).map(Number), 1);
  const hasPages = totalPages > 1;

  // Calculate progress
  const progressValue = hasPages ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100;

  // Setup form with schema validation if provided
  const formConfig = {
    ...formOptions,
    ...(schema && {
      validators: {
        onChange: schema,
        ...formOptions?.validators,
      }
    }),
    ...(resetOnSubmitSuccess && formOptions?.onSubmit && {
      onSubmit: async (props: any) => {
        try {
          const result = await formOptions.onSubmit!(props);
          // Reset form on successful submit if option is enabled
          form.reset();
          return result;
        } catch (error) {
          throw error;
        }
      }
    })
  };

  const form = useForm(formConfig as any);

  // Set up form event listeners if provided
  React.useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    let autoSubmitTimeout: NodeJS.Timeout;
    let onChangeTimeout: NodeJS.Timeout;
    let onBlurTimeout: NodeJS.Timeout;

    if (formOptions?.onChange || autoSubmitOnChange) {
      const unsubscribe = form.store.subscribe(() => {
        const formApi = form;
        const values = formApi.state.values;
        
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

    // Set up onBlur event listener
    if (formOptions?.onBlur) {
      let lastFocusedField: string | null = null;
      
      const handleBlur = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        const fieldName = target.getAttribute('name');
        
        if (fieldName && lastFocusedField === fieldName) {
          clearTimeout(onBlurTimeout);
          onBlurTimeout = setTimeout(() => {
            const formApi = form;
            const values = formApi.state.values;
            formOptions.onBlur!({ value: values as TFormValues, formApi });
          }, 100); // 100ms debounce for blur
        }
      };

      const handleFocus = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        const fieldName = target.getAttribute('name');
        lastFocusedField = fieldName;
      };

      // Add event listeners to document for blur/focus events
      document.addEventListener('blur', handleBlur, true);
      document.addEventListener('focus', handleFocus, true);
      
      unsubscribers.push(() => {
        document.removeEventListener('blur', handleBlur, true);
        document.removeEventListener('focus', handleFocus, true);
      });
    }

    // Clean up timeouts on unmount
    unsubscribers.push(() => {
      clearTimeout(autoSubmitTimeout);
      clearTimeout(onChangeTimeout);
      clearTimeout(onBlurTimeout);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [form, autoSubmitOnChange, autoSubmitDebounceMs, disabled, loading, formOptions?.onChange, formOptions?.onBlur]);

  const getCurrentPageFields = () => fieldsByPage[currentPage] || [];

  const getCurrentPageConfig = () => pages.find(p => p.page === currentPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      // Check if current page has validation errors
      const currentPageFields = getCurrentPageFields();
      const formState = form.state;
      
      const hasPageErrors = currentPageFields.some(field => {
        const fieldState = formState.fieldMeta[field.name];
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
      setCurrentPage(newPage);
      onPageChange?.(newPage, 'next');
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
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
          const fieldState = formState.fieldMeta[field.name];
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
    onKeyPress,
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

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (onKeyPress) {
        onKeyPress(e);
      }
    };

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

    const renderField = (fieldConfig: FieldConfig) => {
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
        group,
        section,
        ratingConfig,
        phoneConfig,
        colorConfig,
        multiSelectConfig
      } = fieldConfig;

      return (
        <form.Field 
          key={name} 
          name={name as keyof TFormValues & string}
          validators={validation ? { onChange: validation } : undefined}
        >
          {(field) => {
            // Get current form values directly from the field
            const currentValues = field.form.state.values;
            
            // Check conditional rendering with current form values
            if (conditional && !conditional(currentValues)) {
              return null;
            }

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
            };

            // Select the component to use
            const FieldComponent = CustomComponent || fieldComponents[type] || TextField;

            // Add type-specific props
            let props: any = { ...baseProps };
            
            if (type === 'select') {
              props = { ...props, options: options || [] };
            } else if (type === 'array') {
              props = { ...props, arrayConfig };
            } else if (['text', 'email', 'password', 'url', 'tel'].includes(type)) {
              props = { ...props, type, datalist };
            } else if (type === 'radio') {
              props = { ...props, options: options || [] };
            } else if (type === 'multiSelect') {
              props = { ...props, options: options || [], multiSelectConfig };
            } else if (type === 'colorPicker') {
              props = { ...props, colorConfig };
            } else if (type === 'rating') {
              props = { ...props, ratingConfig };
            } else if (type === 'phone') {
              props = { ...props, phoneConfig };
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
    };

    const renderPageContent = () => {
      const currentFields = getCurrentPageFields();
      const pageConfig = getCurrentPageConfig();
      
      // Group fields by section and group
      const groupedFields = currentFields.reduce((acc, field) => {
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
      }, {} as Record<string, { section?: any; groups: Record<string, FieldConfig[]> }>);

      const renderSection = (sectionKey: string, sectionData: any) => (
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
    };

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
              const { canSubmit, isSubmitting } = state as any;
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
            const { canSubmit, isSubmitting } = state as any;
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
          onKeyPress={handleKeyPress}
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
  };
}
