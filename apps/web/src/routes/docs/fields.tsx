import { createFileRoute } from '@tanstack/react-router';

import { DocsGuidePage } from '@/components/docs/guide-page';
import { createRouteSeoHead } from '@/features/docs/seo';

const routeHead = createRouteSeoHead('/docs/fields');
const fieldTypes = [
  'text, email, password, url, tel, textarea, number',
  'select, radio, checkbox, switch, date, slider, rating',
  'phone, file, array, object, multiSelect, combobox, multiCombobox',
  'color, colorPicker, duration, location, masked, maskedInput',
] as const;

export const Route = createFileRoute('/docs/fields')({
  head: () => routeHead,
  component: FieldsRoute,
});

function FieldsRoute() {
  return (
    <DocsGuidePage
      eyebrow="Field model"
      title="Configure fields once and reuse them everywhere."
      description="Every manual form, builder form, AI-generated form, and parser result targets the same field configuration model."
      codeExampleIds={['field-registry-extension']}
      aside={(
        <div className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
          {fieldTypes.map((group) => (
            <p key={group} className="rounded-2xl bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
              {group}
            </p>
          ))}
        </div>
      )}
      sections={[
        {
          title: 'Common field keys',
          body: 'A field needs a name and usually a type and label. It can also declare description, required, disabled, section, page, tab, conditional, options, validation, and field-specific config objects.',
          bullets: ['Use options arrays for select-like fields.', 'Use option functions for dependent fields.', 'Use field-specific config for sliders, rating, phone, dates, files, location, and duration.'],
        },
        {
          title: 'Arrays and objects',
          body: 'Array fields can render scalar items or nested object cards. Object fields and array objectConfig fields share the same field model, so nested forms stay inspectable.',
          bullets: ['Set minItems and maxItems for boundaries.', 'Provide defaultValue for repeatable item creation.', 'Use objectConfig.fields for nested object inputs.'],
        },
      ]}
    />
  );
}
