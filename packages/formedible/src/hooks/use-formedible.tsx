import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { defaultValidationLogic, evaluate, useForm, useStore } from '@tanstack/react-form';
import type { AnyFieldApi, DeepKeys, ValidationLogicFn } from '@tanstack/react-form';
import type { ReactElement, ReactNode } from 'react';

import { FieldRenderer } from '@/components/formedible/field-renderer';
import { isFormedibleHelpConfig } from '@/components/formedible/fields/field-wrapper';
import { Form as FormRoot } from '@/components/formedible/form';
import type { FormProps } from '@/components/formedible/form';
import { FormLayout } from '@/components/formedible/layout/form-layout';
import { FormNavigation } from '@/components/formedible/layout/form-navigation';
import { FormProgress } from '@/components/formedible/layout/form-progress';
import { FormTabs } from '@/components/formedible/layout/form-tabs';
import { Button } from '@/components/ui/button';
import { useFormAnalytics } from '@/hooks/use-form-analytics';
import type { FormAnalyticsAbandonContext, FormAnalyticsPageValidationState, FormAnalyticsTabValidationState } from '@/hooks/use-form-analytics';
import { useFormPersistence } from '@/hooks/use-form-persistence';
import { useFormTabs } from '@/hooks/use-form-tabs';
import { useMultiPage } from '@/hooks/use-multi-page';
import { getValueAtFieldPath, setValueAtFieldPath } from '@/lib/formedible/field-path';
import { evaluateFieldConditional, isFieldLocationVisible } from '@/lib/formedible/field-visibility';
import type { FormediblePageTabVisibility } from '@/lib/formedible/field-visibility';
import { resolveDynamicText } from '@/lib/formedible/dynamic-text';
import { normalizeFieldConfig, normalizeFieldType } from '@/lib/formedible/normalize-field-config';
import { normalizeOptions } from '@/lib/formedible/normalize-options';
import type { FormedibleFieldComponent, FormedibleFieldSection, FormedibleFormApiContext, FormedibleFormValues, FormedibleValidationSummaryConfig, UseFormedibleOptions } from '@/lib/formedible/types';
import type { NormalizedFieldConfig } from '@/lib/formedible/types';
import { buildFieldValidators, buildFormValidators, isFormedibleSchemaAsync, mergeFormedibleFieldErrors } from '@/lib/formedible/validation';
import type { FormedibleFormValidators, FormedibleValidatorContext } from '@/lib/formedible/validation';
import { formatValidationError } from '@/lib/formedible/zod-errors';
import { cn } from '@/lib/utils';

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

interface CollapsibleSectionProps {
  readonly section: FormedibleFieldSection;
  readonly collapseLabel: ReactNode;
  readonly expandLabel: ReactNode;
  readonly children: ReactNode;
}

/**
 * Collapsible section shell: keeps the static section header markup
 * (`data-formedible-section`) and adds the collapse/expand toggle that hides
 * the section's fields while collapsed (legacy main behavior).
 */
function CollapsibleSection({ section, collapseLabel, expandLabel, children }: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded !== false);
  const title = section.title;
  const description = section.description;

  return (
    <div className="space-y-4">
      <div className="space-y-1" data-formedible-section="true">
        <div className="flex items-center justify-between gap-2">
          {title === undefined ? undefined : <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
          <button
            type="button"
            data-formedible-section-toggle="true"
            aria-expanded={isExpanded}
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded((previous) => !previous)}
          >
            {isExpanded ? collapseLabel : expandLabel}
          </button>
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : undefined}
      </div>
      {isExpanded ? <div className="space-y-4">{children}</div> : undefined}
    </div>
  );
}

