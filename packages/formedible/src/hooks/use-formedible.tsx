"use client";
import React, { useState, useMemo, memo, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import type { AnyFormApi, AnyFieldApi } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import type {
  FormedibleFormApi,
  FieldComponentProps,
  BaseFieldProps,
  FieldConfig,
  FormProps,
  ConditionalFieldsSubscriptionProps,
  FieldConditionalRendererProps,
  UseFormedibleOptions,
  SectionRendererProps,
  LayoutConfig,
  FormGridProps,
  AnalyticsContext,
} from "@/lib/formedible/types";
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
import { FormGrid, GridItem } from "@/components/formedible/layout/form-grid";
import { resolveDynamicText } from "@/lib/formedible/template-interpolation";

// Utility function to scroll to top of a specific form
const scrollToTop = (
  htmlFormRef: React.RefObject<HTMLFormElement | null>,
  smooth = true,
  enabled = true
) => {
  if (typeof window !== "undefined" && htmlFormRef.current && enabled) {
    // Check if form is already in view to prevent unnecessary jumping
    const rect = htmlFormRef.current.getBoundingClientRect();
    const isInView = rect.top >= 0 && rect.top <= window.innerHeight * 0.3;

    if (!isInView) {
      htmlFormRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "start",
      });
    }
  }
};

// TanStack Form Best Practice: Reusable subscription component for conditional fields

const ConditionalFieldsSubscription = <
  TFormValues extends Record<string, unknown> = Record<string, unknown>
>({
  form,
  fields: _fields,
  conditionalSections: _conditionalSections,
  children,
}: ConditionalFieldsSubscriptionProps<TFormValues>) => {
  // For now, subscribe to all form values since we don't have explicit dependencies
  // This could be optimized further by analyzing the condition functions
  return (
    <form.Subscribe selector={(state: { values: TFormValues }) => state.values}>
      {(values: TFormValues) => children(values as Record<string, unknown>)}
    </form.Subscribe>
  );
};

// TanStack Form Best Practice: Individual field conditional renderer

const FieldConditionalRenderer = ({
  form,
  fieldConfig,
  children,
}: FieldConditionalRendererProps) => {
  const { conditional } = fieldConfig;

  // If no conditional logic, always render
  if (!conditional) {
    return <>{children(true)}</>;
  }

  // TanStack Form Best Practice: Use subscription with minimal selector
  // This prevents parent re-renders by only subscribing to form state changes
  return (
    <form.Subscribe selector={(state: any) => state.values}>
      {(values: any) => children(conditional(values))}
    </form.Subscribe>
  );
};

