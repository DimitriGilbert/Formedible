import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/validation');

export const Route = createFileRoute('/docs/validation')({
  head: () => routeHead,
  component: ValidationRoute,
});

function ValidationRoute() {
  return (
    <DocsGuidePage
      eyebrow="Validation"
      title="Validate where the rule belongs, then let TanStack Form render the errors."
      description="Formedible checks simple field constraints first, then your field rules, then schema and cross-field rules. Keep each rule near the data it protects."
      codeExampleIds={['typed-hook-usage']}
      related={[
        {
          title: 'API',
          description: 'See where schema, asyncValidation, and crossFieldValidation live on UseFormedibleOptions.',
          href: '/docs/api',
        },
        {
          title: 'Fields',
          description: 'Field config keys include required, min, max, maxLength, validation, and inlineValidation.',
          href: '/docs/fields',
        },
        {
          title: 'Getting Started',
          description: 'Start from typed values and matching field names before adding validation rules.',
          href: '/docs/getting-started',
        },
        {
          title: 'Dynamic Survey Form',
          description: 'Try conditional questions and field validation in the live examples page.',
          href: '/docs/examples?example=survey',
        },
        {
          title: 'Job Application Form',
          description: 'Try schema, multi-page, and application validation in the live examples page.',
          href: '/docs/examples?example=job',
        },
      ]}
      sections={[
        {
          title: 'Validation overview',
          body: 'A field can be checked at three levels: built-in constraints, field-level rules, and form-level rules. On change, blur, and submit, Formedible runs built-ins, then the field validation prop, then the form schema, then cross-field validation. The first message for a field is shown.',
          bullets: [
            'Built-ins catch obvious input issues without extra setup.',
            'Field-level rules handle one field with access to current values.',
            'Form-level schema and cross-field rules keep the full data shape honest.',
          ],
        },
        {
          title: 'Built-in constraints',
          body: 'The common checks come from field config. Set required, choose email or url as the type, add maxLength for strings, or min and max for numbers. Formedible wires those checks automatically; there is no separate validator object to maintain.',
          bullets: [
            'required rejects empty strings, nullish values, and empty arrays.',
            'email and url types get format checks after the field has a value.',
            'maxLength, min, and max use the same field config you already render from.',
          ],
        },
        {
          title: 'Form-level schema',
          body: 'Pass a Standard Schema v1 compatible schema with the schema prop on UseFormedibleOptions. Zod, Valibot, and ArkType can all expose the standard interface, and Formedible maps schema issues back to fields with matching names.',
          bullets: [
            'Keep schema keys and field names in sync.',
            'Set formOptions.defaultValues to the same shape the schema expects.',
            'Use schema rules for the submitted data contract, not one-off UI hints.',
          ],
        },
        {
          title: 'Field-level validation',
          body: 'Use the validation prop on a FormedibleFieldConfig when one field has a product rule. A function receives (value, values, context) and returns string | null | false. Return a string for a custom error, null when the value passes, or false to fail with the default invalid-value message.',
          bullets: [
            'The context includes value, values, and fieldName.',
            'You can also pass a Standard Schema field schema or an object with validator and message.',
            'Put field-specific copy here so schema errors can stay plain and data-focused.',
          ],
        },
        {
          title: 'Async validation',
          body: 'Use asyncValidation on UseFormedibleOptions for checks that may hit a service, such as a username or invite-code lookup. Each field entry gets a validator(value, values, signal), optional debounceMs, and optional loadingMessage.',
          bullets: [
            'Honor AbortSignal inside fetch calls so stale checks can stop cleanly.',
            'Use debounceMs to avoid firing a request on every keystroke.',
            'Return a string when the remote check fails, null when it passes, or false to fail with the fallback Invalid value message.',
          ],
        },
        {
          title: 'Cross-field validation',
          body: 'Use crossFieldValidation when a rule depends on more than one value. Each FormedibleCrossFieldValidation item lists the fields it watches and a validator(values) function. When the function returns a message, Formedible applies it to each named field.',
          bullets: [
            'List every field that should re-check when a related value changes.',
            'Use this for date ranges, password confirmation, dependent totals, and mutually exclusive choices.',
            'Keep the validator deterministic so the same values always produce the same result.',
          ],
        },
        {
          title: 'Inline validation',
          body: 'Use inlineValidation on a field when you want real-time feedback beside that field. Enable it, optionally set debounceMs, and add a validator(value, values, signal) if the inline rule differs from the field validation prop. showSuccess can render positive feedback after the value passes.',
          bullets: [
            'Inline validation runs on change and can share the async validation debounce.',
            'showSuccess is useful for availability checks and format guidance, not every text input.',
            'Keep success and loading messages short so the form does not jump while users type.',
          ],
        },
      ]}
    />
  );
}
