import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import type { DocsGuideLink, DocsGuideSection } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/analytics');
const propertyTableHeaders = ['Property', 'Type', 'Default', 'Description'] as const;

function createPropertyRow(name: string, type: string, defaultValue: string, description: string) {
  return { cells: [name, type, defaultValue, description] };
}

const relatedLinks = [
  { title: 'API', description: 'Hook options, return values, form props, labels, persistence, and analytics in one reference.', href: '/docs/api' },
  { title: 'Analytics & Tracking Form', description: 'Open the live form that reports start, field, page, completion, and abandon callbacks.', href: '/docs/examples?example=analytics' },
] satisfies readonly DocsGuideLink[];

const sections = [
  {
    title: 'Configuration',
    body: 'Pass analytics to useFormedible as a FormedibleAnalyticsConfig<TFormValues>. Keep the object stable with useMemo when it lives in a component, and keep each handler small so telemetry work never blocks typing.',
    bullets: [
      'Field names use keys from TFormValues, with string support for generated or nested field paths.',
      'Timestamps are Date.now values in milliseconds.',
      'Superseded page, tab, and performance callbacks are typed as never and are not emitted by the current runtime.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('onFormStart', '(timestamp: number) => void', 'undefined', 'Runs once from the analytics hook mount effect, using the form start timestamp.'),
        createPropertyRow('onFieldFocus', '(fieldName: Extract<keyof TFormValues, string> | string, timestamp: number) => void', 'undefined', 'Runs when a field receives focus.'),
        createPropertyRow('onFieldBlur', '(fieldName: Extract<keyof TFormValues, string> | string, timeSpent: number) => void', 'undefined', 'Runs on blur with elapsed focus time for that field.'),
        createPropertyRow('onFieldChange', '(fieldName: Extract<keyof TFormValues, string> | string, value: unknown, timestamp: number) => void', 'undefined', 'Runs after a field change with the new field value.'),
        createPropertyRow('onFieldComplete', '(fieldName: Extract<keyof TFormValues, string> | string, isValid: boolean, timeSpent: number) => void', 'undefined', 'Runs after blur with the latest validity flag and elapsed focus time.'),
        createPropertyRow('onFieldError', '(fieldName: Extract<keyof TFormValues, string> | string, errors: readonly string[], timestamp: number) => void', 'undefined', 'Runs when blur receives field errors, or when the standalone tracker records errors.'),
        createPropertyRow('onPageChange', '(fromPage: number, toPage: number, timeSpent: number, pageValidationState?: { readonly hasErrors: boolean; readonly completionPercentage: number }) => void', 'undefined', 'Runs after page movement with timing and validation state for the page being left.'),
        createPropertyRow('onFormComplete', '(timeSpent: number, formData: TFormValues) => void', 'undefined', 'Runs after a successful form submit is tracked.'),
        createPropertyRow('onFormAbandon', '(completionPercentage: number, context?: { readonly currentPage?: number; readonly currentTab?: string; readonly lastActiveField?: string }) => void', 'undefined', 'Runs from cleanup if the form unmounts before completion.'),
        createPropertyRow('onFormReset', '(timestamp: number, reason?: string) => void', 'undefined', 'Runs when reset tracking is called. The built-in reset path passes the reset reason when supplied.'),
      ],
    },
  },
  {
    title: 'Field events',
    body: 'Field callbacks follow the input interaction: focus starts timing, change reports the latest value, and blur closes the field session. Completion and error callbacks are also tied to blur, so they describe the state after the user leaves the field.',
    bullets: [
      'onFieldFocus receives fieldName and timestamp as soon as focus is tracked.',
      'onFieldChange receives fieldName, value, and timestamp after the value changes.',
      'onFieldBlur receives fieldName and timeSpent; onFieldComplete follows with isValid and the same elapsed time.',
      'onFieldError receives a readonly string list only when the blur path has errors to report.',
    ],
  },
  {
    title: 'Page and form events',
    body: 'Page analytics measure the step the user is leaving, not just the step they land on. Form callbacks cover the full session: start on mount, complete on submit tracking, and reset on the explicit reset path.',
    bullets: [
      'onPageChange receives fromPage, toPage, timeSpent, and optional validationState for fromPage.',
      'validationState contains hasErrors and completionPercentage for the page being left.',
      'onFormStart is emitted from mount with the saved start timestamp.',
      'onFormComplete receives total timeSpent and the submitted TFormValues payload.',
      'onFormReset receives a timestamp plus an optional reason string.',
    ],
  },
  {
    title: 'Abandonment tracking',
    body: 'Abandonment is automatic. If the analytics hook cleans up before trackFormComplete runs, Formedible calls onFormAbandon with the latest progress and location context it can collect.',
    bullets: [
      'completionPercentage comes from getAbandonContext when the renderer supplies one; otherwise it falls back to 0.',
      'context can include currentPage, currentTab, and lastActiveField.',
      'lastActiveField is updated on focus and can be supplied directly by the runtime context.',
      'A completed form does not emit abandon during cleanup.',
    ],
  },
  {
    title: 'Standalone factory',
    body: 'Use createFormAnalyticsTracker outside React when a parser, builder, or server-adjacent workflow needs the same callback contract. It accepts the analytics config and an optional clock, then returns small track* methods.',
    bullets: [
      'Signature: createFormAnalyticsTracker<TFormValues extends FormedibleFormValues>(analytics, options).',
      'options.now lets tests or offline tools provide a deterministic timestamp source.',
      'Returned methods cover field change, field completion, field error, and form reset tracking.',
    ],
    table: {
      headers: propertyTableHeaders,
      rows: [
        createPropertyRow('trackFieldChange', '(fieldName: Extract<keyof TFormValues, string> | string, value: unknown) => void', 'Returned', 'Calls onFieldChange with the current clock value.'),
        createPropertyRow('trackFieldComplete', '(fieldName: Extract<keyof TFormValues, string> | string, isValid: boolean, timeSpent: number) => void', 'Returned', 'Calls onFieldComplete without needing React focus state.'),
        createPropertyRow('trackFieldError', '(fieldName: Extract<keyof TFormValues, string> | string, errors: readonly string[]) => void', 'Returned', 'Calls onFieldError with the current clock value.'),
        createPropertyRow('trackFormReset', '(reason?: string) => void', 'Returned', 'Calls onFormReset with the current clock value and optional reason.'),
      ],
    },
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
      title="Track form behavior without tying metrics to rendering."
      description="Analytics callbacks report start, field, page, completion, reset, and abandon events while the form stays a normal React component."
      sections={sections}
      related={relatedLinks}
    />
  );
}
