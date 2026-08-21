import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/analytics');
const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

const sourceBase = 'https://github.com/DimitriGilbert/Formedible/blob/re-codex';

function sourceReference(title: string, path: string, description: string): DocsGuideLink {
  return { title, description, href: `${sourceBase}/${path}` };
}

const analyticsExample = { title: 'Live example: analytics', description: 'Three-page lead form wired to start, field, page, completion, and abandon callbacks.', href: '/docs/examples?example=analytics' };

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'API', description: 'Hook options, return values, form props, labels, persistence, and analytics.', href: '/docs/api' },
  { title: 'Analytics & Tracking Form', description: 'Open the form that reports start, field, page, completion, and abandon callbacks.', href: '/docs/examples?example=analytics' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Configuration',
    body: 'Analytics is a callback object passed to useFormedible. Current events cover form start, field focus, field blur, field change, field complete, field error, page change, form complete, abandon, and reset.',
    bullets: [
      'Field callback names use Extract<keyof TFormValues, string> | string, so nested paths are allowed.',
      'Runtime timestamps come from Date.now; blur time is the blur timestamp minus the stored focus timestamp.',
      'Page completion, tab analytics, and performance callbacks are typed as never and are not emitted.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('onFormStart', '(timestamp: number) => void', 'undefined', 'Runs once from the analytics hook mount effect.'),
        createPropertyRow('onFieldFocus', '(fieldName: Extract<keyof TFormValues, string> | string, timestamp: number) => void', 'undefined', 'Runs when a field receives focus.'),
        createPropertyRow('onFieldBlur', '(fieldName: Extract<keyof TFormValues, string> | string, timeSpent: number) => void', 'undefined', 'Runs on blur with elapsed focus time.'),
        createPropertyRow('onFieldChange', '(fieldName: Extract<keyof TFormValues, string> | string, value: unknown, timestamp: number) => void', 'undefined', 'Runs after a field change with the new field value.'),
        createPropertyRow('onFieldComplete', '(fieldName: Extract<keyof TFormValues, string> | string, isValid: boolean, timeSpent: number) => void', 'undefined', 'Runs after blur with the latest validity flag and elapsed focus time.'),
        createPropertyRow('onFieldError', '(fieldName: Extract<keyof TFormValues, string> | string, errors: readonly string[], timestamp: number) => void', 'undefined', 'Runs when blur receives field errors, or when the standalone tracker records errors.'),
        createPropertyRow('onPageChange', '(fromPage: number, toPage: number, timeSpent: number, pageValidationState?: { readonly hasErrors: boolean; readonly completionPercentage: number }) => void', 'undefined', 'Runs after page movement with timing and validation state for the page being left.'),
        createPropertyRow('onFormComplete', '(timeSpent: number, formData: TFormValues) => void', 'undefined', 'Runs after Formedible tracks a successful submit.'),
        createPropertyRow('onFormAbandon', '(completionPercentage: number, context?: { readonly currentPage?: number; readonly currentTab?: string; readonly lastActiveField?: string }) => void', 'undefined', 'Runs from cleanup if the form unmounts before completion.'),
        createPropertyRow('onFormReset', '(timestamp: number, reason?: string) => void', 'undefined', 'Runs when reset tracking is called. The built-in reset path passes the reset reason when supplied.'),
      ],
    },
    snippet: {
      title: 'Callbacks from FormedibleAnalyticsConfig',
      language: 'tsx',
      code: `const analytics = {
  onFormStart: (timestamp) => track('form-start', { timestamp }),
  onFieldFocus: (fieldName, timestamp) => track('field-focus', { fieldName, timestamp }),
  onFieldBlur: (fieldName, timeSpent) => track('field-blur', { fieldName, timeSpent }),
  onFieldChange: (fieldName, value, timestamp) => track('field-change', { fieldName, value, timestamp }),
  onPageChange: (fromPage, toPage, timeSpent, pageValidationState) => {
    track('page-change', { fromPage, toPage, timeSpent, pageValidationState });
  },
  onFormComplete: (timeSpent, formData) => track('form-complete', { timeSpent, formData }),
  onFormAbandon: (completionPercentage, context) => track('form-abandon', { completionPercentage, context }),
} satisfies FormedibleAnalyticsConfig<LeadFormValues>;`,
    },
    references: [
      sourceReference('Types: FormedibleAnalyticsConfig', 'packages/formedible/src/lib/formedible/types.ts#L492-L543', 'Supported callbacks and never-typed older callbacks.'),
      sourceReference('Source: use-form-analytics.ts', 'packages/formedible/src/hooks/use-form-analytics.ts#L63-L171', 'Runtime callback calls.'),
      analyticsExample,
    ],
  },
  {
    title: 'Field events',
    body: 'Field tracking is wired through the FieldRenderer controller from useFormedible. Focus stores time, change reports the next value, and blur reports elapsed focus time plus validity.',
    bullets: [
      'trackFieldFocus stores lastActiveField and focusedAt[fieldName], then calls onFieldFocus.',
      'trackFieldChange calls onFieldChange with fieldName, value, and Date.now().',
      'trackFieldBlur calls onFieldBlur, optional onFieldError, then onFieldComplete, and removes the stored focus timestamp.',
      'getFieldBlurTime returns 0 when blur occurs without a stored focus timestamp.',
    ],
    snippet: {
      title: 'Field controller analytics path',
      language: 'tsx',
      code: `field={{
  name: fieldName,
  onFocus: () => analytics.trackFieldFocus(fieldName),
  onBlur: () => {
    field.handleBlur();
    const fieldErrors = field.state.meta.errors
      .map(formatValidationError)
      .filter((message): message is string => message !== undefined);

    analytics.trackFieldBlur(fieldName, {
      isValid: fieldErrors.length === 0,
      errors: fieldErrors,
    });
  },
  onChange: (nextValue) => analytics.trackFieldChange(fieldName, nextValue),
}}`,
    },
    references: [
      sourceReference('Source: field analytics methods', 'packages/formedible/src/hooks/use-form-analytics.ts#L102-L124', 'Focus, blur, change, error, and completion event calls.'),
      sourceReference('Source: FieldRenderer wiring', 'packages/formedible/src/hooks/use-formedible.tsx#L636-L656', 'The field controller calls analytics from focus, blur, and change.'),
      sourceReference('Test: blur timing', 'tests/formedible/phase10-behavior.test.ts#L236-L264', 'Asserts positional arguments and focus-derived blur time.'),
    ],
  },
  {
    title: 'Page and form events',
    body: 'Page changes start in useMultiPage. useFormedible passes the page context to analytics.trackPageChange and the public onPageChange option.',
    bullets: [
      'useMultiPage measures timeSpent as Date.now() minus pageStartedAt before it changes the page.',
      'analytics.trackPageChange includes hasErrors and completionPercentage for the page being left.',
      'trackFormComplete sets completedRef before onFormComplete, so abandon does not fire after a completed submit.',
      'The built-in reset path passes reason "reset" to trackFormReset.',
    ],
    snippet: {
      title: 'Page and submit tracking',
      language: 'ts',
      code: `function handlePageChange(context: { readonly fromPage: number; readonly toPage: number; readonly timeSpent: number }) {
  analytics.trackPageChange(context);
  config.onPageChange?.(context.toPage, context.toPage > context.fromPage ? 'next' : 'previous');
}

const form = useForm({
  defaultValues: config.formOptions.defaultValues,
  onSubmit: async ({ value }) => {
    analytics.trackFormComplete(value as TFormValues);
    await config.formOptions.onSubmit?.({ value, formApi: getFormApiContext(value as TFormValues) });
    clearStorage();
  },
});`,
    },
    references: [
      sourceReference('Source: page change timing', 'packages/formedible/src/hooks/use-multi-page.ts#L61-L70', 'fromPage, toPage, and timeSpent are created before currentPage changes.'),
      sourceReference('Source: page/form analytics', 'packages/formedible/src/hooks/use-form-analytics.ts#L126-L158', 'Form complete, page change, and reset tracking.'),
      sourceReference('Source: validation state', 'packages/formedible/src/hooks/use-formedible.tsx#L321-L337', 'Page validation state shape passed into onPageChange.'),
    ],
  },
  {
    title: 'Abandonment tracking',
    body: 'Abandonment runs in the analytics hook cleanup. It is skipped after trackFormComplete, so unmounting an incomplete form calls onFormAbandon when you provide it.',
    bullets: [
      'useFormedible calculates completionPercentage from completed fields divided by total fields.',
      'currentPage is always included; currentTab is included when tab state is active.',
      'lastActiveField comes from getAbandonContext or the focus tracker fallback.',
      'When no getAbandonContext is supplied, the analytics hook falls back to completionPercentage: 0.',
    ],
    snippet: {
      title: 'Abandon context built by useFormedible',
      language: 'ts',
      code: `function getAbandonContext(): FormAnalyticsAbandonContext {
  const completedFields = fields.filter((fieldConfig) =>
    isCompletedValue(getValueAtFieldPath(form.state.values, fieldConfig.name)),
  ).length;

  const context: FormAnalyticsAbandonContext = {
    completionPercentage: fields.length > 0 ? (completedFields / fields.length) * 100 : 0,
    currentPage: multiPage.currentPage,
  };

  return tabs.activeTab !== undefined ? { ...context, currentTab: tabs.activeTab } : context;
}`,
    },
    references: [
      sourceReference('Source: analytics cleanup', 'packages/formedible/src/hooks/use-form-analytics.ts#L77-L100', 'Cleanup path and context assembly for onFormAbandon.'),
      sourceReference('Source: abandon context', 'packages/formedible/src/hooks/use-formedible.tsx#L343-L355', 'Completion percentage, currentPage, and currentTab context.'),
      analyticsExample,
    ],
  },
  {
    title: 'Standalone factory',
    body: 'createFormAnalyticsTracker is exported from use-form-analytics.ts for code outside React. It takes the same analytics config plus an optional clock.',
    bullets: [
      'options.now defaults to Date.now.',
      'trackFieldChange and trackFieldError include a current timestamp from the configured clock.',
      'trackFieldComplete forwards isValid and timeSpent without React focus state.',
      'trackFormReset forwards an optional reason string.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('trackFieldChange', '(fieldName: Extract<keyof TFormValues, string> | string, value: unknown) => void', 'Returned', 'Calls onFieldChange with the current clock value.'),
        createPropertyRow('trackFieldComplete', '(fieldName: Extract<keyof TFormValues, string> | string, isValid: boolean, timeSpent: number) => void', 'Returned', 'Calls onFieldComplete without React focus state.'),
        createPropertyRow('trackFieldError', '(fieldName: Extract<keyof TFormValues, string> | string, errors: readonly string[]) => void', 'Returned', 'Calls onFieldError with the current clock value.'),
        createPropertyRow('trackFormReset', '(reason?: string) => void', 'Returned', 'Calls onFormReset with the current clock value and optional reason.'),
      ],
    },
    snippet: {
      title: 'Deterministic tracker outside React',
      language: 'ts',
      code: `const tracker = createFormAnalyticsTracker<LeadFormValues>(analytics, {
  now: () => 10_000,
});

tracker.trackFieldChange('email', 'ada@example.com');
tracker.trackFieldComplete('email', true, 350);
tracker.trackFieldError('email', ['Invalid email']);
tracker.trackFormReset('clear-button');`,
    },
    references: [
      sourceReference('Source: createFormAnalyticsTracker', 'packages/formedible/src/hooks/use-form-analytics.ts#L41-L61', 'Standalone factory and returned methods.'),
      sourceReference('Test: compatibility tracker', 'tests/formedible/basic-fields.test.tsx#L413-L436', 'Asserts restored callbacks from the standalone tracker.'),
      sourceReference('Test: analytics contract', 'tests/formedible/phase10-behavior.test.ts#L207-L234', 'Approved analytics options and useFormedible return contract.'),
    ],
  },
] satisfies readonly DocsGuideSection[];

export const Route = createFileRoute('/docs/analytics')({
  head: () => routeHead,
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  return (
    <DocsGuidePage
      eyebrow="Analytics"
      title="Track form behavior without coupling metrics to rendering."
      description="Analytics callbacks report start, field, page, completion, reset, and abandon events while your form stays a normal React component."
      sections={sections}
      related={relatedLinks}
    />
  );
}
