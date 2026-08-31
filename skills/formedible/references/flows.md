# Flows reference — pages, tabs, persistence, analytics, form surface

All options live on the `useFormedible` config object (`UseFormedibleOptions<TValues>`). Import paths assume the installed copy.

## Multi-page forms

Pages come from `field.page` (fields without `page` land on page 1). `pages` adds titles/descriptions/conditions. The hook returns navigation and progress helpers.

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

type Values = { firstName: string; email: string; plan: string };

export function RegistrationFlow() {
  const {
    Form, currentPage, totalPages, visiblePages,
    goToNextPage, goToPreviousPage, setCurrentPage,
    isFirstPage, isLastPage, progressValue,
  } = useFormedible<Values>({
    fields: [
      { name: 'firstName', type: 'text', label: 'First name', page: 1, required: true },
      { name: 'email', type: 'email', label: 'Email', page: 2, required: true },
      { name: 'plan', type: 'radio', label: 'Plan', page: 3, options: ['basic', 'pro'], required: true },
    ],
    pages: [
      { page: 1, title: 'Personal Information', description: 'Tell us about yourself' },
      { page: 2, title: 'Contact Details', description: 'How can we reach you {{firstName}}?' },
      { page: 3, title: 'Preferences' },
    ],
    progress: { showSteps: true, showPercentage: true },
    previousLabel: 'Back',
    nextLabel: 'Continue',
    submitLabel: 'Create account',
    onPageChange: (page, direction) => console.log('moved', direction, 'to', page),
    formOptions: { defaultValues: { firstName: '', email: '', plan: 'basic' } },
  });

  // currentPage: 1 | totalPages: visible page count | visiblePages: sorted visible numbers
  // isFirstPage / isLastPage index into visiblePages | progressValue: 0-100 (100 when single page)
  return <Form formClassName="max-w-2xl" />;
}
```

Navigation renders automatically (Previous / Next / Submit on the last page). `setCurrentPage` sets the page directly; invalid pages are repaired. `buttonClassName` styles the nav buttons, `submitButtonClassName` the submit button.

## Conditional UI — fields, pages, tabs

One shape everywhere: a string names a field path and checks truthiness; a function receives current values.

```ts
fields: [
  { name: 'applicationType', type: 'radio', page: 1, options: ['individual', 'business'] },
  { name: 'firstName', type: 'text', page: 2, conditional: (values) => values.applicationType === 'individual' },
  { name: 'companyName', type: 'text', page: 3, conditional: 'hasCompanyAccount' },
],
pages: [
  { page: 2, title: 'Personal Information', conditional: (values) => values.applicationType === 'individual' },
  { page: 3, title: 'Business Information', conditional: 'hasCompanyAccount' },
],
tabs: [{ id: 'pro', label: 'Pro', conditional: (values) => values.plan === 'pro' }],
```

Pages/tabs whose fields are all hidden disappear; empty page sets fall back to `[1]`. Hidden fields do not block submit — their schema errors are filtered out.

## Tabbed forms

Tabs group by `field.tab`. `tabs` entries are `{ id, label, description?, conditional? }` or plain strings (auto-labeled). Omit `tabs` and Formedible infers them from field `tab` values. When visible tabs exist, tab filtering replaces page filtering — but page navigation buttons still render if pages are also configured (they change `currentPage` without changing visible fields), so configure one, not both.

```ts
useFormedible<Values>({
  fields: [
    { name: 'firstName', type: 'text', label: 'First name', tab: 'personal' },
    { name: 'theme', type: 'select', label: 'Theme', tab: 'preferences', options: ['light', 'dark', 'auto'] },
    { name: 'privacy', type: 'radio', label: 'Privacy', tab: 'settings', options: ['public', 'private'] },
  ],
  tabs: [
    { id: 'personal', label: 'Personal' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'settings', label: 'Settings' },
  ],
  formOptions: { defaultValues: { firstName: '', theme: 'auto', privacy: 'private' } },
});
```

## Dynamic text — `{{token}}` interpolation

Works in field `label`, `description`, `placeholder`, `help` (plain string, `help.text`, `help.tooltip`), `section` (title/description), page `title`/`description`, and tab `label`/`description`. Tokens are word/dot/bracket paths; `{{ firstName }}` and `{{firstName}}` are equivalent; missing values render as empty string; non-string ReactNodes pass through unchanged.

```ts
fields: [
  { name: 'name', type: 'text', label: 'Your name', page: 1 },
  { name: 'destination', type: 'radio', label: 'Where are you going, {{name}}?', page: 2, options: ['beach', 'mountains'] },
  { name: 'startDate', type: 'date', label: 'Start date for {{destination}}', page: 3 },
],
pages: [
  { page: 2, title: 'Destination', description: 'Hi {{name}}! Pick a spot.' },
  { page: 3, title: 'Trip Start Date', description: 'When does your adventure to the {{destination}} begin?' },
],
```

Standalone use: `resolveDynamicText('Hello {{firstName}}', values)` from `@/components/ui/formedible/lib/dynamic-text`.

## Persistence / autosave

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';

type Values = { name: string; email: string; agreeToTerms: boolean };

export function InquiryForm() {
  const { Form, saveToStorage, loadFromStorage, clearStorage } = useFormedible<Values>({
    fields: [
      { name: 'name', type: 'text', label: 'Name', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'agreeToTerms', type: 'checkbox', label: 'I agree to the terms', required: true },
    ],
    persistence: {
      key: 'demo-project-inquiry-form',   // required; include a version when field names change
      storage: 'localStorage',            // 'localStorage' | 'sessionStorage'; default sessionStorage; SSR-safe
      debounceMs: 1500,                   // default 500; value changes schedule a debounced save
      exclude: ['agreeToTerms'],          // top-level keys stripped before every write
      restoreOnMount: true,               // loads the draft (values + saved page) on mount
    },
    formOptions: { defaultValues: { name: '', email: '', agreeToTerms: false } },
  });

  async function restoreDraft() {
    const payload = await loadFromStorage();   // returns PersistedFormPayload | undefined

    if (payload) {
      console.log('restored from', new Date(payload.timestamp).toLocaleString());
    }
  }

  return (
    <div>
      <Form />
      <div className="flex gap-2">
        <button type="button" onClick={saveToStorage}>Save draft</button>
        <button type="button" onClick={() => void restoreDraft()}>Restore draft</button>
        <button type="button" onClick={clearStorage}>Clear draft</button>
      </div>
    </div>
  );
}
```

