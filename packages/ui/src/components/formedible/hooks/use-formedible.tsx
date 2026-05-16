import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { defaultValidationLogic, useForm } from '@tanstack/react-form';
import type { DeepKeys, ValidationLogicFn } from '@tanstack/react-form';
import type { ReactNode } from 'react';

import { FieldRenderer } from '@formedible/ui/components/formedible/field-renderer';
import { Form as FormRoot } from '@formedible/ui/components/formedible/form';
import type { FormProps } from '@formedible/ui/components/formedible/form';
import { FormLayout } from '@formedible/ui/components/formedible/layout/form-layout';
import { FormNavigation } from '@formedible/ui/components/formedible/layout/form-navigation';
import { FormProgress } from '@formedible/ui/components/formedible/layout/form-progress';
import { FormTabs } from '@formedible/ui/components/formedible/layout/form-tabs';
import { Button } from '@formedible/ui/components/button';
import { useFormAnalytics } from '@formedible/ui/components/formedible/hooks/use-form-analytics';
import type { FormAnalyticsAbandonContext, FormAnalyticsPageValidationState } from '@formedible/ui/components/formedible/hooks/use-form-analytics';
import { useFormPersistence } from '@formedible/ui/components/formedible/hooks/use-form-persistence';
import { useFormTabs } from '@formedible/ui/components/formedible/hooks/use-form-tabs';
import { useMultiPage } from '@formedible/ui/components/formedible/hooks/use-multi-page';
import { getValueAtFieldPath } from '@formedible/ui/components/formedible/lib/field-path';
import { resolveDynamicText } from '@formedible/ui/components/formedible/lib/dynamic-text';
import { normalizeFieldConfig } from '@formedible/ui/components/formedible/lib/normalize-field-config';
import { normalizeOptions } from '@formedible/ui/components/formedible/lib/normalize-options';
import type { FormedibleFieldSection, FormedibleFormApiContext, FormedibleFormValues, FormedibleValidationSummaryConfig, UseFormedibleOptions } from '@formedible/ui/components/formedible/lib/types';
import type { NormalizedFieldConfig } from '@formedible/ui/components/formedible/lib/types';
import { buildFieldValidators, buildFormValidators } from '@formedible/ui/components/formedible/lib/validation';
import type { FormedibleValidatorContext } from '@formedible/ui/components/formedible/lib/validation';
import { formatValidationError } from '@formedible/ui/components/formedible/lib/zod-errors';

interface InvalidFieldEntry<TFormValues extends FormedibleFormValues> {
  readonly field: NormalizedFieldConfig<TFormValues>;
  readonly message: string;
  readonly page?: number;
  readonly tab?: string;
}

interface FormedibleFieldMetaErrorState {
  readonly errors?: readonly unknown[];
}

interface FormedibleValidationFormState<TFormValues extends FormedibleFormValues> {
  readonly values: TFormValues;
  readonly fieldMeta?: Record<string, FormedibleFieldMetaErrorState | undefined>;
}

type RuntimeFieldValidator<TFormValues extends FormedibleFormValues> = {
  readonly onSubmit?: (context: FormedibleValidatorContext<TFormValues>) => string | undefined;
};

const formedibleValidationLogic: ValidationLogicFn = (props) => {
  if (props.event.type !== 'change') {
    return defaultValidationLogic(props);
  }

  const validators: Parameters<typeof props.runValidation>[0]['validators'] = [];

  defaultValidationLogic({
    ...props,
    runValidation: (validationProps) => {
      validators.push(...validationProps.validators);
    },
  });

  validators.push({
    fn: props.event.async ? props.validators?.onBlurAsync : props.validators?.onBlur,
    cause: 'blur',
  });

  return props.runValidation({ validators, form: props.form });
};

