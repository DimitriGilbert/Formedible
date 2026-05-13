import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { NumberField } from '../../packages/formedible/src/components/formedible/fields/number-field';
import { PasswordField } from '../../packages/formedible/src/components/formedible/fields/password-field';
import { TextField } from '../../packages/formedible/src/components/formedible/fields/text-field';
import { TextareaField } from '../../packages/formedible/src/components/formedible/fields/textarea-field';
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
  'password-field.tsx': "@/components/ui/input",
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

function renderTextarea(fieldConfig: FormedibleFieldConfig<FormedibleFormValues>, value = '') {
  return renderToStaticMarkup(
    <TextareaField
      fieldConfig={{ ...fieldConfig, type: 'textarea', disabled: false, required: false }}
      field={{ id: String(fieldConfig.name), name: String(fieldConfig.name), value, onBlur: () => undefined, onChange: () => undefined }}
    />,
  );
}

function renderPassword(fieldConfig: FormedibleFieldConfig<FormedibleFormValues>, value = '') {
  return renderToStaticMarkup(
    <PasswordField
      fieldConfig={{ ...fieldConfig, type: 'password', disabled: false, required: false }}
      field={{ id: String(fieldConfig.name), name: String(fieldConfig.name), value, onBlur: () => undefined, onChange: () => undefined }}
    />,
  );
}

function renderNumber(fieldConfig: FormedibleFieldConfig<FormedibleFormValues>, value: number | string = '') {
  return renderToStaticMarkup(
    <NumberField
      fieldConfig={{ ...fieldConfig, type: 'number', disabled: false, required: false }}
      field={{ id: String(fieldConfig.name), name: String(fieldConfig.name), value, onBlur: () => undefined, onChange: () => undefined }}
    />,
  );
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

test('textarea reads legacy textareaConfig rows and maxLength', () => {
  const markup = renderTextarea({
    name: 'message',
    type: 'textarea',
    label: 'Message',
    textareaConfig: { rows: 7, maxLength: 140 },
  });

  assert.match(markup, /rows="7"/);
  assert.match(markup, /maxLength="140"/);
});

test('textarea top-level rows and maxLength take precedence over legacy textareaConfig', () => {
  const markup = renderTextarea({
    name: 'message',
    type: 'textarea',
    label: 'Message',
    rows: 3,
    maxLength: 60,
    textareaConfig: { rows: 7, maxLength: 140 },
  });

  assert.match(markup, /rows="3"/);
  assert.match(markup, /maxLength="60"/);
});

test('textarea renders legacy textareaConfig word count', () => {
  const markup = renderTextarea(
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      textareaConfig: { showWordCount: true, maxLength: 140 },
    },
    'hello formedible world',
  );

  assert.match(markup, /3 words/);
  assert.match(markup, /140 characters max/);
});

test('textarea supports legacy textareaConfig cols and resize', () => {
  const markup = renderTextarea({
    name: 'message',
    type: 'textarea',
    label: 'Message',
    textareaConfig: { cols: 80, resize: 'vertical' },
  });

  assert.match(markup, /cols="80"/);
  assert.match(markup, /resize:vertical/);
});

test('password preserves basic password input behavior', () => {
  const markup = renderPassword({
    name: 'password',
    type: 'password',
    label: 'Password',
  });

  assert.match(markup, /type="password"/);
});

test('password renders legacy passwordConfig toggle control', () => {
  const markup = renderPassword({
    name: 'password',
    type: 'password',
    label: 'Password',
    passwordConfig: { showToggle: true },
  });

  assert.match(markup, /type="password"/);
  assert.match(markup, /aria-label="Show password"/);
});

test('password renders legacy passwordConfig strength meter with minStrength', () => {
  const markup = renderPassword(
    {
      name: 'password',
      type: 'password',
      label: 'Password',
      passwordConfig: { strengthMeter: true, minStrength: 3 },
    },
    'correct horse battery staple',
  );

  assert.match(markup, /Password strength/);
  assert.match(markup, /Minimum strength: 3\/4/);
});

test('number reads legacy numberConfig constraints', () => {
  const markup = renderNumber({
    name: 'quantity',
    type: 'number',
    label: 'Quantity',
    numberConfig: { min: 2, max: 8, step: 2 },
  });

  assert.match(markup, /min="2"/);
  assert.match(markup, /max="8"/);
  assert.match(markup, /step="2"/);
});

test('number top-level constraints take precedence over legacy numberConfig', () => {
  const markup = renderNumber({
    name: 'quantity',
    type: 'number',
    label: 'Quantity',
    min: 1,
    max: 10,
    step: 1,
    numberConfig: { min: 2, max: 8, step: 2 },
  });

  assert.match(markup, /min="1"/);
  assert.match(markup, /max="10"/);
  assert.match(markup, /step="1"/);
});

test('text renders legacy datalist suggestions', () => {
  const markup = renderToStaticMarkup(
    <TextField
      fieldConfig={{ name: 'city', type: 'text', label: 'City', disabled: false, required: false, datalist: ['Paris', { value: 'Berlin', label: 'Berlin, Germany' }] }}
      field={{ id: 'city', name: 'city', value: '', onBlur: () => undefined, onChange: () => undefined }}
    />,
  );

  assert.match(markup, /list="city-datalist"/);
  assert.match(markup, /<datalist id="city-datalist">/);
  assert.match(markup, /<option value="Paris"><\/option>/);
  assert.match(markup, /<option value="Berlin">Berlin, Germany<\/option>/);
});

test('number renders legacy datalist suggestions', () => {
  const markup = renderNumber({
    name: 'quantity',
    type: 'number',
    label: 'Quantity',
    datalist: ['1', '5'],
  });

  assert.match(markup, /list="quantity-datalist"/);
  assert.match(markup, /<datalist id="quantity-datalist">/);
  assert.match(markup, /<option value="5"><\/option>/);
});

test('field wrapper renders legacy help tooltip text as supplementary help', () => {
  const markup = renderToStaticMarkup(
    <TextField
      fieldConfig={{
        name: 'firstName',
        type: 'text',
        label: 'First name',
        description: 'Used on your profile.',
        disabled: false,
        required: false,
        help: { tooltip: 'We use this to personalize your experience.' },
      }}
      field={{ id: 'firstName', name: 'firstName', value: '', onBlur: () => undefined, onChange: () => undefined }}
    />,
  );

  assert.match(markup, /Used on your profile\./);
  assert.match(markup, /We use this to personalize your experience\./);
});