Stored payload: `{ values: Partial<TValues>, timestamp: number, currentPage?: number }`, JSON-stringified under `key`. Malformed payloads parse to `undefined`. A successful submit clears the storage key.

## Analytics

Pass callbacks under `analytics`. Emitted events (positional args):

| Callback | Signature |
| --- | --- |
| `onFormStart` | `(timestamp)` — once on mount |
| `onFieldFocus` | `(fieldName, timestamp)` |
| `onFieldBlur` | `(fieldName, timeSpent)` — focus-derived; 0 without a stored focus |
| `onFieldChange` | `(fieldName, value, timestamp)` |
| `onFieldComplete` | `(fieldName, isValid, timeSpent)` — on blur |
| `onFieldError` | `(fieldName, errors, timestamp)` — on blur with formatted errors |
| `onPageChange` | `(fromPage, toPage, timeSpent, pageValidationState?)` where the state is `{ hasErrors, completionPercentage }` for the page being left |
| `onTabChange` | `(fromTab, toTab, timeSpent, tabCompletionState?)` |
| `onTabFirstVisit` | `(tabId, timestamp)` — first activation, including the initial tab |
| `onFormComplete` | `(timeSpent, formData)` — after the consumer `onSubmit` resolves |
| `onFormAbandon` | `(completionPercentage, context?)` with `context = { currentPage?, currentTab?, lastActiveField? }` — on unmount before completion |
| `onFormReset` | `(timestamp, reason?)` — reason `'reset'` from the rendered reset path |
| `onSubmissionPerformance` | `(submissionTime, validationTime, processingTime)` — after a successful submit; validationTime is always 0 |