export function useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(config: UseFormedibleOptions<TFormValues>) {
  const formId = useId();
  const normalizedOptions = normalizeOptions(config);
  const fields = normalizedOptions.fields;
  const pageValidationStateRef = useRef<(pageNumber: number) => FormAnalyticsPageValidationState>(() => ({ hasErrors: false, completionPercentage: 0 }));
  const abandonContextRef = useRef<FormAnalyticsAbandonContext>({ completionPercentage: 0 });
  const autoSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusInvalidFieldTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hasInvalidSubmitAttempt, setHasInvalidSubmitAttempt] = useState(false);
  const analytics = useFormAnalytics(config.analytics, {
    getPageValidationState: (pageNumber) => pageValidationStateRef.current(pageNumber),
    getAbandonContext: () => abandonContextRef.current,
  });
  const form = useForm({
    defaultValues: config.formOptions.defaultValues,
    validators: buildFormValidators(config.schema, config.crossFieldValidation),
    validationLogic: formedibleValidationLogic,
    onSubmitInvalid: ({ formApi }) => {
      setHasInvalidSubmitAttempt(true);
      handleInvalidSubmitEntries(getInvalidFieldEntries(formApi.state as FormedibleValidationFormState<TFormValues>));
    },
    onSubmit: async ({ value }) => {
      analytics.trackFormComplete(value as TFormValues);
      await config.formOptions.onSubmit?.({ value, formApi: getFormApiContext(value as TFormValues) });
      clearStorage();
    },
  });

  useEffect(() => {
    return () => {
      if (autoSubmitTimeoutRef.current !== undefined) {
        clearTimeout(autoSubmitTimeoutRef.current);
      }

      if (focusInvalidFieldTimeoutRef.current !== undefined) {
        clearTimeout(focusInvalidFieldTimeoutRef.current);
      }
    };
  }, []);

  function getValidationSummaryConfig(): Required<FormedibleValidationSummaryConfig> & { readonly enabled: boolean } {
    if (config.validationSummary === false) {
      return { enabled: false, autoNavigate: false, showBadges: false };
    }

    if (typeof config.validationSummary === 'object' && config.validationSummary !== null) {
      return {
        enabled: true,
        autoNavigate: config.validationSummary.autoNavigate ?? true,
        showBadges: config.validationSummary.showBadges ?? true,
      };
    }

    return { enabled: true, autoNavigate: true, showBadges: true };
  }

  function getFormApiContext(values: TFormValues = form.state.values): FormedibleFormApiContext<TFormValues> {
    return {
      state: { values },
      handleSubmit: () => form.handleSubmit(),
    };
  }

  function getValuesWithFieldUpdate(fieldName: string, nextValue: unknown): TFormValues {
    return { ...form.state.values, [fieldName]: nextValue } as TFormValues;
  }

  function getFieldId(fieldName: string) {
    return `${formId}-${fieldName}`;
  }

  function scheduleAutoSubmit() {
    if (!config.autoSubmitOnChange) {
      return;
    }

    if (autoSubmitTimeoutRef.current !== undefined) {
      clearTimeout(autoSubmitTimeoutRef.current);
    }

    autoSubmitTimeoutRef.current = setTimeout(() => {
      form.handleSubmit();
    }, config.autoSubmitDebounceMs ?? 300);
  }

  function handlePageChange(context: { readonly fromPage: number; readonly toPage: number; readonly timeSpent: number }) {
    analytics.trackPageChange(context);
    config.onPageChange?.(context.toPage, context.toPage > context.fromPage ? 'next' : 'previous');
  }
  const multiPage = useMultiPage({
    fields,
    pages: config.pages,
    values: form.state.values,
    onPageChange: handlePageChange,
  });
  const tabs = useFormTabs({ fields, tabs: config.tabs, values: form.state.values });
  const { saveToStorage, loadFromStorage, clearStorage } = useFormPersistence(form, config.persistence, {
    currentPage: multiPage.currentPage,
    totalPages: multiPage.totalPages,
    setCurrentPage: multiPage.setCurrentPage,
  });
  const hasConfiguredPages = fields.some((fieldConfig) => fieldConfig.page !== undefined) || Boolean(config.pages?.length);
  const hasConfiguredTabs = tabs.visibleTabs.length > 0;
  const validationSummaryConfig = getValidationSummaryConfig();

  function isCompletedValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== '';
  }

  function getPageValidationState(pageNumber: number): FormAnalyticsPageValidationState {
    const pageFields = fields.filter((fieldConfig) => (fieldConfig.page ?? 1) === pageNumber);
    const formState = form.state as {
      readonly values: TFormValues;
      readonly fieldMeta?: Record<string, { readonly errors?: readonly unknown[] } | undefined>;
    };
    const completedFields = pageFields.filter((fieldConfig) => isCompletedValue(getValueAtFieldPath(formState.values, fieldConfig.name))).length;
    const hasErrors = pageFields.some((fieldConfig) => (formState.fieldMeta?.[fieldConfig.name]?.errors?.length ?? 0) > 0);

    return {
      hasErrors,
      completionPercentage: pageFields.length > 0 ? (completedFields / pageFields.length) * 100 : 0,
    };
  }

  function getAbandonContext(): FormAnalyticsAbandonContext {
    const completedFields = fields.filter((fieldConfig) => isCompletedValue(getValueAtFieldPath(form.state.values, fieldConfig.name))).length;
    const context: FormAnalyticsAbandonContext = {
      completionPercentage: fields.length > 0 ? (completedFields / fields.length) * 100 : 0,
      currentPage: multiPage.currentPage,
    };

    if (tabs.activeTab !== undefined) {
      return { ...context, currentTab: tabs.activeTab };
    }

    return context;
  }

  pageValidationStateRef.current = getPageValidationState;
  abandonContextRef.current = getAbandonContext();

  function shouldRenderField(fieldConfig: NormalizedFieldConfig<TFormValues>, localValues: FormedibleFormValues | undefined) {
    if (!fieldConfig.conditional) {
      return true;
    }

    const conditionalValues = localValues ?? form.state.values;

    if (typeof fieldConfig.conditional === 'string') {
      return Boolean(getValueAtFieldPath(conditionalValues, fieldConfig.conditional));
    }

    return fieldConfig.conditional(conditionalValues as TFormValues);
  }

  function getFieldErrorFromMeta(fieldName: string, fieldMeta: FormedibleValidationFormState<TFormValues>['fieldMeta']) {
    return fieldMeta?.[fieldName]?.errors?.map(formatValidationError).find((message) => message !== undefined);
  }

  function getFieldErrorFromConfiguredValidation(fieldConfig: NormalizedFieldConfig<TFormValues>, values: TFormValues) {
    const validators = buildFieldValidators<TFormValues, DeepKeys<TFormValues>>(
      fieldConfig,
      config.schema,
      config.crossFieldValidation,
      config.asyncValidation,
    ) as unknown as RuntimeFieldValidator<TFormValues>;

    return validators.onSubmit?.({
      value: getValueAtFieldPath(values, fieldConfig.name),
      fieldApi: { form },
    });
  }

  function getInvalidFieldEntries(state: FormedibleValidationFormState<TFormValues>): readonly InvalidFieldEntry<TFormValues>[] {
    const entries: InvalidFieldEntry<TFormValues>[] = [];

    for (const fieldConfig of fields) {
      if (!shouldRenderField(fieldConfig, state.values)) {
        continue;
      }

      const message = getFieldErrorFromMeta(fieldConfig.name, state.fieldMeta) ?? getFieldErrorFromConfiguredValidation(fieldConfig, state.values);

      if (message) {
        entries.push({ field: fieldConfig, message, page: fieldConfig.page ?? 1, tab: fieldConfig.tab });
      }
    }

    return entries;
  }

  function countInvalidFieldsByPage(entries: readonly InvalidFieldEntry<TFormValues>[]) {
    const counts: Record<number, number> = {};

    for (const entry of entries) {
      counts[entry.page ?? 1] = (counts[entry.page ?? 1] ?? 0) + 1;
    }

    return counts;
  }

  function countInvalidFieldsByTab(entries: readonly InvalidFieldEntry<TFormValues>[]) {
    const counts: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.tab !== undefined) {
        counts[entry.tab] = (counts[entry.tab] ?? 0) + 1;
      }
    }

    return counts;
  }

  function focusInvalidField(fieldName: string) {
    if (focusInvalidFieldTimeoutRef.current !== undefined) {
      clearTimeout(focusInvalidFieldTimeoutRef.current);
    }

    focusInvalidFieldTimeoutRef.current = setTimeout(() => {
      const element = document.getElementById(getFieldId(fieldName));

      element?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      element?.focus({ preventScroll: true });
    }, 0);
  }

  function navigateToInvalidField(entry: InvalidFieldEntry<TFormValues>) {
    if (hasConfiguredTabs && entry.tab !== undefined && tabs.visibleTabs.some((tab) => tab.id === entry.tab)) {
      tabs.setActiveTab(entry.tab);
    } else if (hasConfiguredPages && entry.page !== undefined && multiPage.visiblePages.includes(entry.page)) {
      multiPage.setCurrentPage(entry.page);
    }

    focusInvalidField(entry.field.name);
  }

  function handleInvalidSubmitEntries(entries: readonly InvalidFieldEntry<TFormValues>[]) {
    if (!validationSummaryConfig.autoNavigate) {
      return;
    }

    const firstInvalidEntry = entries.at(0);

    if (firstInvalidEntry) {
      navigateToInvalidField(firstInvalidEntry);
    }
  }

  function withDynamicText(fieldConfig: NormalizedFieldConfig<TFormValues>, values: FormedibleFormValues) {
    return {
      ...fieldConfig,
      label: resolveDynamicText(fieldConfig.label, values),
      description: resolveDynamicText(fieldConfig.description, values),
      placeholder: typeof fieldConfig.placeholder === 'string' ? String(resolveDynamicText(fieldConfig.placeholder, values)) : fieldConfig.placeholder,
      section: resolveFieldSection(fieldConfig.section, values),
    } satisfies NormalizedFieldConfig<TFormValues>;
  }

  function resolveFieldSection(section: string | FormedibleFieldSection | undefined, values: FormedibleFormValues) {
    if (section === undefined || typeof section === 'string') {
      return resolveDynamicText(section, values) as string | undefined;
    }

    return {
      title: resolveDynamicText(section.title, values),
      description: resolveDynamicText(section.description, values),
    } satisfies FormedibleFieldSection;
  }

  function getSectionTitle(section: string | FormedibleFieldSection): ReactNode {
    return typeof section === 'string' ? section : section.title;
  }

  function getSectionDescription(section: string | FormedibleFieldSection): ReactNode {
    return typeof section === 'string' ? undefined : section.description;
  }

  function getSectionKey(section: string | FormedibleFieldSection | undefined): string | undefined {
    if (section === undefined) {
      return undefined;
    }

    if (typeof section === 'string') {
      return section;
    }

    const description = typeof section.description === 'string' ? section.description : '';

    return typeof section.title === 'string' ? `${section.title}\u0000${description}` : undefined;
  }

  function renderSectionHeader(section: string | FormedibleFieldSection, key: string) {
    const description = getSectionDescription(section);

    return (
      <div key={key} data-formedible-section="true" className="space-y-1">
        <h2 className="text-lg font-semibold leading-none tracking-tight">{getSectionTitle(section)}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : undefined}
      </div>
    );
  }

  function renderField(fieldConfig: NormalizedFieldConfig<TFormValues>, options?: { readonly name?: string; readonly key?: string; readonly localValues?: FormedibleFormValues }) {
    const fieldName = options?.name ?? fieldConfig.name;
    const dynamicConfig = withDynamicText(fieldConfig, options?.localValues ?? form.state.values);
    const fieldDisabledConfig = config.disabled ? ({ ...dynamicConfig, disabled: true } satisfies NormalizedFieldConfig<TFormValues>) : dynamicConfig;
    const renderConfig = fieldName === fieldConfig.name ? fieldDisabledConfig : normalizeFieldConfig<TFormValues>({ ...fieldDisabledConfig, name: fieldName });
    const localValues = options?.localValues;

    if (!shouldRenderField(fieldConfig, localValues)) {
      return null;
    }

    return (
      <form.Field
        key={options?.key ?? fieldName}
        name={fieldName as DeepKeys<TFormValues>}
        validators={buildFieldValidators<TFormValues, DeepKeys<TFormValues>>(renderConfig, config.schema, config.crossFieldValidation, config.asyncValidation)}
      >
        {(field) => {
          const error = field.state.meta.errors.map(formatValidationError).find((message) => message !== undefined);
          type FieldValueUpdate = Parameters<typeof field.handleChange>[0];

          return (
            <FieldRenderer
              fieldConfig={renderConfig}
              field={{
                id: getFieldId(fieldName),
                name: fieldName,
                value: field.state.value,
                formValues: localValues ?? form.state.values,
                error,
                onFocus: () => {
                  analytics.trackFieldFocus(fieldName);
                  config.formOptions.onFocus?.({ value: form.state.values, formApi: getFormApiContext() });
                },
                onBlur: () => {
                  field.handleBlur();
                  const fieldErrors = field.state.meta.errors.map(formatValidationError).filter((message): message is string => message !== undefined);
                  analytics.trackFieldBlur(fieldName, { isValid: fieldErrors.length === 0, errors: fieldErrors });
                  config.formOptions.onBlur?.({ value: form.state.values, formApi: getFormApiContext() });
                },
                onChange: (nextValue) => {
                  if (!field.state.meta.isTouched) {
                    field.setMeta((previous) => ({ ...previous, isTouched: true }));
                  }

                  field.handleChange(nextValue as FieldValueUpdate);
                  analytics.trackFieldChange(fieldName, nextValue);
                  const nextValues = getValuesWithFieldUpdate(fieldName, nextValue);
                  config.formOptions.onChange?.({ value: nextValues, formApi: getFormApiContext(nextValues) });
                  scheduleAutoSubmit();
                },
              }}
              renderField={renderField}
              defaultComponent={config.defaultComponents?.[renderConfig.type]}
              globalWrapper={config.globalWrapper}
            />
          );
        }}
      </form.Field>
    );
  }

  function renderFields(values: FormedibleFormValues) {
    const activeFields = fields.filter((fieldConfig) => {
      if (hasConfiguredTabs) {
        return fieldConfig.tab === tabs.activeTab;
      }

      if (hasConfiguredPages) {
        return (fieldConfig.page ?? 1) === multiPage.currentPage;
      }

      return true;
    });

    const renderedFields: ReactNode[] = [];
    let previousSectionKey: string | undefined;
    let previousFieldHadSection = false;

    activeFields.forEach((fieldConfig) => {
      if (!shouldRenderField(fieldConfig, values)) {
        return;
      }

      const dynamicConfig = withDynamicText(fieldConfig, values);
      const sectionKey = getSectionKey(dynamicConfig.section);
      const shouldRenderHeader = !previousFieldHadSection || sectionKey === undefined || sectionKey !== previousSectionKey;

      if (dynamicConfig.section !== undefined && shouldRenderHeader) {
        renderedFields.push(renderSectionHeader(dynamicConfig.section, `${fieldConfig.name}-section`));
      }

      renderedFields.push(
        <Fragment key={fieldConfig.name}>
          {renderField(dynamicConfig, { localValues: values })}
        </Fragment>,
      );
      previousFieldHadSection = dynamicConfig.section !== undefined;
      previousSectionKey = sectionKey;
    });

    return renderedFields;
  }

  function getPageLabel(pageNumber: number, values: FormedibleFormValues): ReactNode {
    return resolveDynamicText(config.pages?.find((page) => page.page === pageNumber)?.title, values) ?? `Step ${pageNumber}`;
  }

  function getTabLabel(tabId: string, values: FormedibleFormValues): ReactNode {
    const tabConfig = tabs.visibleTabs.find((tab) => tab.id === tabId);

    return tabConfig ? resolveDynamicText(tabConfig.label, values) : tabId;
  }

  function getInvalidFieldLocation(entry: InvalidFieldEntry<TFormValues>, values: FormedibleFormValues): ReactNode {
    if (hasConfiguredTabs && entry.tab !== undefined) {
      return getTabLabel(entry.tab, values);
    }

    if (hasConfiguredPages && entry.page !== undefined) {
      return getPageLabel(entry.page, values);
    }

    return undefined;
  }

  function renderValidationSummary(entries: readonly InvalidFieldEntry<TFormValues>[], values: FormedibleFormValues) {
    if (!validationSummaryConfig.enabled || !hasInvalidSubmitAttempt || entries.length === 0) {
      return undefined;
    }

    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm" role="alert" aria-live="polite" data-formedible-validation-summary="true">
        <p className="font-medium text-destructive">Please fix {entries.length} invalid {entries.length === 1 ? 'field' : 'fields'}.</p>
        <ul className="mt-2 space-y-1">
          {entries.map((entry) => {
            const location = getInvalidFieldLocation(entry, values);

            return (
              <li key={entry.field.name}>
                <button type="button" className="text-left text-destructive underline-offset-4 hover:underline" onClick={() => navigateToInvalidField(entry)}>
                  <span>{entry.field.label ?? entry.field.name}</span>
                  {location ? <span> on {location}</span> : undefined}
                  <span>: {entry.message}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  function renderPageHeader(values: FormedibleFormValues, errorCount: number) {
    if (!hasConfiguredPages) {
      return undefined;
    }

    const pageConfig = config.pages?.find((page) => page.page === multiPage.currentPage);
    const currentStep = Math.max(multiPage.visiblePages.indexOf(multiPage.currentPage), 0) + 1;

    return (
      <FormProgress
        currentPage={currentStep}
        totalPages={multiPage.totalPages}
        value={multiPage.progressValue}
        showSteps={config.progress?.showSteps}
        showPercentage={config.progress?.showPercentage}
        title={resolveDynamicText(pageConfig?.title, values)}
        description={resolveDynamicText(pageConfig?.description, values)}
        errorCount={validationSummaryConfig.showBadges && hasInvalidSubmitAttempt ? errorCount : 0}
      />
    );
  }

  function Form({ className, onBlur, onFocus, onInput, onInvalid, onKeyDown, onKeyUp, onReset, ...props }: FormProps) {
    const isSubmitting = Boolean((form.state as { readonly isSubmitting?: boolean }).isSubmitting);
    const controlsDisabled = Boolean(config.disabled || config.loading || isSubmitting);
    const shouldShowSubmitButton = config.showSubmitButton !== false;

    return (
      <FormRoot
        {...props}
        className={className}
        noValidate={props.noValidate ?? true}
        aria-busy={config.loading ? true : undefined}
        onBlur={(event) => {
          onBlur?.(event);
          config.onFormBlur?.(event, getFormApiContext());
        }}
        onFocus={(event) => {
          onFocus?.(event);
          config.onFormFocus?.(event, getFormApiContext());
        }}
        onInput={(event) => {
          onInput?.(event);
          config.onFormInput?.(event, getFormApiContext());
        }}
        onInvalid={(event) => {
          onInvalid?.(event);
          config.onFormInvalid?.(event, getFormApiContext());
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          config.onFormKeyDown?.(event, getFormApiContext());
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          config.onFormKeyUp?.(event, getFormApiContext());
        }}
        onReset={(event) => {
          onReset?.(event);
          config.formOptions.onReset?.({ value: form.state.values, formApi: getFormApiContext() });
          config.onFormReset?.(event, getFormApiContext());
          analytics.trackFormReset('reset');
        }}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const invalidEntries = getInvalidFieldEntries(form.state as FormedibleValidationFormState<TFormValues>);

          if (invalidEntries.length > 0) {
            setHasInvalidSubmitAttempt(true);
            handleInvalidSubmitEntries(invalidEntries);
            return;
          }

          form.handleSubmit();
        }}
      >
        <fieldset disabled={controlsDisabled} className="contents">
        <form.Subscribe selector={(state) => ({ values: state.values, fieldMeta: state.fieldMeta })}>
          {(state) => {
            const formValues = state.values as TFormValues;
            const invalidEntries = getInvalidFieldEntries({ values: formValues, fieldMeta: state.fieldMeta });
            const pageErrorCounts = countInvalidFieldsByPage(invalidEntries);
            const tabErrorCounts = countInvalidFieldsByTab(invalidEntries);
            const fieldsContent = renderFields(formValues);

            return (
              <FormLayout className={config.formClassName}>
                {renderValidationSummary(invalidEntries, formValues)}
                {hasConfiguredTabs ? (
                  <FormTabs
                    tabs={tabs.visibleTabs.map((tab) => ({
                      id: tab.id,
                      label: resolveDynamicText(tab.label, formValues),
                      description: resolveDynamicText(tab.description, formValues),
                      errorCount: validationSummaryConfig.showBadges && hasInvalidSubmitAttempt ? tabErrorCounts[tab.id] ?? 0 : 0,
                    }))}
                    activeTab={tabs.activeTab}
                    onTabChange={tabs.setActiveTab}
                  >
                    {fieldsContent}
                  </FormTabs>
                ) : (
                  <>
                    {renderPageHeader(formValues, pageErrorCounts[multiPage.currentPage] ?? 0)}
                    {fieldsContent}
                  </>
                )}
                {hasConfiguredPages ? (
                  <FormNavigation
                    isFirstPage={multiPage.isFirstPage}
                    isLastPage={multiPage.isLastPage}
                    previousLabel={config.previousLabel ?? 'Previous'}
                    nextLabel={config.nextLabel ?? 'Next'}
                    submitLabel={config.submitLabel ?? 'Submit'}
                    onPrevious={multiPage.goToPreviousPage}
                    onNext={multiPage.goToNextPage}
                    disabled={controlsDisabled}
                    showSubmitButton={shouldShowSubmitButton}
                  />
                ) : shouldShowSubmitButton ? (
                  <Button type="submit" disabled={controlsDisabled}>{config.submitLabel ?? 'Submit'}</Button>
                ) : (
                  undefined
                )}
              </FormLayout>
            );
          }}
        </form.Subscribe>
        </fieldset>
      </FormRoot>
    );
  }

  return {
    Form,
    form,
    currentPage: multiPage.currentPage,
    totalPages: multiPage.totalPages,
    visiblePages: multiPage.visiblePages,
    goToNextPage: multiPage.goToNextPage,
    goToPreviousPage: multiPage.goToPreviousPage,
    setCurrentPage: multiPage.setCurrentPage,
    isFirstPage: multiPage.isFirstPage,
    isLastPage: multiPage.isLastPage,
    progressValue: multiPage.progressValue,
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
}