// Field components with proper typing - each component accepts FieldComponentProps
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
  showSteps?: boolean;
  showPercentage?: boolean;
}> = memo(
  ({
    value,
    currentPage,
    totalPages,
    className,
    showSteps = true,
    showPercentage = true,
  }) => (
    <div className={cn("space-y-2", className)}>
      {(showSteps || showPercentage) && (
        <div className="flex justify-between text-sm text-muted-foreground">
          {showSteps && (
            <span>
              Step {currentPage} of {totalPages}
            </span>
          )}
          {showPercentage && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <Progress value={value} className="h-2" />
    </div>
  )
);

DefaultProgressComponent.displayName = "DefaultProgressComponent";

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
    <div className="space-y-4">{children}</div>
  </div>
);

const SectionRenderer: React.FC<
  SectionRendererProps & {
    collapseLabel?: string;
    expandLabel?: string;
    form?: AnyFormApi;
    layout?: LayoutConfig;
  }
> = ({
  sectionKey,
  sectionData,
  renderField,
  collapseLabel = "Collapse",
  expandLabel = "Expand",
  form,
  layout,
}) => {
  const { section, groups } = sectionData;
  const [isExpanded, setIsExpanded] = React.useState(
    section?.defaultExpanded !== false
  );

  // Subscribe to form values for dynamic text resolution - always at top level
  const [subscribedValues, setSubscribedValues] = React.useState<
    Record<string, unknown>
  >(form?.state?.values || {});

  React.useEffect(() => {
    if (!form) return;
    const unsubscribe = form.store.subscribe((state) => {
      setSubscribedValues((state as any).values);
    });
    return unsubscribe;
  }, [form]);

  // Check if any fields in this section will actually render
  const hasVisibleFields = React.useMemo(() => {
    if (!form) return true; // Fallback to showing section if form is not available

    const currentValues = form.state.values;
    return Object.values(groups).some((groupFields) =>
      (groupFields as FieldConfig[]).some((field) => {
        // Check individual field conditional
        if (field.conditional && !field.conditional(currentValues)) {
          return false;
        }
        return true;
      })
    );
  }, [groups, form]);

  const renderSectionContent = () => {
    const allVisibleFields = Object.entries(groups).flatMap(
      ([groupKey, groupFields]) => {
        // Filter out fields that won't render due to conditionals
        const visibleGroupFields = (groupFields as FieldConfig[]).filter(
          (field) => {
            if (!form) return true;
            const currentValues = form.state.values;
            return !field.conditional || field.conditional(currentValues);
          }
        );

        return visibleGroupFields.map((field) => ({ ...field, groupKey }));
      }
    );

    // If layout is specified and is grid, use FormGrid
    if (layout && layout.type === "grid") {
      return (
        <FormGrid
          columns={layout.columns as FormGridProps["columns"]}
          gap={layout.gap as FormGridProps["gap"]}
          responsive={layout.responsive}
          className={layout.className}
        >
          {allVisibleFields.map((field) => (
            <GridItem
              key={field.name}
              gridColumn={field.gridColumn}
              gridRow={field.gridRow}
              gridColumnSpan={field.gridColumnSpan}
              gridRowSpan={field.gridRowSpan}
              gridArea={field.gridArea}
            >
              {renderField(field)}
            </GridItem>
          ))}
        </FormGrid>
      );
    }

    // For flex layouts, use simple flex wrapper
    if (layout && layout.type === "flex") {
      return (
        <div
          className={cn(
            "flex flex-wrap",
            layout.gap ? `gap-${layout.gap}` : "gap-4",
            layout.className
          )}
        >
          {allVisibleFields.map((field) => (
            <div key={field.name}>{renderField(field)}</div>
          ))}
        </div>
      );
    }

    // For vertical layouts or no layout, use the original group structure
    return (
      <div className="space-y-4">
        {Object.entries(groups).map(([groupKey, groupFields]) => {
          // Filter out fields that won't render due to conditionals
          const visibleGroupFields = (groupFields as FieldConfig[]).filter(
            (field) => {
              if (!form) return true;
              const currentValues = form.state.values;
              return !field.conditional || field.conditional(currentValues);
            }
          );

          // Don't render empty groups
          if (visibleGroupFields.length === 0) return null;

          return (
            <div
              key={groupKey}
              className={cn(
                groupKey !== "default"
                  ? "p-4 border rounded-lg bg-muted/20"
                  : ""
              )}
            >
              {groupKey !== "default" && (
                <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  {groupKey}
                </h4>
              )}
              <div
                className={groupKey !== "default" ? "space-y-3" : "space-y-4"}
              >
                {visibleGroupFields.map((field) => renderField(field))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const sectionContent = renderSectionContent();

  if (section && sectionKey !== "default") {
    // Don't render section if no fields are visible
    if (!hasVisibleFields) {
      return null;
    }

    return (
      <div key={sectionKey} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {section.title && (
              <h3 className="text-lg font-semibold">
                {resolveDynamicText(section.title, subscribedValues)}
              </h3>
            )}
            {section.collapsible && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isExpanded
                  ? resolveDynamicText(collapseLabel, subscribedValues)
                  : resolveDynamicText(expandLabel, subscribedValues)}
              </Button>
            )}
          </div>
          {section.description && (
            <p className="text-muted-foreground text-sm">
              {resolveDynamicText(section.description, subscribedValues)}
            </p>
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
    collapseLabel = "Collapse",
    expandLabel = "Expand",
    formClassName,
    fieldClassName,
    labelClassName,
    buttonClassName,
    submitButtonClassName,
    submitButton,
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
    autoScroll = false,
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
    layout,
  } = options;

  const htmlFormRef = useRef<HTMLFormElement>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Advanced features state
  const [crossFieldErrors, setCrossFieldErrors] = useState<
    Record<string, string>
  >({});
  const [asyncValidationStates, setAsyncValidationStates] = useState<
    Record<string, { loading: boolean; error?: string }>
  >({});

  // Enhanced analytics state management
  const analyticsContextRef = React.useRef<AnalyticsContext>({
    sessionId: `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`,
    formId: `form_${Date.now()}`,
    userId: undefined,
    currentPage: 1,
    currentTab: undefined,
    startTime: Date.now(),
    pageStates: {},
    tabStates: {},
    performanceMetrics: {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      validationDurations: {},
      submissionMetrics: {
        totalTime: 0,
        validationTime: 0,
        processingTime: 0,
      },
    },
    fieldInteractions: {},
  });

  // Form completion tracking to prevent incorrect abandonment analytics
  const formCompletedRef = React.useRef(false);

  // Legacy refs for backward compatibility
  const fieldFocusTimes = React.useRef<Record<string, number>>({});
  const pageStartTime = React.useRef<number>(Date.now());
  const tabStartTime = React.useRef<Record<string, number>>({});
  const tabVisitHistory = React.useRef<Set<string>>(new Set());

  // Track previous values to detect actual field changes
  const previousValues = React.useRef<Record<string, unknown>>({});

  // Combine default components with user overrides
  const fieldComponents = { ...defaultFieldComponents, ...defaultComponents };

  // Group fields by pages
  const fieldsByPage = useMemo(() => {
    const grouped: { [page: number]: FieldConfig[] } = {};

    fields.forEach((field) => {
      const page = field.page || 1;
      if (!grouped[page]) grouped[page] = [];
      grouped[page].push(field);
    });

    return grouped;
  }, [fields]);

  // Function to check if a page should be visible based on conditions
  const getVisiblePages = React.useCallback(
    (currentValues: Record<string, unknown>) => {
      const allPageNumbers = Object.keys(fieldsByPage)
        .map(Number)
        .sort((a, b) => a - b);

      return allPageNumbers.filter((pageNumber) => {
        // Check if the page itself has a condition
        const pageConfig = pages?.find((p) => p.page === pageNumber);
        if (pageConfig?.conditional && !pageConfig.conditional(currentValues)) {
          return false;
        }

        // Check if page has any visible fields
        const pageFields = fieldsByPage[pageNumber] || [];
        const hasVisibleFields = pageFields.some((field) => {
          // Check field's own conditional
          if (field.conditional && !field.conditional(currentValues)) {
            return false;
          }

          // Check conditional sections
          const conditionalSection = conditionalSections.find((section) =>
            section.fields.includes(field.name)
          );

          if (conditionalSection) {
            return conditionalSection.condition(currentValues as TFormValues);
          }

          return true;
        });

        return hasVisibleFields;
      });
    },
    [fieldsByPage, pages, conditionalSections]
  );

  // Group fields by tabs
  const fieldsByTab = useMemo(() => {
    const grouped: { [tab: string]: FieldConfig[] } = {};

    fields.forEach((field) => {
      const tab = field.tab || "default";
      if (!grouped[tab]) grouped[tab] = [];
      grouped[tab].push(field);
    });

    return grouped;
  }, [fields]);

  // State to track visible pages based on current form values
  const [visiblePages, setVisiblePages] = useState<number[]>(() => {
    // Initialize with all possible pages
    return Object.keys(fieldsByPage)
      .map(Number)
      .sort((a, b) => a - b);
  });

  const totalPages = Math.max(visiblePages.length, 1);
  const hasPages = totalPages > 1;
  const hasTabs = tabs && tabs.length > 0;

  // Calculate progress
  const progressValue = hasPages
    ? ((currentPage - 1) / (totalPages - 1)) * 100
    : 100;

  // Create a ref to store the form instance for the onSubmit callback
  const formRef = React.useRef<FormedibleFormApi<TFormValues> | null>(null);

  // Refs for async validation debouncing
  const asyncValidationTimeouts = React.useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  // Keep track of AbortControllers for async validations
  const asyncValidationAbortControllers = React.useRef<
    Record<string, AbortController>
  >({});

  // Cross-field validation function
  const validateCrossFields = React.useCallback(
    (values: Partial<TFormValues>) => {
      const errors: Record<string, string> = {};

      crossFieldValidation.forEach((validation) => {
        const relevantValues = validation.fields.reduce((acc, field) => {
          acc[field] = values[field];
          return acc;
        }, {} as Partial<TFormValues>);

        const error = validation.validator(relevantValues);
        if (error) {
          validation.fields.forEach((field) => {
            errors[field as string] = validation.message;
          });
        }
      });

      setCrossFieldErrors(errors);
      return errors;
    },
    [crossFieldValidation]
  );

  // Async validation function
  const validateFieldAsync = React.useCallback(
    async (fieldName: string, value: unknown) => {
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
      setAsyncValidationStates((prev) => ({
        ...prev,
        [fieldName]: { loading: true },
      }));

      // Debounce the validation
      asyncValidationTimeouts.current[fieldName] = setTimeout(async () => {
        try {
          if (abortController.signal.aborted) return;

          const error = await asyncConfig.validator(value);

          if (abortController.signal.aborted) return;

          setAsyncValidationStates((prev) => ({
            ...prev,
            [fieldName]: { loading: false, error: error || undefined },
          }));

          // Update form field error if needed
          if (formRef.current) {
            formRef.current?.setFieldMeta(fieldName, (prev) => ({
              ...prev,
              errors: error ? [error] : [],
            }));
          }
        } catch {
          setAsyncValidationStates((prev) => ({
            ...prev,
            [fieldName]: { loading: false, error: "Validation failed" },
          }));
        }
      }, asyncConfig.debounceMs || 500);
    },
    [asyncValidation]
  );

  // Setup form with schema validation if provided
  const formConfig = {
    ...formOptions,
    ...(resetOnSubmitSuccess &&
      formOptions?.onSubmit && {
        onSubmit: async (props: {
          value: TFormValues;
          formApi: FormedibleFormApi<TFormValues>;
        }) => {
          // Run cross-field validation before submit
          const crossFieldErrors = validateCrossFields(
            props.value as Partial<TFormValues>
          );
          if (Object.keys(crossFieldErrors).length > 0) {
            throw new Error("Cross-field validation failed");
          }

          // Track submission start time for performance metrics
          const submissionStartTime = Date.now();

          // Enhanced analytics tracking for form completion
          if (analytics) {
            const context = analyticsContextRef.current;
            const timeSpent = Date.now() - context.startTime;

            // Update performance metrics
            context.performanceMetrics.submissionMetrics.totalTime = timeSpent;

            // Call enhanced completion analytics
            analytics.onFormComplete?.(timeSpent, props.value);
          }

          let result: unknown;
          if (formOptions.onSubmit) {
            try {
              result = await formOptions.onSubmit(props);

              // Mark form as completed to prevent abandonment tracking
              formCompletedRef.current = true;

              // Track submission performance after successful completion
              if (analytics) {
                const processingTime = Date.now() - submissionStartTime;
                const context = analyticsContextRef.current;
                context.performanceMetrics.submissionMetrics.processingTime =
                  processingTime;
                analytics.onSubmissionPerformance?.(
                  Date.now() - context.startTime,
                  context.performanceMetrics.submissionMetrics.validationTime,
                  processingTime
                );
              }
            } catch (error) {
              // Re-throw the error after analytics
              throw error;
            }
          }

          // Clear storage on successful submit
          clearStorage();

          // Reset form on successful submit if option is enabled
          if (formRef.current) {
            formRef.current?.reset();
          }
          return result;
        },
      }),
  };

  const form = useForm(formConfig);

  // Store form reference for the onSubmit callback
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Enhanced analytics helper functions with performance optimization
  const trackFieldInteraction = React.useCallback(
    (
      fieldName: string,
      action: "focus" | "blur" | "change" | "error" | "complete",
      additionalData?: {
        timeSpent?: number;
        value?: unknown;
        errors?: string[];
        isValid?: boolean;
      }
    ) => {
      const context = analyticsContextRef.current;
      const timestamp = Date.now();

      // Initialize field tracking if not exists
      if (!context.fieldInteractions[fieldName]) {
        context.fieldInteractions[fieldName] = {
          focusCount: 0,
          totalTimeSpent: 0,
          changeCount: 0,
          errorCount: 0,
          isCompleted: false,
        };
      }

      const fieldData = context.fieldInteractions[fieldName];

      switch (action) {
        case "focus":
          fieldData.focusCount++;
          fieldFocusTimes.current[fieldName] = timestamp;
          analytics?.onFieldFocus?.(fieldName, timestamp);
          break;

        case "blur":
          if (additionalData?.timeSpent !== undefined) {
            fieldData.totalTimeSpent += additionalData.timeSpent;
            analytics?.onFieldBlur?.(fieldName, additionalData.timeSpent);
          }
          break;

        case "change":
          fieldData.changeCount++;
          analytics?.onFieldChange?.(
            fieldName,
            additionalData?.value,
            timestamp
          );
          break;

        case "error":
          if (additionalData?.errors?.length) {
            fieldData.errorCount++;
            analytics?.onFieldError?.(
              fieldName,
              additionalData.errors,
              timestamp
            );
          }
          break;

        case "complete":
          if (
            additionalData?.isValid !== undefined &&
            additionalData?.timeSpent !== undefined
          ) {
            fieldData.isCompleted = additionalData.isValid;
            analytics?.onFieldComplete?.(
              fieldName,
              additionalData.isValid,
              additionalData.timeSpent
            );
          }
          break;
      }
    },
    [analytics]
  );

  const trackTabChange = React.useCallback(
    (fromTab: string, toTab: string) => {
      const context = analyticsContextRef.current;
      const timestamp = Date.now();
      const timeSpent = tabStartTime.current[fromTab]
        ? timestamp - tabStartTime.current[fromTab]
        : 0;

      // Track tab visit
      if (!tabVisitHistory.current.has(toTab)) {
        tabVisitHistory.current.add(toTab);
        analytics?.onTabFirstVisit?.(toTab, timestamp);
      }

      // Initialize tab states if not exists
      if (!context.tabStates[fromTab]) {
        context.tabStates[fromTab] = {
          tabId: fromTab,
          startTime: tabStartTime.current[fromTab] || timestamp,
          visitCount: 0,
          fieldsCompleted: 0,
          totalFields: 0,
          hasErrors: false,
          completionPercentage: 0,
        };
      }

      if (!context.tabStates[toTab]) {
        context.tabStates[toTab] = {
          tabId: toTab,
          startTime: timestamp,
          visitCount: 0,
          fieldsCompleted: 0,
          totalFields: 0,
          hasErrors: false,
          completionPercentage: 0,
        };
      }

      // Update tab states
      const fromTabState = context.tabStates[fromTab];
      const toTabState = context.tabStates[toTab];

      toTabState.visitCount++;
      tabStartTime.current[toTab] = timestamp;

      // Calculate completion state for from tab
      const tabFields = fieldsByTab[fromTab] || [];
      fromTabState.totalFields = tabFields.length;
      fromTabState.fieldsCompleted = tabFields.filter(
        (field) => context.fieldInteractions[field.name]?.isCompleted
      ).length;
      fromTabState.completionPercentage =
        fromTabState.totalFields > 0
          ? (fromTabState.fieldsCompleted / fromTabState.totalFields) * 100
          : 0;

      // Check for validation errors in from tab
      const formState = form.state;
      fromTabState.hasErrors = tabFields.some((field) => {
        const fieldState =
          formState.fieldMeta[field.name as keyof typeof formState.fieldMeta];
        return fieldState && fieldState.errors && fieldState.errors.length > 0;
      });

      analytics?.onTabChange?.(fromTab, toTab, timeSpent, {
        completionPercentage: fromTabState.completionPercentage,
        hasErrors: fromTabState.hasErrors,
      });
    },
    [analytics, fieldsByTab, form]
  );

  const trackPageChange = React.useCallback(
    (fromPage: number, toPage: number) => {
      const context = analyticsContextRef.current;
      const timestamp = Date.now();
      const timeSpent = timestamp - pageStartTime.current;

      // Initialize page states if not exists
      if (!context.pageStates[fromPage]) {
        context.pageStates[fromPage] = {
          pageNumber: fromPage,
          startTime: pageStartTime.current,
          visitCount: 0,
          fieldsCompleted: 0,
          totalFields: 0,
          hasErrors: false,
          completionPercentage: 0,
          validationErrors: {},
          lastActiveField: undefined,
        };
      }

      const pageState = context.pageStates[fromPage];
      const pageFields = fieldsByPage[fromPage] || [];

      // Update page completion metrics
      pageState.totalFields = pageFields.length;
      pageState.fieldsCompleted = pageFields.filter(
        (field) => context.fieldInteractions[field.name]?.isCompleted
      ).length;
      pageState.completionPercentage =
        pageState.totalFields > 0
          ? (pageState.fieldsCompleted / pageState.totalFields) * 100
          : 0;

      // Check for validation errors
      const formState = form.state;
      const validationErrors: Record<string, string[]> = {};
      pageState.hasErrors = pageFields.some((field) => {
        const fieldState =
          formState.fieldMeta[field.name as keyof typeof formState.fieldMeta];
        const hasErrors =
          fieldState && fieldState.errors && fieldState.errors.length > 0;
        if (hasErrors) {
          validationErrors[field.name] = fieldState.errors;
        }
        return hasErrors;
      });
      pageState.validationErrors = validationErrors;

      pageStartTime.current = timestamp;

      analytics?.onPageChange?.(fromPage, toPage, timeSpent, {
        hasErrors: pageState.hasErrors,
        completionPercentage: pageState.completionPercentage,
      });
    },
    [analytics, fieldsByPage, form]
  );

  // Track visible pages using a ref to avoid circular dependencies
  const visiblePagesRef = React.useRef<number[]>(
    Object.keys(fieldsByPage)
      .map(Number)
      .sort((a, b) => a - b)
  );

  // Update visible pages when form values change (without causing re-renders)
  React.useEffect(() => {
    const updateVisiblePages = () => {
      const currentValues = form.state.values as Record<string, unknown>;
      const newVisiblePages = getVisiblePages(currentValues);

      // Only update if actually changed
      if (
        JSON.stringify(visiblePagesRef.current) !==
        JSON.stringify(newVisiblePages)
      ) {
        visiblePagesRef.current = newVisiblePages;

        // Update state only when necessary
        setVisiblePages(newVisiblePages);

        // Check if current page is still visible using setCurrentPage callback
        setCurrentPage((prevCurrentPage) => {
          const currentActualPage = newVisiblePages[prevCurrentPage - 1];
          if (
            !currentActualPage &&
            prevCurrentPage > 1 &&
            newVisiblePages.length > 0
          ) {
            return 1; // Navigate to first visible page
          }
          return prevCurrentPage; // Keep current page
        });
      }
    };

    // Set up subscription
    const unsubscribe = form.store.subscribe(updateVisiblePages);

    // Initialize on mount
    updateVisiblePages();

    return unsubscribe;
  }, [form, getVisiblePages]);

  // Form persistence logic
  const persistenceTimeout = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const saveToStorage = React.useCallback(
    (values: Partial<TFormValues>) => {
      if (!persistence) return;

      try {
        const storage =
          persistence.storage === "localStorage"
            ? localStorage
            : sessionStorage;
        const filteredValues = persistence.exclude
          ? Object.fromEntries(
              Object.entries(values as Record<string, unknown>).filter(
                ([key]) =>
                  !(persistence.exclude && persistence.exclude.includes(key))
              )
            )
          : values;

        storage.setItem(
          persistence.key,
          JSON.stringify({
            values: filteredValues,
            timestamp: Date.now(),
            currentPage,
          })
        );
      } catch (error) {
        console.warn("Failed to save form data to storage:", error);
      }
    },
    [persistence, currentPage]
  );

  const clearStorage = React.useCallback(() => {
    if (!persistence) return;

    try {
      const storage =
        persistence.storage === "localStorage" ? localStorage : sessionStorage;
      storage.removeItem(persistence.key);
    } catch (error) {
      console.warn("Failed to clear form data from storage:", error);
    }
  }, [persistence]);

  const loadFromStorage = React.useCallback(() => {
    if (!persistence?.restoreOnMount) return null;

    try {
      const storage =
        persistence.storage === "localStorage" ? localStorage : sessionStorage;
      const saved = storage.getItem(persistence.key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.warn("Failed to load form data from storage:", error);
    }
    return null;
  }, [persistence]);

  // Restore form data on mount
  React.useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData && savedData.values) {
      // Restore form values
      Object.entries(savedData.values as Record<string, unknown>).forEach(
        ([key, value]) => {
          try {
            form.setFieldValue(key as keyof TFormValues & string, value as any);
          } catch (error) {
            console.warn(`Failed to restore field value for ${key}:`, error);
          }
        }
      );

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

    // Enhanced form start analytics
    if (analytics?.onFormStart) {
      analytics.onFormStart(analyticsContextRef.current.startTime);
    }

    if (
      formOptions?.onChange ||
      autoSubmitOnChange ||
      crossFieldValidation.length > 0 ||
      analytics ||
      persistence
    ) {
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
            if (!formOptions.onChange) return;
            formOptions.onChange({ value: values as TFormValues, formApi });
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

    // Enhanced analytics using TanStack Form subscriptions instead of document event listeners
    if (analytics) {
      // Subscribe to form state changes for field validation analytics
      const fieldValidationUnsubscribe = form.store.subscribe(() => {
        const formState = form.state;
        const fieldMeta = formState.fieldMeta;

        // Track field validation errors
        Object.entries(fieldMeta).forEach(([fieldName, meta]) => {
          if (
            meta &&
            typeof meta === "object" &&
            "errors" in meta &&
            Array.isArray(meta.errors) &&
            meta.errors.length > 0
          ) {
            trackFieldInteraction(fieldName, "error", { errors: meta.errors });
          }
        });
      });
      unsubscribers.push(fieldValidationUnsubscribe);

      // Subscribe to field changes with optimized tracking
      const fieldChangeUnsubscribe = form.store.subscribe(() => {
        const values = form.state.values;
        const context = analyticsContextRef.current;

        Object.entries(values as Record<string, unknown>).forEach(
          ([fieldName, value]) => {
            // Only process if the value actually changed
            if (previousValues.current[fieldName] !== value) {
              // Initialize field tracking if needed
              if (!context.fieldInteractions[fieldName]) {
                context.fieldInteractions[fieldName] = {
                  focusCount: 0,
                  totalTimeSpent: 0,
                  changeCount: 0,
                  errorCount: 0,
                  isCompleted: false,
                };
              }

              // Track the change
              trackFieldInteraction(fieldName, "change", { value });

              // Trigger async validation if configured
              if (asyncValidation[fieldName]) {
                validateFieldAsync(fieldName, value);
              }

              // Update previous value
              previousValues.current[fieldName] = value;
            }
          }
        );
      });
      unsubscribers.push(fieldChangeUnsubscribe);

      // User's onBlur handler using subscription
      if (formOptions?.onBlur) {
        const blurUnsubscribe = form.store.subscribe(() => {
          clearTimeout(onBlurTimeout);
          onBlurTimeout = setTimeout(() => {
            if (!formOptions.onBlur) return;
            const formApi = form;
            const values = formApi.state.values;
            formOptions.onBlur({ value: values as TFormValues, formApi });
          }, 100); // 100ms debounce for blur
        });
        unsubscribers.push(blurUnsubscribe);
      }
    }

    // Enhanced cleanup - only handle timeouts and cancellations
    unsubscribers.push(() => {
      clearTimeout(autoSubmitTimeout);
      clearTimeout(onChangeTimeout);
      clearTimeout(onBlurTimeout);
      clearTimeout(persistenceTimeout.current);
      // Clear async validation timeouts
      Object.values(asyncValidationTimeouts.current).forEach((timeout) => {
        clearTimeout(timeout);
      });

      // Cancel all in-flight async validations
      Object.values(asyncValidationAbortControllers.current).forEach(
        (controller) => {
          controller.abort();
        }
      );
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [
    form,
    autoSubmitOnChange,
    autoSubmitDebounceMs,
    disabled,
    loading,
    formOptions,
    crossFieldValidation,
    analytics,
    asyncValidation,
    validateFieldAsync,
    persistence,
    saveToStorage,
    validateCrossFields,
    fields.length,
    trackFieldInteraction,
  ]);

  // Separate useEffect for form abandonment tracking - only runs on component unmount
  React.useEffect(() => {
    const analyticsContextSnapshot = analyticsContextRef.current;
    const fieldsLength = fields.length;
    const onFormAbandon = analytics?.onFormAbandon;

    return () => {
      // Track form abandonment only on component unmount if analytics is enabled and form wasn't completed
      if (
        onFormAbandon &&
        !formCompletedRef.current &&
        analyticsContextSnapshot
      ) {
        const context = analyticsContextSnapshot;

        // Ensure context properties exist before accessing
        if (!context.fieldInteractions) return;

        const totalFields = fieldsLength;
        const completedFields = Object.values(context.fieldInteractions).filter(
          (field) => field && field.isCompleted
        ).length;
        const completionPercentage =
          totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

        // Only track abandonment if form had some interaction
        if (
          completedFields > 0 ||
          Object.keys(context.fieldInteractions).length > 0
        ) {
          onFormAbandon(completionPercentage, {
            currentPage: context.currentPage,
            currentTab: context.currentTab,
            lastActiveField: Object.keys(context.fieldInteractions).pop(),
          });
        }
      }
    };
  }, [analytics?.onFormAbandon, fields.length]); // Include dependencies

  const getCurrentPageFields = () => {
    if (hasTabs) {
      // When using tabs, return all fields (tabs handle their own filtering)
      return fields;
    }
    // Get the actual page number from visible pages array
    const actualPageNumber = visiblePages[currentPage - 1];
    return actualPageNumber ? fieldsByPage[actualPageNumber] || [] : [];
  };

  const getCurrentPageConfig = () => {
    const actualPageNumber = visiblePages[currentPage - 1];
    return actualPageNumber
      ? pages?.find((p) => p.page === actualPageNumber)
      : undefined;
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      // Check if current page has validation errors
      const currentPageFields = getCurrentPageFields();
      const formState = form.state;

      const hasPageErrors = currentPageFields.some((field) => {
        const fieldState =
          formState.fieldMeta[field.name as keyof typeof formState.fieldMeta];
        return fieldState && fieldState.errors && fieldState.errors.length > 0;
      });

      if (hasPageErrors) {
        // Mark all fields on current page as touched to show validation errors
        currentPageFields.forEach((field) => {
          form.setFieldMeta(field.name, (prev) => ({
            ...prev,
            isTouched: true,
          }));
        });
        return; // Don't navigate if there are errors
      }

      const newPage = currentPage + 1;

      // Enhanced analytics tracking with validation state
      if (analytics) {
        trackPageChange(currentPage, newPage);
      }

      setCurrentPage(newPage);
      analyticsContextRef.current.currentPage = newPage;
      pageStartTime.current = Date.now();
      onPageChange?.(newPage, "next");
      scrollToTop(htmlFormRef, true, autoScroll);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;

      // Enhanced analytics tracking with validation state
      if (analytics) {
        trackPageChange(currentPage, newPage);
      }

      setCurrentPage(newPage);
      analyticsContextRef.current.currentPage = newPage;
      pageStartTime.current = Date.now();
      onPageChange?.(newPage, "previous");
      scrollToTop(htmlFormRef, true, autoScroll);
    }
  };

  const isLastPage = currentPage === totalPages;
  const isFirstPage = currentPage === 1;

  // Validated setCurrentPage that checks all pages between current and target
  const setCurrentPageWithValidation = (targetPage: number) => {
    if (
      targetPage < 1 ||
      targetPage > totalPages ||
      targetPage === currentPage
    ) {
      return;
    }

    // If going forward, validate all pages between current and target
    if (targetPage > currentPage) {
      for (
        let pageIndex = currentPage - 1;
        pageIndex < targetPage - 1;
        pageIndex++
      ) {
        const actualPageNumber = visiblePages[pageIndex];
        if (!actualPageNumber) continue;

        const pageFields = fieldsByPage[actualPageNumber] || [];
        const formState = form.state;

        const hasPageErrors = pageFields.some((field) => {
          const fieldState =
            formState.fieldMeta[field.name as keyof typeof formState.fieldMeta];
          return (
            fieldState && fieldState.errors && fieldState.errors.length > 0
          );
        });

        if (hasPageErrors) {
          // Mark all fields on this page as touched to show validation errors
          pageFields.forEach((field) => {
            form.setFieldMeta(field.name, (prev) => ({
              ...prev,
              isTouched: true,
            }));
          });
          return; // Don't navigate if there are errors
        }
      }
    }

    // If validation passes or going backward, allow navigation
    setCurrentPage(targetPage);
    analyticsContextRef.current.currentPage = targetPage;
    onPageChange?.(targetPage, targetPage > currentPage ? "next" : "previous");
    scrollToTop(htmlFormRef, true, autoScroll);
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
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-describedby": ariaDescribedby,
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

    // Tab state for controlled FormTabs component with analytics
    const [activeTab, setActiveTab] = useState(() => {
      if (tabs && tabs.length > 0) return tabs[0].id;
      return "";
    });

    // Enhanced tab change handler with analytics
    const handleTabChange = React.useCallback(
      (newTabId: string) => {
        const previousTab = activeTab;

        // Track tab change if analytics is enabled
        if (analytics && previousTab && previousTab !== newTabId) {
          trackTabChange(previousTab, newTabId);
        }

        // Initialize tab start time for new tab
        if (newTabId && !tabStartTime.current[newTabId]) {
          tabStartTime.current[newTabId] = Date.now();
        }

        setActiveTab(newTabId);
        analyticsContextRef.current.currentTab = newTabId;
      },
      [activeTab]
    );

    // Initialize first tab start time
    React.useEffect(() => {
      if (activeTab && !tabStartTime.current[activeTab]) {
        tabStartTime.current[activeTab] = Date.now();
        // Track first tab visit
        if (analytics?.onTabFirstVisit) {
          analytics.onTabFirstVisit(activeTab, Date.now());
        }
      }
    }, [activeTab]);

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

    // Helper function to resolve options (static or dynamic)
    const resolveOptions = React.useCallback(
      (
        options: FieldConfig["options"],
        currentValues: Record<string, unknown>
      ) => {
        if (typeof options === "function") {
          return options(currentValues);
        }
        return options;
      },
      []
    );

    const renderField = React.useCallback(
      (fieldConfig: FieldConfig) => {
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
          emailConfig,
        } = fieldConfig;

        return (
          <form.Field
            key={name}
            name={name as keyof TFormValues & string}
            validators={
              validation
                ? {
                    onChange: ({ value }) => {
                      const result = validation.safeParse(value);
                      return result.success
                        ? undefined
                        : result.error.issues[0]?.message || "Invalid value";
                    },
                  }
                : undefined
            }
          >
            {(field) => {
              // TanStack Form Best Practice: Use FieldConditionalRenderer to prevent parent re-renders
              return (
                <FieldConditionalRenderer form={form} fieldConfig={fieldConfig}>
                  {(shouldRender) => {
                    if (!shouldRender) {
                      return null;
                    }

                    // Subscribe to form values for dynamic options
                    return (
                      <form.Subscribe selector={(state: any) => state.values}>
                        {(currentValues: any) => {
                          // Check for cross-field validation errors
                          const crossFieldError = crossFieldErrors[name];
                          const asyncValidationState =
                            asyncValidationStates[name];

                          // Resolve options (static or dynamic)
                          const resolvedOptions = resolveOptions(
                            options,
                            currentValues
                          );

                          // Resolve dynamic text properties
                          const resolvedLabel = resolveDynamicText(
                            label,
                            currentValues
                          );
                          const resolvedPlaceholder = resolveDynamicText(
                            placeholder,
                            currentValues
                          );
                          const resolvedDescription = resolveDynamicText(
                            description,
                            currentValues
                          );

                          // Debug log for description
                          // if (description && typeof description === 'string' && description.includes('{{')) {
                          //   console.log('DEBUG - Field:', name, 'Original description:', description, 'Resolved:', resolvedDescription, 'Values:', currentValues);
                          // }

                          const baseProps = {
                            fieldApi: field as unknown as AnyFieldApi,
                            label: resolvedLabel,
                            placeholder: resolvedPlaceholder,
                            description: resolvedDescription,
                            wrapperClassName: fieldClassName,
                            labelClassName,
                            min,
                            max,
                            step,
                            accept,
                            multiple,
                            disabled:
                              disabled ||
                              loading ||
                              field.form.state.isSubmitting,
                            crossFieldError,
                            asyncValidationState,
                          };

                          // Select the component to use
                          const FieldComponent =
                            CustomComponent ||
                            fieldComponents[type] ||
                            TextField;

                          // Add type-specific props
                          let props: FieldComponentProps = { ...baseProps };

                          // Normalize options to the expected format
                          const normalizedOptions = resolvedOptions
                            ? resolvedOptions.map((opt) =>
                                typeof opt === "string"
                                  ? { value: opt, label: opt }
                                  : opt
                              )
                            : [];

                          if (type === "select") {
                            props = { ...props, options: normalizedOptions };
                          } else if (type === "array") {
                            const mappedArrayConfig = arrayConfig
                              ? {
                                  itemType: arrayConfig.itemType || "text",
                                  itemLabel: arrayConfig.itemLabel,
                                  itemPlaceholder: arrayConfig.itemPlaceholder,
                                  minItems: arrayConfig.minItems,
                                  maxItems: arrayConfig.maxItems,
                                  itemValidation: arrayConfig.itemValidation,
                                  itemComponent:
                                    arrayConfig.itemComponent as React.ComponentType<BaseFieldProps>,
                                  addButtonLabel: arrayConfig.addButtonLabel,
                                  removeButtonLabel:
                                    arrayConfig.removeButtonLabel,
                                  sortable: arrayConfig.sortable,
                                  defaultValue: arrayConfig.defaultValue,
                                  objectConfig: arrayConfig.objectConfig,
                                }
                              : undefined;
                            props = {
                              ...props,
                              arrayConfig: mappedArrayConfig,
                            };
                          } else if (
                            [
                              "text",
                              "email",
                              "password",
                              "url",
                              "tel",
                            ].includes(type)
                          ) {
                            props = {
                              ...props,
                              type: type as
                                | "text"
                                | "email"
                                | "password"
                                | "url"
                                | "tel",
                              datalist: datalist?.options,
                            };
                          } else if (type === "radio") {
                            props = { ...props, options: normalizedOptions };
                          } else if (type === "multiSelect") {
                            props = {
                              ...props,
                              options: normalizedOptions,
                              multiSelectConfig,
                            };
                          } else if (type === "colorPicker") {
                            props = { ...props, colorConfig };
                          } else if (type === "rating") {
                            props = { ...props, ratingConfig };
                          } else if (type === "phone") {
                            props = { ...props, phoneConfig };
                          } else if (type === "location") {
                            props = { ...props, locationConfig };
                          } else if (type === "duration") {
                            props = { ...props, durationConfig };
                          } else if (type === "autocomplete") {
                            // Handle dynamic options for autocomplete
                            const resolvedAutocompleteConfig =
                              autocompleteConfig
                                ? {
                                    ...autocompleteConfig,
                                    options: resolveOptions(
                                      autocompleteConfig.options,
                                      currentValues
                                    ),
                                  }
                                : undefined;
                            props = {
                              ...props,
                              autocompleteConfig: resolvedAutocompleteConfig,
                            };
                          } else if (type === "masked") {
                            props = { ...props, maskedInputConfig };
                          } else if (type === "object") {
                            props = { ...props, objectConfig, form };
                          } else if (type === "slider") {
                            props = { ...props, sliderConfig };
                          } else if (type === "number") {
                            props = { ...props, numberConfig };
                          } else if (type === "date") {
                            props = { ...props, dateConfig };
                          } else if (type === "file") {
                            props = { ...props, fileConfig };
                          } else if (type === "textarea") {
                            props = { ...props, textareaConfig };
                          } else if (type === "password") {
                            props = { ...props, passwordConfig };
                          } else if (type === "email") {
                            props = { ...props, emailConfig };
                          }

                          // Render the field component
                          const fieldElement = <FieldComponent {...props} />;

                          // Apply inline validation wrapper if enabled
                          const wrappedFieldElement =
                            inlineValidation?.enabled ? (
                              <InlineValidationWrapper
                                fieldApi={field as unknown as AnyFieldApi}
                                inlineValidation={inlineValidation}
                              >
                                {fieldElement}
                              </InlineValidationWrapper>
                            ) : (
                              fieldElement
                            );

                          // Add field help if provided
                          const fieldWithHelp = help ? (
                            <div className="space-y-2">
                              {wrappedFieldElement}
                              <FieldHelp help={help} />
                            </div>
                          ) : (
                            wrappedFieldElement
                          );

                          // Apply custom wrapper or global wrapper
                          const Wrapper = CustomWrapper || globalWrapper;

                          return Wrapper ? (
                            <Wrapper field={fieldConfig}>
                              {fieldWithHelp}
                            </Wrapper>
                          ) : (
                            fieldWithHelp
                          );
                        }}
                      </form.Subscribe>
                    );
                  }}
                </FieldConditionalRenderer>
              );
            }}
          </form.Field>
        );
      },
      [resolveOptions]
    );

    const renderTabContent = React.useCallback(
      (tabFields: FieldConfig[]) => {
        // TanStack Form Best Practice: Use reusable subscription component
        return (
          <ConditionalFieldsSubscription
            form={form}
            fields={tabFields}
            conditionalSections={conditionalSections}
          >
            {(currentValues) => {
              // Filter fields based on conditional sections using subscribed values
              const visibleFields = tabFields.filter((field) => {
                const conditionalSection = conditionalSections.find((section) =>
                  section.fields.includes(field.name)
                );

                if (conditionalSection) {
                  return conditionalSection.condition(
                    currentValues as TFormValues
                  );
                }

                return true;
              });

              // Group fields by section and group
              const groupedFields = visibleFields.reduce((acc, field) => {
                const sectionKey = field.section?.title || "default";
                const groupKey = field.group || "default";

                if (!acc[sectionKey]) {
                  acc[sectionKey] = {
                    section: field.section,
                    groups: {},
                  };
                }

                if (!acc[sectionKey].groups[groupKey]) {
                  acc[sectionKey].groups[groupKey] = [];
                }

                acc[sectionKey].groups[groupKey].push(field);
                return acc;
              }, {} as Record<string, { section?: { title?: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean }; groups: Record<string, FieldConfig[]> }>);

              const renderSection = (
                sectionKey: string,
                sectionData: {
                  section?: {
                    title?: string;
                    description?: string;
                    collapsible?: boolean;
                    defaultExpanded?: boolean;
                  };
                  groups: Record<string, FieldConfig[]>;
                }
              ) => (
                <SectionRenderer
                  key={sectionKey}
                  sectionKey={sectionKey}
                  sectionData={sectionData}
                  renderField={renderField}
                  collapseLabel={collapseLabel}
                  expandLabel={expandLabel}
                  form={form as unknown as AnyFormApi}
                  layout={layout}
                />
              );

              const sectionsToRender = Object.entries(groupedFields);

              return sectionsToRender.length === 1 &&
                sectionsToRender[0][0] === "default"
                ? sectionsToRender[0][1].groups.default?.map(
                    (field: FieldConfig) => renderField(field)
                  )
                : sectionsToRender.map(([sectionKey, sectionData]) =>
                    renderSection(sectionKey, sectionData)
                  );
            }}
          </ConditionalFieldsSubscription>
        );
      },
      [renderField]
    );

    const renderPageContent = React.useCallback(() => {
      if (hasTabs) {
        // Render tabs - memoize tab content to prevent rerenders
        const tabsToRender = tabs!.map((tab) => ({
          id: tab.id,
          label: tab.label,
          content: renderTabContent(fieldsByTab[tab.id] || []),
        }));

        return (
          <FormTabs
            tabs={tabsToRender}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        );
      }

      // Original page rendering logic with TanStack Form best practices
      const currentFields = getCurrentPageFields();
      const pageConfig = getCurrentPageConfig();

      // For now, subscribe to all form values since we don't have explicit dependencies
      // This could be optimized further by analyzing the condition functions

      // TanStack Form Best Practice: Use targeted selector for minimal re-renders
      return (
        <form.Subscribe selector={(state: any) => state.values}>
          {(currentValues: any) => {
            // Filter fields based on conditional sections using subscribed values
            const visibleFields = currentFields.filter((field) => {
              const conditionalSection = conditionalSections.find((section) =>
                section.fields.includes(field.name)
              );

              if (conditionalSection) {
                return conditionalSection.condition(
                  currentValues as TFormValues
                );
              }

              return true;
            });

            // Group fields by section and group
            const groupedFields = visibleFields.reduce((acc, field) => {
              const sectionKey = field.section?.title || "default";
              const groupKey = field.group || "default";

              if (!acc[sectionKey]) {
                acc[sectionKey] = {
                  section: field.section,
                  groups: {},
                };
              }

              if (!acc[sectionKey].groups[groupKey]) {
                acc[sectionKey].groups[groupKey] = [];
              }

              acc[sectionKey].groups[groupKey].push(field);
              return acc;
            }, {} as Record<string, { section?: { title?: string; description?: string; collapsible?: boolean; defaultExpanded?: boolean }; groups: Record<string, FieldConfig[]> }>);

            const renderSection = (
              sectionKey: string,
              sectionData: {
                section?: {
                  title?: string;
                  description?: string;
                  collapsible?: boolean;
                  defaultExpanded?: boolean;
                };
                groups: Record<string, FieldConfig[]>;
              }
            ) => (
              <SectionRenderer
                key={sectionKey}
                sectionKey={sectionKey}
                sectionData={sectionData}
                renderField={renderField}
                collapseLabel={collapseLabel}
                expandLabel={expandLabel}
                form={form as unknown as AnyFormApi}
                layout={layout}
              />
            );

            const sectionsToRender = Object.entries(groupedFields);

            const PageComponent = pageConfig?.component || DefaultPageComponent;

            // Debug logging for page description
            // if (
            //   pageConfig?.description &&
            //   pageConfig.description.includes("{{")
            // ) {
            //   console.log("DEBUG - Page description:", pageConfig.description);
            //   console.log("DEBUG - Current values:", currentValues);
            //   console.log(
            //     "DEBUG - Resolved description:",
            //     resolveDynamicText(pageConfig.description, currentValues)
            //   );
            // }

            return (
              <PageComponent
                title={
                  pageConfig?.title
                    ? resolveDynamicText(pageConfig.title, currentValues)
                    : undefined
                }
                description={
                  pageConfig?.description
                    ? resolveDynamicText(pageConfig.description, currentValues)
                    : undefined
                }
                page={currentPage}
                totalPages={totalPages}
              >
                {sectionsToRender.length === 1 &&
                sectionsToRender[0][0] === "default"
                  ? sectionsToRender[0][1].groups.default?.map(
                      (field: FieldConfig) => renderField(field)
                    )
                  : sectionsToRender.map(([sectionKey, sectionData]) =>
                      renderSection(sectionKey, sectionData)
                    )}
              </PageComponent>
            );
          }}
        </form.Subscribe>
      );
    }, [renderTabContent, renderField, activeTab, handleTabChange]);

    const renderProgress = () => {
      if (!hasPages || !progress) return null;

      const ProgressComponent = progress.component || DefaultProgressComponent;

      return (
        <ProgressComponent
          value={progressValue}
          currentPage={currentPage}
          totalPages={totalPages}
          className={progress.className}
          showSteps={progress.showSteps}
          showPercentage={progress.showPercentage}
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
              const { canSubmit, isSubmitting } = state as {
                canSubmit: boolean;
                isSubmitting: boolean;
              };

              const SubmitButton = submitButton || Button;

              return (
                <div className="flex justify-end">
                  <SubmitButton
                    type="submit"
                    disabled={!canSubmit || isSubmitting || disabled || loading}
                    className={cn("px-8", submitButtonClassName)}
                  >
                    {loading
                      ? "Loading..."
                      : isSubmitting
                      ? "Submitting..."
                      : submitLabel}
                  </SubmitButton>
                </div>
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
            const { canSubmit, isSubmitting } = state as {
              canSubmit: boolean;
              isSubmitting: boolean;
            };

            const SubmitButton = submitButton || Button;

            return (
              <div className="flex justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={isFirstPage || disabled || loading}
                  className={cn(
                    isFirstPage ? "invisible" : "",
                    buttonClassName
                  )}
                >
                  {previousLabel}
                </Button>

                <SubmitButton
                  type="submit"
                  disabled={
                    (!canSubmit || isSubmitting || disabled || loading) &&
                    isLastPage
                  }
                  className={cn(
                    "px-8",
                    isLastPage ? submitButtonClassName : buttonClassName
                  )}
                >
                  {loading && isLastPage
                    ? "Loading..."
                    : isSubmitting && isLastPage
                    ? "Submitting..."
                    : isLastPage
                    ? submitLabel
                    : nextLabel}
                </SubmitButton>
              </div>
            );
          }}
        </form.Subscribe>
      );
    };

    return (
      <form
        ref={htmlFormRef}
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
    visiblePages,
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