Typed as `never` (never emitted): `onPageComplete`, `onPageAbandon`, `onPageValidationError`, `onTabComplete`, `onTabAbandon`, `onTabValidationError`, `onRenderPerformance`, `onValidationPerformance`.

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';
import type { FormedibleAnalyticsConfig } from '@/components/ui/formedible/lib/types';

const analytics = {
  onFormStart: (timestamp) => track('form-start', { timestamp }),
  onFieldChange: (fieldName, value, timestamp) => track('field-change', { fieldName, value, timestamp }),
  onPageChange: (fromPage, toPage, timeSpent, pageValidationState) => {
    track('page-change', { fromPage, toPage, timeSpent, pageValidationState });
  },
  onFormComplete: (timeSpent, formData) => track('form-complete', { timeSpent, formData }),
  onFormAbandon: (completionPercentage, context) => track('form-abandon', { completionPercentage, context }),
} satisfies FormedibleAnalyticsConfig<Values>;
```

Outside React: `createFormAnalyticsTracker<Values>(analytics, { now: () => 10_000 })` from `@/components/ui/formedible/hooks/use-form-analytics` returns `trackFieldChange`, `trackFieldComplete`, `trackFieldError`, `trackFormReset` with a deterministic clock.

## Auto-submit

```ts
useFormedible<PreferencesValues>({
  fields,
  autoSubmitOnChange: true,      // change -> debounced form.handleSubmit()
  autoSubmitDebounceMs: 500,     // default 300
  showSubmitButton: false,
  formOptions: { defaultValues, onSubmit: async ({ value }) => savePreferences(value) },
});
```

## Form surface

The returned `Form` accepts native form props plus:

- `className` → the native `<form>` element; `formClassName` (hook option) → the internal layout.
- Hook-level `fieldClassName` / `labelClassName` append to every field's `className` (wrapper) / `labelClassName` (label), merged per field via tailwind-merge with that field's own classes.
- `noValidate` defaults to true.
- `aria-busy` is set while the `loading` option is true; `disabled` or `loading` disables every control (fieldset) and forces fields disabled.
- Native event props (`onBlur`, `onFocus`, `onInput`, `onInvalid`, `onKeyDown`, `onKeyUp`, `onReset`) run first, then the matching hook option (`onFormBlur`, `onFormFocus`, `onFormInput`, `onFormInvalid`, `onFormKeyDown`, `onFormKeyUp`, `onFormReset`) with `(event, formApi)`.
- Native `onSubmit` is intercepted and ignored — submit work goes in `formOptions.onSubmit`. `onReset` resets the form, then calls `formOptions.onReset` and the `onFormReset` option.
- `showSubmitButton: false` hides the submit control entirely (for auto-submit or custom buttons driving `form.handleSubmit()`).

```tsx
<Form
  id="contact-form"
  name="contact"
  className="rounded-xl border p-6"
  aria-label="Contact form"
  data-testid="contact-form"
  onInput={(event) => logNativeInput(event.currentTarget.name)}
/>
```

## Submit lifecycle (source order)

1. TanStack validates; on failure `formOptions.onSubmitInvalid` fires and the summary/auto-navigation kicks in.
2. Your `formOptions.onSubmit({ value, formApi })` runs — a thrown error is logged (`console.error`) and skips steps 3-4; the draft stays in storage.
3. `onFormComplete` and `onSubmissionPerformance` analytics fire.
4. Unless `resetOnSubmitSuccess: false`, the form resets to defaults and the persistence key is cleared.

`formApi` in event contexts is `{ state: { values }, handleSubmit }`.