export function useFormedible<TFormValues extends FormedibleFormValues = FormedibleFormValues>(config: UseFormedibleOptions<TFormValues>) {
  const formId = useId();
  const normalizedOptions = normalizeOptions(config);
  const fields = normalizedOptions.fields;
  /**
   * Page/tab configs handed to the validators so schema-issue filtering can
   * resolve a field's location visibility from the values being validated
   * (evaluated with the same semantics as `useMultiPage`/`useFormTabs`, see
   * `isFieldLocationVisible`) instead of a stale render-time snapshot.
   */
  const pageTabVisibility: FormediblePageTabVisibility<TFormValues> = { pages: config.pages, tabs: config.tabs };
  const pageValidationStateRef = useRef<(pageNumber: number) => FormAnalyticsPageValidationState>(() => ({ hasErrors: false, completionPercentage: 0 }));
  const abandonContextRef = useRef<() => FormAnalyticsAbandonContext>(() => ({ completionPercentage: 0 }));
  const autoSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusInvalidFieldTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hasInvalidSubmitAttempt, setHasInvalidSubmitAttempt] = useState(false);
  const analytics = useFormAnalytics(config.analytics, {
    getPageValidationState: (pageNumber) => pageValidationStateRef.current(pageNumber),
    getAbandonContext: () => abandonContextRef.current(),
  });
  /**
   * Adoption gate for `formOptions.defaultValues` (the same `evaluate`
   * deep-equality TanStack's `FormApi.update` gates its reseed on).
   *
   * TanStack's `useForm` reinstalls its options every render and reseeds the
   * store values to `defaultValues` whenever they stop deep-equaling the
   * previous render's copy while no field is touched (fresh mount, right after
   * the post-submit `form.reset()`). Inline configs like
   * `{ birthDate: new Date() }` mint a later timestamp on EVERY host render, so
   * that reseed fires, notifies the host's values subscription, re-renders the
   * host, mints another timestamp, and tips into a self-sustaining setState
   * cascade — React error #185 (maximum update depth) whenever each cycle
   * crosses a millisecond boundary, i.e. exactly in slowed environments.
   *
   * The gate keeps handing TanStack the last ADOPTED object until the incoming
   * defaults change as a discrete burst: the first differing render adopts, and
   * adoption re-arms only after two consecutive renders agree (memoized
   * configs, like the builder preview, always produce such stable pairs between
   * real edits, so live default updates keep working). Configs whose defaults
   * differ on every consecutive render — the clock-churning kind — get their
   * first value adopted and are then frozen, which caps the cascade at a single
   * harmless reseed instead of an unbounded loop.
   */
  const incomingDefaultValues = config.formOptions?.defaultValues;
  const adoptedDefaultValuesRef = useRef<TFormValues | undefined>(incomingDefaultValues ?? ({} as TFormValues));
  const previousIncomingDefaultValuesRef = useRef<TFormValues | undefined>(incomingDefaultValues);
  const defaultValuesAdoptionArmedRef = useRef(true);
  const incomingDefaultValuesChanged =
    previousIncomingDefaultValuesRef.current !== incomingDefaultValues &&
    !evaluate(previousIncomingDefaultValuesRef.current, incomingDefaultValues);

  if (incomingDefaultValuesChanged) {
    if (defaultValuesAdoptionArmedRef.current && !evaluate(adoptedDefaultValuesRef.current, incomingDefaultValues)) {
      adoptedDefaultValuesRef.current = incomingDefaultValues;
      defaultValuesAdoptionArmedRef.current = false;
    }
  } else {
    defaultValuesAdoptionArmedRef.current = true;
  }

  previousIncomingDefaultValuesRef.current = incomingDefaultValues;
  const defaultValues: TFormValues = adoptedDefaultValuesRef.current ?? ({} as TFormValues);
  // The TanStack-typed build result only ever installs plain validator
  // functions; the cast narrows the union slot types to those callables so the
  // merged submit slot below can invoke them with the shared context shape.
  const baseFormValidators = buildFormValidators(config.schema, config.crossFieldValidation, fields, pageTabVisibility) as FormedibleFormValidators<TFormValues> | undefined;
  /**
   * Form-level async slots are kept only when the form schema is genuinely
   * async (`isFormedibleSchemaAsync` probes it once per schema against the
   * default values). A sync schema is fully covered by the sync slots, and
   * merely registering an async validator would make form-core schedule its
   * debounced pass through a real `setTimeout`, whose per-cause timer slots a
   * stale change pass can clear mid-submit, leaving `handleSubmit` unsettled.
   */
  const formSchemaIsAsync = isFormedibleSchemaAsync(config.schema, defaultValues);
  /**
   * TanStack only validates MOUNTED fields during `validateAllFields`, so a
   * required field on an inactive tab/page would silently pass a bare submit.
   * The sync submit slot extends the base validators with a configured-
   * validation pass over unmounted-but-visible fields; TanStack maps the
   * returned field errors into fieldMeta, so `handleSubmit` blocks and
   * `onSubmitInvalid` fires through the native lifecycle.
   */
  const formValidators: FormedibleFormValidators<TFormValues> = {
    ...baseFormValidators,
    onChangeAsync: formSchemaIsAsync ? baseFormValidators?.onChangeAsync : undefined,
    onSubmitAsync: formSchemaIsAsync ? baseFormValidators?.onSubmitAsync : undefined,
    onSubmit: (context) => mergeFormedibleFieldErrors(baseFormValidators?.onSubmit?.(context), collectUnmountedFieldErrors(context.value)),
  };
  const form = useForm({
    defaultValues,
    validators: formValidators,
    validationLogic: formedibleValidationLogic,
    asyncDebounceMs: config.formOptions?.asyncDebounceMs,
    canSubmitWhenInvalid: config.formOptions?.canSubmitWhenInvalid,
    onSubmitInvalid: ({ formApi, value, meta }) => {
      setHasInvalidSubmitAttempt(true);
      handleInvalidSubmitEntries(getInvalidFieldEntries(formApi.state as FormedibleValidationFormState<TFormValues>));
      config.formOptions?.onSubmitInvalid?.({ value, formApi, meta });
    },
    onSubmit: async ({ value }) => {
      const submissionStartedAt = Date.now();

      // Consumer first: when it throws, the draft stays in storage and no
      // completion/performance analytics fire (the rejection is logged by the
      // submit call sites' catch handler).
      await config.formOptions?.onSubmit?.({ value, formApi: getFormApiContext(value as TFormValues) });
      analytics.trackFormComplete(value as TFormValues);
      analytics.trackSubmissionPerformance(Date.now() - submissionStartedAt);
      // Reset before clearing: form.reset() updates the store synchronously, so
      // clearStorage() acknowledges the post-reset snapshot as the autosave
      // baseline and the reset re-render cannot schedule a debounced save that
      // would resurrect a phantom draft right after the key was removed.
      // Legacy main behavior resets the form after every successful submit;
      // `resetOnSubmitSuccess: false` opts out and keeps the submitted values.
      if (config.resetOnSubmitSuccess !== false) {
        form.reset();
      }
      clearStorage();
    },
  });

  /**
   * TanStack v1 `useForm` never re-renders its host (only `form.Subscribe` /
   * `useStore` do), so the host subscribes to the live values here. Every value
   * change re-renders `useFormedible`, keeping `useMultiPage` / `useFormTabs`
   * visibility, persistence autosave scheduling, and the returned navigation
   * closures in sync with what the user typed.
   */
  const storeValues = useStore(form.store, (state) => state.values);

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

  /**
   * form-core re-throws consumer `onSubmit` failures from `handleSubmit()`, so
   * every internal call site routes through this helper: the rejection is
   * surfaced through `console.error` instead of becoming an unhandled promise
   * rejection (the error is never swallowed silently).
   */
  function submitForm(): void {
    form.handleSubmit().catch((error: unknown) => {
      console.error('Formedible form submission failed:', error);
    });
  }

  function getFormApiContext(values: TFormValues = form.state.values): FormedibleFormApiContext<TFormValues> {
    return {
      state: { values },
      handleSubmit: () => submitForm(),
    };
  }

  function getValuesWithFieldUpdate(fieldName: string, nextValue: unknown): TFormValues {
    return setValueAtFieldPath<TFormValues>(form.state.values, fieldName, nextValue);
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
      submitForm();
    }, config.autoSubmitDebounceMs ?? 300);
  }

  function handlePageChange(context: { readonly fromPage: number; readonly toPage: number; readonly timeSpent: number }) {
    analytics.trackPageChange(context);
    config.onPageChange?.(context.toPage, context.toPage > context.fromPage ? 'next' : 'previous');
  }
  const multiPage = useMultiPage({
    fields,
    pages: config.pages,
    values: storeValues,
    onPageChange: handlePageChange,
  });
  const tabs = useFormTabs({
    fields,
    tabs: config.tabs,
    values: storeValues,
    analytics,
    getTabValidationState: (tabId) => getTabValidationState(tabId),
  });
  const { saveToStorage, loadFromStorage, clearStorage } = useFormPersistence(form, config.persistence, {
    currentPage: multiPage.currentPage,
    totalPages: multiPage.totalPages,
    setCurrentPage: multiPage.setCurrentPage,
    values: storeValues,
  });
  const registeredDefaultComponents = useMemo(() => {
    if (!config.defaultComponents) {
      return undefined;
    }

    const registered: Record<string, FormedibleFieldComponent<TFormValues>> = {};

    for (const [typeKey, component] of Object.entries(config.defaultComponents)) {
      registered[normalizeFieldType(typeKey)] = component;
    }

    return registered;
  }, [config.defaultComponents]);
  const hasConfiguredPages = fields.some((fieldConfig) => fieldConfig.page !== undefined) || Boolean(config.pages?.length);
  const hasConfiguredTabs = tabs.visibleTabs.length > 0;
  const validationSummaryConfig = getValidationSummaryConfig();

  function isCompletedValue(value: unknown) {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== '';
  }

  function getFieldsValidationState(sourcedFields: readonly NormalizedFieldConfig<TFormValues>[]): FormAnalyticsPageValidationState {
    const formState = form.state as {
      readonly values: TFormValues;
      readonly fieldMeta?: Record<string, { readonly errors?: readonly unknown[] } | undefined>;
    };
    const completedFields = sourcedFields.filter((fieldConfig) => isCompletedValue(getValueAtFieldPath(formState.values, fieldConfig.name))).length;
    const hasErrors = sourcedFields.some((fieldConfig) => (formState.fieldMeta?.[fieldConfig.name]?.errors?.length ?? 0) > 0);

    return {
      hasErrors,
      completionPercentage: sourcedFields.length > 0 ? (completedFields / sourcedFields.length) * 100 : 0,
    };
  }

  function getPageValidationState(pageNumber: number): FormAnalyticsPageValidationState {
    return getFieldsValidationState(fields.filter((fieldConfig) => (fieldConfig.page ?? 1) === pageNumber));
  }

  function getTabValidationState(tabId: string): FormAnalyticsTabValidationState {
    return getFieldsValidationState(fields.filter((fieldConfig) => fieldConfig.tab === tabId));
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
  abandonContextRef.current = getAbandonContext;

  function shouldRenderField(fieldConfig: NormalizedFieldConfig<TFormValues>, localValues: FormedibleFormValues | undefined) {
    return evaluateFieldConditional(fieldConfig.conditional, localValues ?? form.state.values);
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
      fields,
      pageTabVisibility,
    ) as unknown as RuntimeFieldValidator<TFormValues>;

    return validators.onSubmit?.({
      value: getValueAtFieldPath(values, fieldConfig.name),
      fieldApi: { form },
    });
  }

  /**
   * Runs the configured validation for visible fields that currently have no
   * mounted field instance (fields on inactive-but-visible tabs/pages). Mounted
   * fields are skipped: TanStack's `validateAllFields` already runs their
   * validators, and reporting them here too would duplicate their errors in
   * fieldMeta. Fields whose page/tab is currently hidden (through
   * `pages[].conditional`/`tabs[].conditional`) are skipped too: they have no
   * navigable instance, so surfacing their errors would block submit with no
   * way for the user to reach the field.
   */
  function collectUnmountedFieldErrors(values: TFormValues) {
    const fieldErrors: Record<string, string> = {};

    for (const fieldConfig of fields) {
      if (form.fieldInfo[fieldConfig.name]?.instance != null) {
        continue;
      }

      if (!isFieldLocationVisible(fieldConfig, fields, pageTabVisibility, values)) {
        continue;
      }

      if (!shouldRenderField(fieldConfig, values)) {
        continue;
      }

      const message = getFieldErrorFromConfiguredValidation(fieldConfig, values);

      if (message) {
        fieldErrors[fieldConfig.name] = message;
      }
    }

    return Object.keys(fieldErrors).length > 0 ? { fields: fieldErrors } : undefined;
  }

  function getInvalidFieldEntries(state: FormedibleValidationFormState<TFormValues>): readonly InvalidFieldEntry<TFormValues>[] {
    const entries: InvalidFieldEntry<TFormValues>[] = [];

    for (const fieldConfig of fields) {
      if (!isFieldLocationVisible(fieldConfig, fields, pageTabVisibility, state.values)) {
        continue;
      }

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

  function resolveFieldHelp(help: NormalizedFieldConfig<TFormValues>['help'], values: FormedibleFormValues): NormalizedFieldConfig<TFormValues>['help'] {
    if (!isFormedibleHelpConfig(help)) {
      return resolveDynamicText(help, values);
    }

    return {
      ...help,
      text: resolveDynamicText(help.text, values),
      tooltip: resolveDynamicText(help.tooltip, values),
    };
  }

  function withDynamicText(fieldConfig: NormalizedFieldConfig<TFormValues>, values: FormedibleFormValues) {
    return {
      ...fieldConfig,
      label: resolveDynamicText(fieldConfig.label, values),
      description: resolveDynamicText(fieldConfig.description, values),
      placeholder: typeof fieldConfig.placeholder === 'string' ? String(resolveDynamicText(fieldConfig.placeholder, values)) : fieldConfig.placeholder,
      help: resolveFieldHelp(fieldConfig.help, values),
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
      collapsible: section.collapsible,
      defaultExpanded: section.defaultExpanded,
    } satisfies FormedibleFieldSection;
  }

  function getSectionTitle(section: string | FormedibleFieldSection): ReactNode {
    return typeof section === 'string' ? section : section.title;
  }

  function getSectionDescription(section: string | FormedibleFieldSection): ReactNode {
    return typeof section === 'string' ? undefined : section.description;
  }

  /**
   * Content-derived grouping key for sections. Only string titles can be keyed
   * by content; ReactNode-titled sections intentionally return `undefined` so
   * `renderFields` groups them by resolved-node identity instead (see
   * `isSameUnkeyedSection`) — a shared description string alone must never
   * collapse two different ReactNode titles into one header.
   */
  function getSectionKey(section: string | FormedibleFieldSection | undefined): string | undefined {
    if (section === undefined) {
      return undefined;
    }

    if (typeof section === 'string') {
      return section;
    }

    if (typeof section.title === 'string') {
      const description = typeof section.description === 'string' ? section.description : '';

      return `${section.title}\u0000${description}`;
    }

    return undefined;
  }

  /**
   * Sections whose title cannot be keyed by content (ReactNode titles) are
   * compared by resolved-node reference: consecutive fields belong to one
   * section run only when BOTH the title node and the description match —
   * element reference equality for nodes, value equality for strings.
   */
  function isSameUnkeyedSection(section: string | FormedibleFieldSection, previousSection: string | FormedibleFieldSection | undefined) {
    if (typeof section === 'string' || previousSection === undefined || typeof previousSection === 'string') {
      return false;
    }

    return section.title === previousSection.title && section.description === previousSection.description;
  }

  function renderSectionHeader(section: string | FormedibleFieldSection, key: string) {
    const description = getSectionDescription(section);
    const title = getSectionTitle(section);

    if (title === undefined && description === undefined) {
      return null;
    }

    return (
      <div key={key} data-formedible-section="true" className="space-y-1">
        {title === undefined ? undefined : <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>}
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : undefined}
      </div>
    );
  }

  function renderField(fieldConfig: NormalizedFieldConfig<TFormValues>, options?: { readonly name?: string; readonly key?: string; readonly localValues?: FormedibleFormValues }) {
    const fieldName = options?.name ?? fieldConfig.name;
    const dynamicConfig = withDynamicText(fieldConfig, options?.localValues ?? form.state.values);
    // Hook-level `fieldClassName`/`labelClassName` apply to every field alongside
    // each field's own classes (legacy main forwarded them into every field).
    const styledConfig: NormalizedFieldConfig<TFormValues> = {
      ...dynamicConfig,
      className: cn(dynamicConfig.className, config.fieldClassName) || undefined,
      labelClassName: cn(dynamicConfig.labelClassName, config.labelClassName) || undefined,
    };
    const fieldDisabledConfig = config.disabled || config.loading ? ({ ...styledConfig, disabled: true } satisfies NormalizedFieldConfig<TFormValues>) : styledConfig;
    const renderConfig = fieldName === fieldConfig.name ? fieldDisabledConfig : normalizeFieldConfig<TFormValues>({ ...fieldDisabledConfig, name: fieldName });
    const localValues = options?.localValues;

    if (!shouldRenderField(fieldConfig, localValues)) {
      return null;
    }

    return (
      <form.Field
        key={options?.key ?? fieldName}
        name={fieldName as DeepKeys<TFormValues>}
        validators={buildFieldValidators<TFormValues, DeepKeys<TFormValues>>(renderConfig, config.schema, config.crossFieldValidation, config.asyncValidation, fields, pageTabVisibility)}
      >
        {(field) => {
          const error = field.state.meta.errors.map(formatValidationError).find((message) => message !== undefined);
          type FieldValueUpdate = Parameters<typeof field.handleChange>[0];

          return (
            <FieldRenderer
              fieldConfig={renderConfig}
              fieldApi={field as AnyFieldApi}
              field={{
                id: getFieldId(fieldName),
                name: fieldName,
                value: field.state.value,
                formValues: localValues ?? form.state.values,
                error,
                onFocus: () => {
                  analytics.trackFieldFocus(fieldName);
                  config.formOptions?.onFocus?.({ value: form.state.values, formApi: getFormApiContext() });
                },
                onBlur: () => {
                  field.handleBlur();
                  const fieldErrors = field.state.meta.errors.map(formatValidationError).filter((message): message is string => message !== undefined);
                  analytics.trackFieldBlur(fieldName, { isValid: fieldErrors.length === 0, errors: fieldErrors });
                  config.formOptions?.onBlur?.({ value: form.state.values, formApi: getFormApiContext() });
                },
                onChange: (nextValue) => {
                  if (!field.state.meta.isTouched) {
                    field.setMeta((previous) => ({ ...previous, isTouched: true }));
                  }

                  field.handleChange(nextValue as FieldValueUpdate);
                  analytics.trackFieldChange(fieldName, nextValue);
                  const nextValues = getValuesWithFieldUpdate(fieldName, nextValue);
                  config.formOptions?.onChange?.({ value: nextValues, formApi: getFormApiContext(nextValues) });
                  scheduleAutoSubmit();
                },
              }}
              renderField={renderField}
              defaultComponent={registeredDefaultComponents?.[renderConfig.type]}
              globalWrapper={config.globalWrapper}
            />
          );
        }}
      </form.Field>
    );
  }

  /**
   * Whether a field's section continues the collapsible section run started by
   * `runSection`: keyed sections compare by content key, unkeyed (ReactNode
   * titled) sections compare by resolved-node identity like the header dedup.
   */
  function belongsToSectionRun(
    nextSection: string | FormedibleFieldSection | undefined,
    runSectionKey: string | undefined,
    runSection: string | FormedibleFieldSection,
  ) {
    if (nextSection === undefined) {
      return false;
    }

    const nextDerivedKey = getSectionKey(nextSection);

    if (runSectionKey !== undefined && nextDerivedKey !== undefined) {
      return nextDerivedKey === runSectionKey;
    }

    if (runSectionKey === undefined && nextDerivedKey === undefined) {
      return isSameUnkeyedSection(nextSection, runSection);
    }

    return false;
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
    let previousSection: string | FormedibleFieldSection | undefined;
    let nextUnkeyedSectionOrdinal = 0;

    for (let index = 0; index < activeFields.length; index += 1) {
      const fieldConfig = activeFields[index];

      if (fieldConfig === undefined || !shouldRenderField(fieldConfig, values)) {
        continue;
      }

      const dynamicConfig = withDynamicText(fieldConfig, values);
      const section = dynamicConfig.section;
      const derivedSectionKey = getSectionKey(section);
      const sectionKey =
        section === undefined
          ? undefined
          : derivedSectionKey ??
            (isSameUnkeyedSection(section, previousSection) && previousSectionKey !== undefined
              ? previousSectionKey
              : `section-${(nextUnkeyedSectionOrdinal += 1)}`);
      const shouldRenderHeader = !previousFieldHadSection || sectionKey !== previousSectionKey;

      if (section !== undefined && typeof section !== 'string' && section.collapsible && shouldRenderHeader) {
        const sectionFields: ReactNode[] = [
          <Fragment key={fieldConfig.name}>{renderField(dynamicConfig, { localValues: values })}</Fragment>,
        ];
        let runSection: string | FormedibleFieldSection = section;
        let cursor = index + 1;

        while (cursor < activeFields.length) {
          const nextFieldConfig = activeFields[cursor];

          if (nextFieldConfig === undefined) {
            break;
          }

          if (!shouldRenderField(nextFieldConfig, values)) {
            cursor += 1;
            continue;
          }

          const nextDynamicConfig = withDynamicText(nextFieldConfig, values);
          const nextSection = nextDynamicConfig.section;

          if (!belongsToSectionRun(nextSection, derivedSectionKey, runSection)) {
            break;
          }

          sectionFields.push(
            <Fragment key={nextFieldConfig.name}>{renderField(nextDynamicConfig, { localValues: values })}</Fragment>,
          );

          if (nextSection !== undefined) {
            runSection = nextSection;
          }

          cursor += 1;
        }

        index = cursor - 1;
        renderedFields.push(
          <CollapsibleSection
            key={`${fieldConfig.name}-section`}
            section={section}
            collapseLabel={resolveDynamicText(config.collapseLabel ?? 'Collapse', values)}
            expandLabel={resolveDynamicText(config.expandLabel ?? 'Expand', values)}
          >
            {sectionFields}
          </CollapsibleSection>,
        );
        previousFieldHadSection = true;
        previousSectionKey = sectionKey;
        previousSection = section;
        continue;
      }

      if (section !== undefined && shouldRenderHeader) {
        const sectionHeader = renderSectionHeader(section, `${fieldConfig.name}-section`);

        if (sectionHeader !== null) {
          renderedFields.push(sectionHeader);
        }
      }

      renderedFields.push(
        <Fragment key={fieldConfig.name}>
          {renderField(dynamicConfig, { localValues: values })}
        </Fragment>,
      );
      previousFieldHadSection = section !== undefined;
      previousSectionKey = sectionKey;
      previousSection = section;
    }

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

  /**
   * Per-render data consumed by the returned `Form` component. `Form` keeps a
   * stable identity across host re-renders (see `formComponentRef` below), so it
   * cannot close over hook locals directly; instead it reads the latest runtime
   * object through this ref. The `form` api instance itself is stable per mount,
   * so `Form` closes over it once.
   */
  const formRuntime = {
    config,
    analytics,
    hasConfiguredPages,
    hasConfiguredTabs,
    hasInvalidSubmitAttempt,
    validationSummaryConfig,
    multiPage,
    tabs,
    getFormApiContext,
    getInvalidFieldEntries,
    countInvalidFieldsByPage,
    countInvalidFieldsByTab,
    renderFields,
    renderValidationSummary,
    renderPageHeader,
  };
  const formRuntimeRef = useRef(formRuntime);
  formRuntimeRef.current = formRuntime;

  const formComponentRef = useRef<((props: FormProps) => ReactElement) | undefined>(undefined);

  if (formComponentRef.current === undefined) {
    formComponentRef.current = function Form({ className, onBlur, onFocus, onInput, onInvalid, onKeyDown, onKeyUp, onReset, ...props }: FormProps) {
      const runtime = formRuntimeRef.current;
      const shouldShowSubmitButton = runtime.config.showSubmitButton !== false;

      return (
        <FormRoot
          {...props}
          className={className}
          noValidate={props.noValidate ?? true}
          aria-busy={runtime.config.loading ? true : undefined}
          onBlur={(event) => {
            onBlur?.(event);
            runtime.config.onFormBlur?.(event, runtime.getFormApiContext());
          }}
          onFocus={(event) => {
            onFocus?.(event);
            runtime.config.onFormFocus?.(event, runtime.getFormApiContext());
          }}
          onInput={(event) => {
            onInput?.(event);
            runtime.config.onFormInput?.(event, runtime.getFormApiContext());
          }}
          onInvalid={(event) => {
            onInvalid?.(event);
            runtime.config.onFormInvalid?.(event, runtime.getFormApiContext());
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            runtime.config.onFormKeyDown?.(event, runtime.getFormApiContext());
          }}
          onKeyUp={(event) => {
            onKeyUp?.(event);
            runtime.config.onFormKeyUp?.(event, runtime.getFormApiContext());
          }}
          onReset={(event) => {
            onReset?.(event);
            form.reset();
            runtime.config.formOptions?.onReset?.({ value: form.state.values, formApi: runtime.getFormApiContext() });
            runtime.config.onFormReset?.(event, runtime.getFormApiContext());
            runtime.analytics.trackFormReset('reset');
          }}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            // Always enter TanStack's submit lifecycle: it marks fields touched,
            // runs submit-cause validation and populates fieldMeta, so inline
            // errors appear on a bare invalid submit. The summary computation,
            // auto-navigation and the consumer onSubmitInvalid callback all run
            // from the `onSubmitInvalid` hook config where fieldMeta is settled.
            submitForm();
          }}
        >
          <form.Subscribe selector={(state) => ({ values: state.values, fieldMeta: state.fieldMeta, isSubmitting: Boolean(state.isSubmitting), canSubmit: Boolean(state.canSubmit) })}>
            {(state) => {
              const formValues = state.values as TFormValues;
              const controlsDisabled = Boolean(runtime.config.disabled || runtime.config.loading || state.isSubmitting);
              const submitDisabled = controlsDisabled || !state.canSubmit;
              const shouldCollectInvalidEntries = runtime.validationSummaryConfig.enabled && runtime.hasInvalidSubmitAttempt;
              const invalidEntries = shouldCollectInvalidEntries ? runtime.getInvalidFieldEntries({ values: formValues, fieldMeta: state.fieldMeta }) : [];
              const pageErrorCounts = runtime.countInvalidFieldsByPage(invalidEntries);
              const tabErrorCounts = runtime.countInvalidFieldsByTab(invalidEntries);
              const fieldsContent = runtime.renderFields(formValues);

              return (
                <fieldset disabled={controlsDisabled} className="contents">
                  <FormLayout className={runtime.config.formClassName}>
                    {runtime.renderValidationSummary(invalidEntries, formValues)}
                    {runtime.hasConfiguredTabs ? (
                      <FormTabs
                        tabs={runtime.tabs.visibleTabs.map((tab) => ({
                          id: tab.id,
                          label: resolveDynamicText(tab.label, formValues),
                          description: resolveDynamicText(tab.description, formValues),
                          errorCount: runtime.validationSummaryConfig.showBadges && runtime.hasInvalidSubmitAttempt ? tabErrorCounts[tab.id] ?? 0 : 0,
                        }))}
                        activeTab={runtime.tabs.activeTab}
                        onTabChange={runtime.tabs.changeTab}
                      >
                        {fieldsContent}
                      </FormTabs>
                    ) : (
                      <>
                        {runtime.renderPageHeader(formValues, pageErrorCounts[runtime.multiPage.currentPage] ?? 0)}
                        {fieldsContent}
                      </>
                    )}
                    {runtime.hasConfiguredPages ? (
                      <FormNavigation
                        isFirstPage={runtime.multiPage.isFirstPage}
                        isLastPage={runtime.multiPage.isLastPage}
                        previousLabel={runtime.config.previousLabel ?? 'Previous'}
                        nextLabel={runtime.config.nextLabel ?? 'Next'}
                        submitLabel={runtime.config.submitLabel ?? 'Submit'}
                        onPrevious={runtime.multiPage.goToPreviousPage}
                        onNext={runtime.multiPage.goToNextPage}
                        disabled={controlsDisabled}
                        canSubmit={state.canSubmit}
                        buttonClassName={runtime.config.buttonClassName}
                        submitButtonClassName={runtime.config.submitButtonClassName}
                        showSubmitButton={shouldShowSubmitButton}
                      />
                    ) : shouldShowSubmitButton ? (
                      <Button type="submit" disabled={submitDisabled} className={runtime.config.submitButtonClassName}>{runtime.config.submitLabel ?? 'Submit'}</Button>
                    ) : (
                      undefined
                    )}
                  </FormLayout>
                </fieldset>
              );
            }}
          </form.Subscribe>
        </FormRoot>
      );
    };
  }

  const Form = formComponentRef.current;

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
