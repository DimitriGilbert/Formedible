import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { TextField } from '../../packages/formedible/src/components/formedible/fields/text-field';
import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import type { FormedibleFieldConfig, FormedibleFieldType, FormedibleFormValues } from '../../packages/formedible/src/lib/formedible/types';
import {
  checkoutCompatibilityExample,
  contactCompatibilityExample,
  jobApplicationCompatibilityExample,
  registrationCompatibilityExample,
} from '../compatibility-examples/core-examples';
import type { FieldDescriptor } from '../compatibility-examples/example-manifest';

const basicTypes = new Set(['text', 'email', 'password', 'url', 'tel', 'masked', 'textarea', 'number', 'select', 'checkbox', 'switch', 'radio']);

function toFormedibleFieldType(type: string): FormedibleFieldType {
  if (basicTypes.has(type)) {
    return type as FormedibleFieldType;
  }

  return 'text';
}

const primitiveImports = {
  'checkbox-field.tsx': "@/components/ui/checkbox",
  'number-field.tsx': "@/components/ui/input",
  'radio-field.tsx': "@/components/ui/radio-group",
  'select-field.tsx': "@/components/ui/select",
  'switch-field.tsx': "@/components/ui/switch",
  'text-field.tsx': "@/components/ui/input",
  'textarea-field.tsx': "@/components/ui/textarea",
} as const;

function sourcePath(fileName: string) {
  return join(process.cwd(), 'packages/formedible/src/components/formedible/fields', fileName);
}

function descriptorToFieldConfig(descriptor: FieldDescriptor): FormedibleFieldConfig<FormedibleFormValues> {
  return {
    name: descriptor.name,
    type: toFormedibleFieldType(descriptor.type),
    label: descriptor.name,
    options: descriptor.options,
    min: descriptor.config?.includes('min:0') ? 0 : undefined,
    step: descriptor.config?.includes('step:1000') ? 1000 : undefined,
  };
}

function defaultValueForField(field: FormedibleFieldConfig<FormedibleFormValues>) {
  if (field.type === 'checkbox' || field.type === 'switch') {
    return false;
  }

  if (field.type === 'number') {
    return 0;
  }

  if (field.type === 'radio' || field.type === 'select') {
    const firstOption = Array.isArray(field.options) ? field.options.at(0) : undefined;

    return typeof firstOption === 'string' ? firstOption : firstOption?.value ?? '';
  }

  return '';
}

function renderBasicExample(fields: readonly FieldDescriptor[]) {
  const basicFields = fields.filter((field) => basicTypes.has(field.type)).map(descriptorToFieldConfig);
  const defaultValues = Object.fromEntries(basicFields.map((field) => [field.name, defaultValueForField(field)]));

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: basicFields,
      formOptions: {
        defaultValues,
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  return renderToStaticMarkup(<ExampleForm />);
}

test('basic field components import shadcn primitives without raw substitutes', () => {
  for (const [fileName, importPath] of Object.entries(primitiveImports)) {
    const source = readFileSync(sourcePath(fileName), 'utf8');

    assert.match(source, new RegExp(importPath.replaceAll('/', '\\/')));
    assert.doesNotMatch(source, /<(input|textarea|select)\b/);
  }
});

test('field registry maps basic normalized types to dedicated components', () => {
  const source = readFileSync(sourcePath('field-registry.tsx'), 'utf8');

  for (const fieldType of basicTypes) {
    assert.match(source, new RegExp(`${fieldType}:`));
  }
});

test('contact basic fields render shadcn primitives', () => {
  const markup = renderBasicExample(contactCompatibilityExample.fields);

  assert.match(markup, /data-slot="input"/);
  assert.match(markup, /data-slot="textarea"/);
  assert.match(markup, /data-slot="checkbox"/);
});

test('registration basic fields render shadcn primitives', () => {
  const markup = renderBasicExample(registrationCompatibilityExample.fields);

  assert.match(markup, /data-slot="input"/);
  assert.match(markup, /data-slot="textarea"/);
  assert.match(markup, /data-slot="switch"/);
  assert.match(markup, /data-slot="radio-group"/);
});

test('checkout basic fields render shadcn primitives', () => {
  const markup = renderBasicExample(checkoutCompatibilityExample.fields);

  assert.match(markup, /data-slot="input"/);
  assert.match(markup, /data-slot="textarea"/);
  assert.match(markup, /data-slot="radio-group"/);
});

test('job application basic fields render shadcn primitives', () => {
  const markup = renderBasicExample(jobApplicationCompatibilityExample.fields);

  assert.match(markup, /data-slot="input"/);
  assert.match(markup, /type="number"/);
  assert.match(markup, /data-slot="textarea"/);
});

test('invalid fields expose field and control invalid states', () => {
  const markup = renderToStaticMarkup(
    <TextField
      fieldConfig={{ name: 'email', type: 'email', label: 'Email', disabled: false, required: true }}
      field={{ id: 'email', name: 'email', value: '', error: 'Email is required', onBlur: () => undefined, onChange: () => undefined }}
    />,
  );

  assert.match(markup, /data-invalid="true"/);
  assert.match(markup, /aria-invalid="true"/);
});
