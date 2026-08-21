import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import type { FocusEvent, FormEvent, InputEvent, KeyboardEvent, ReactElement } from 'react';

import { NumberField } from '../../packages/formedible/src/components/formedible/fields/number-field';
import { PasswordField } from '../../packages/formedible/src/components/formedible/fields/password-field';
import { TextField } from '../../packages/formedible/src/components/formedible/fields/text-field';
import { TextareaField } from '../../packages/formedible/src/components/formedible/fields/textarea-field';
import { createFormAnalyticsTracker } from '../../packages/formedible/src/hooks/use-form-analytics';
import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import type { FormProps } from '../../packages/formedible/src/components/formedible/form';
import type {
  FormedibleFieldComponent,
  FormedibleFieldComponentProps,
  FormedibleFieldConfig,
  FormedibleFieldController,
  FormedibleFieldType,
  FormedibleFieldWrapper,
  FormedibleFieldWrapperProps,
  FormedibleFormValues,
} from '../../packages/formedible/src/lib/formedible/types';
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

function renderFormOptionsExample(config: {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly showSubmitButton?: boolean;
}) {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'email', label: 'Email' }],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
      ...config,
    });

    return <Form />;
  }

  return renderToStaticMarkup(<ExampleForm />);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createFormEvent(type: string) {
  return {
    type,
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  } as FormEvent<HTMLFormElement>;
}

function createInputFormEvent(type: string) {
  return createFormEvent(type) as InputEvent<HTMLFormElement>;
}

function createKeyboardFormEvent(type: string, key: string) {
  return {
    ...createFormEvent(type),
    key,
  } as KeyboardEvent<HTMLFormElement>;
}

function createFocusFormEvent(type: string) {
  return createFormEvent(type) as FocusEvent<HTMLFormElement>;
}

function renderClient(element: ReactElement) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
  const rootElement = dom.window.document.getElementById('root');

  assert.ok(rootElement);

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousElement = globalThis.Element;
  const previousNode = globalThis.Node;
  const previousEvent = globalThis.Event;
  const actGlobal = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
  const previousActEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT;
  const elementPrototype = dom.window.HTMLElement.prototype as HTMLElement & {
    attachEvent?: () => void;
    detachEvent?: () => void;
  };

  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;
  globalThis.Event = dom.window.Event;
  actGlobal.IS_REACT_ACT_ENVIRONMENT = true;
  elementPrototype.attachEvent = () => undefined;
  elementPrototype.detachEvent = () => undefined;

  const root = createRoot(rootElement);
  act(() => {
    root.render(element);
  });

  return {
    document: dom.window.document,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
      globalThis.HTMLElement = previousHTMLElement;
      globalThis.Element = previousElement;
      globalThis.Node = previousNode;
      globalThis.Event = previousEvent;
      actGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      dom.window.close();
    },
  };
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

test('form options compatibility restores disabled, loading, and showSubmitButton behavior', () => {
  const disabledMarkup = renderFormOptionsExample({ disabled: true });
  const loadingMarkup = renderFormOptionsExample({ loading: true });
  const hiddenSubmitMarkup = renderFormOptionsExample({ showSubmitButton: false });

  assert.match(disabledMarkup, /<fieldset disabled=""/);
  assert.match(disabledMarkup, /<button[^>]*disabled=""[^>]*>Submit<\/button>/);
  assert.match(loadingMarkup, /aria-busy="true"/);
  assert.match(loadingMarkup, /<button[^>]*disabled=""[^>]*>Submit<\/button>/);
  assert.doesNotMatch(hiddenSubmitMarkup, />Submit<\/button>/);
});

test('multipage navigation respects disabled, loading, and hidden submit states', () => {
  function renderMultiPageFormOptionsExample(config: {
    readonly disabled?: boolean;
    readonly loading?: boolean;
    readonly showSubmitButton?: boolean;
    readonly startOnLastPage?: boolean;
  }) {
    function ExampleForm() {
      const { Form } = useFormedible<FormedibleFormValues>({
        fields: [
          { name: 'firstName', type: 'text', label: 'First name', page: 1, conditional: () => config.startOnLastPage !== true },
          { name: 'email', type: 'email', label: 'Email', page: 2 },
        ],
        formOptions: {
          defaultValues: { firstName: '', email: '' },
          onSubmit: () => undefined,
        },
        ...config,
      });

      return <Form />;
    }

    return renderToStaticMarkup(<ExampleForm />);
  }

  const disabledFirstPageMarkup = renderMultiPageFormOptionsExample({ disabled: true });
  const loadingFirstPageMarkup = renderMultiPageFormOptionsExample({ loading: true });
  const disabledLastPageMarkup = renderMultiPageFormOptionsExample({ disabled: true, startOnLastPage: true });
  const loadingLastPageMarkup = renderMultiPageFormOptionsExample({ loading: true, startOnLastPage: true });
  const hiddenSubmitLastPageMarkup = renderMultiPageFormOptionsExample({ showSubmitButton: false, startOnLastPage: true });

  assert.match(disabledFirstPageMarkup, /<button[^>]*disabled=""[^>]*>Previous<\/button>/);
  assert.match(disabledFirstPageMarkup, /<button[^>]*disabled=""[^>]*>Next<\/button>/);
  assert.match(loadingFirstPageMarkup, /<button[^>]*disabled=""[^>]*>Previous<\/button>/);
  assert.match(loadingFirstPageMarkup, /<button[^>]*disabled=""[^>]*>Next<\/button>/);
  assert.match(disabledLastPageMarkup, /<button[^>]*disabled=""[^>]*>Submit<\/button>/);
  assert.match(loadingLastPageMarkup, /<button[^>]*disabled=""[^>]*>Submit<\/button>/);
  assert.doesNotMatch(hiddenSubmitLastPageMarkup, />Submit<\/button>/);
});

test('multipage invalid submit shows hidden errors and navigates to the first invalid page', async () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', required: true, page: 1 },
        { name: 'email', type: 'email', label: 'Email', required: true, page: 2 },
      ],
      pages: [
        { page: 1, title: 'Personal' },
        { page: 2, title: 'Contact' },
      ],
      progress: { showSteps: true },
      formOptions: {
        defaultValues: { firstName: '', email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const nextButton = [...rendered.document.querySelectorAll('button')].find((button) => button.textContent === 'Next');
  assert.ok(nextButton);
  act(() => {
    nextButton.click();
  });
  await act(async () => {
    await wait(0);
  });
  assert.match(rendered.document.body.textContent ?? '', /Contact/);

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  const bodyText = rendered.document.body.textContent ?? '';

  assert.match(bodyText, /Please fix 2 invalid fields/);
  assert.match(bodyText, /First name on Personal: First name is required/);
  assert.match(bodyText, /Email on Contact: Email is required/);
  assert.match(bodyText, /Personal/);
  assert.ok(rendered.document.querySelector('input[name="firstName"]'));
  rendered.unmount();
});

test('tabbed invalid submit shows tab badges and navigates to the invalid tab', async () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', required: true, tab: 'personal' },
        { name: 'email', type: 'email', label: 'Email', required: true, tab: 'contact' },
      ],
      tabs: [
        { id: 'personal', label: 'Personal' },
        { id: 'contact', label: 'Contact' },
      ],
      formOptions: {
        defaultValues: { firstName: 'Ada', email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  const contactTab = [...rendered.document.querySelectorAll('[role="tab"]')].find((tab) => tab.textContent?.includes('Contact'));
  const bodyText = rendered.document.body.textContent ?? '';

  assert.match(bodyText, /Please fix 1 invalid field/);
  assert.match(bodyText, /Email on Contact: Email is required/);
  assert.ok(contactTab);
  assert.equal(contactTab.getAttribute('aria-selected'), 'true');
  assert.match(contactTab.textContent ?? '', /1/);
  assert.ok(rendered.document.querySelector('input[name="email"]'));
  rendered.unmount();
});

test('analytics compatibility tracker fires restored callbacks with expected arguments', () => {
  const calls: string[] = [];
  const tracker = createFormAnalyticsTracker<FormedibleFormValues>(
    {
      onFieldChange: (fieldName, value, timestamp) => calls.push(`change:${fieldName}:${String(value)}:${timestamp}`),
      onFieldComplete: (fieldName, isValid, timeSpent) => calls.push(`complete:${fieldName}:${String(isValid)}:${timeSpent}`),
      onFieldError: (fieldName, errors, timestamp) => calls.push(`error:${fieldName}:${errors.join('|')}:${timestamp}`),
      onFormReset: (timestamp, reason) => calls.push(`reset:${reason ?? 'none'}:${timestamp}`),
    },
    { now: () => 1000 },
  );

  tracker.trackFieldChange('email', 'ada@example.com');
  tracker.trackFieldComplete('email', true, 45);
  tracker.trackFieldError('email', ['Invalid email']);
  tracker.trackFormReset('user');

  assert.deepEqual(calls, [
    'change:email:ada@example.com:1000',
    'complete:email:true:45',
    'error:email:Invalid email:1000',
    'reset:user:1000',
  ]);
});

test('useFormedible fires restored analytics callbacks through field and form runtime flows', async () => {
  const calls: string[] = [];
  let capturedField: FormedibleFieldController | undefined;

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          component: ({ field }) => {
            capturedField = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} onBlur={field.onBlur} onFocus={field.onFocus} readOnly />;
          },
        },
      ],
      analytics: {
        onFormStart: () => calls.push('form-start'),
        onFieldFocus: (fieldName) => calls.push(`field-focus:${fieldName}`),
        onFieldBlur: (fieldName) => calls.push(`field-blur:${fieldName}`),
        onFieldChange: (fieldName, value) => calls.push(`field-change:${fieldName}:${String(value)}`),
        onFieldComplete: (fieldName, isValid) => calls.push(`field-complete:${fieldName}:${String(isValid)}`),
        onFieldError: (fieldName, errors) => calls.push(`field-error:${fieldName}:${errors.join('|')}`),
        onFormComplete: (_timeSpent, formData) => calls.push(`form-complete:${String(formData.email)}`),
        onFormReset: (_timestamp, reason) => calls.push(`form-reset:${reason ?? 'none'}`),
      },
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const field = capturedField;
  assert.ok(field);
  act(() => {
    field.onFocus?.();
    field.onBlur();
  });
  await act(async () => {
    await wait(0);
  });
  act(() => {
    field.onFocus?.();
    field.onChange('ada@example.com');
    field.onBlur();
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });
  const defaultView = rendered.document.defaultView;
  assert.ok(defaultView);
  act(() => {
    rendered.document.querySelector('form')?.dispatchEvent(new defaultView.Event('reset', { bubbles: true, cancelable: true }));
  });
  rendered.unmount();

  assert.ok(calls.includes('form-start'));
  assert.ok(calls.includes('field-focus:email'));
  assert.ok(calls.includes('field-error:email:Email is required'));
  assert.ok(calls.includes('field-complete:email:false'));
  assert.ok(calls.includes('field-change:email:ada@example.com'));
  assert.ok(calls.includes('field-blur:email'));
  assert.ok(calls.includes('field-complete:email:true'));
  assert.ok(calls.includes('form-complete:ada@example.com'));
  assert.ok(calls.includes('form-reset:reset'));
});

test('useFormedible validates required fields when their value changes before blur', async () => {
  let capturedField: FormedibleFieldController | undefined;

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          component: ({ field }) => {
            capturedField = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />;
          },
        },
      ],
      formOptions: {
        defaultValues: { email: 'ada@example.com' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const field = capturedField;
  assert.ok(field);

  act(() => {
    field.onChange('');
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(capturedField?.error, 'Email is required');
  rendered.unmount();
});

test('useFormedible clears blur-created required errors when value changes', async () => {
  let capturedField: FormedibleFieldController | undefined;

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          component: ({ field }) => {
            capturedField = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} onBlur={field.onBlur} readOnly />;
          },
        },
      ],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const field = capturedField;
  assert.ok(field);

  act(() => {
    field.onBlur();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(capturedField?.error, 'Email is required');

  act(() => {
    field.onChange('ada@example.com');
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(capturedField?.error, undefined);
  rendered.unmount();
});

test('useFormedible wires restored form event callbacks through the rendered form', () => {
  const calls: string[] = [];
  let capturedProps: FormProps | undefined;

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'email', label: 'Email' }],
      formOptions: {
        defaultValues: { email: 'ada@example.com' },
        onSubmit: () => undefined,
      },
      onFormReset: (_event, formApi) => calls.push(`reset:${String(formApi.state.values.email)}`),
      onFormInput: (_event, formApi) => calls.push(`input:${String(formApi.state.values.email)}`),
      onFormInvalid: (_event, formApi) => calls.push(`invalid:${String(formApi.state.values.email)}`),
      onFormKeyDown: (event, formApi) => calls.push(`keydown:${event.key}:${String(formApi.state.values.email)}`),
      onFormKeyUp: (event, formApi) => calls.push(`keyup:${event.key}:${String(formApi.state.values.email)}`),
      onFormFocus: (_event, formApi) => calls.push(`focus:${String(formApi.state.values.email)}`),
      onFormBlur: (_event, formApi) => calls.push(`blur:${String(formApi.state.values.email)}`),
    });
    const element = Form({}) as ReactElement<FormProps>;
    capturedProps = element.props;

    return element;
  }

  renderToStaticMarkup(<ExampleForm />);

  assert.ok(capturedProps);
  capturedProps.onReset?.(createFormEvent('reset'));
  capturedProps.onInput?.(createInputFormEvent('input'));
  capturedProps.onInvalid?.(createFormEvent('invalid'));
  capturedProps.onKeyDown?.(createKeyboardFormEvent('keydown', 'Enter'));
  capturedProps.onKeyUp?.(createKeyboardFormEvent('keyup', 'Escape'));
  capturedProps.onFocus?.(createFocusFormEvent('focus'));
  capturedProps.onBlur?.(createFocusFormEvent('blur'));

  assert.deepEqual(calls, [
    'reset:ada@example.com',
    'input:ada@example.com',
    'invalid:ada@example.com',
    'keydown:Enter:ada@example.com',
    'keyup:Escape:ada@example.com',
    'focus:ada@example.com',
    'blur:ada@example.com',
  ]);
});

test('autoSubmitOnChange submits only after debounced field changes and cleans up on unmount', async () => {
  const calls: string[] = [];
  let capturedField: FormedibleFieldController | undefined;

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          component: ({ field }) => {
            capturedField = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />;
          },
        },
      ],
      autoSubmitOnChange: true,
      autoSubmitDebounceMs: 20,
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: ({ value }) => {
          calls.push(String(value.email));
        },
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(30);
  });
  assert.deepEqual(calls, []);

  const field = capturedField;
  assert.ok(field);
  act(() => {
    field.onChange('first@example.com');
  });
  await act(async () => {
    await wait(30);
  });
  assert.deepEqual(calls, ['first@example.com']);

  act(() => {
    field.onChange('second@example.com');
    field.onChange('third@example.com');
  });
  await act(async () => {
    await wait(30);
  });
  assert.deepEqual(calls, ['first@example.com', 'third@example.com']);

  act(() => {
    field.onChange('late@example.com');
  });
  rendered.unmount();
  await act(async () => {
    await wait(30);
  });
  assert.deepEqual(calls, ['first@example.com', 'third@example.com']);
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

test('field-level component overrides internal registry rendering', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First name',
          component: ({ fieldConfig, field }) => (
            <div data-custom-field="field-component">
              {fieldConfig.label}:{field.name}
            </div>
          ),
        },
      ],
      formOptions: {
        defaultValues: { firstName: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-custom-field="field-component"/);
  assert.match(markup, /First name:firstName/);
  assert.doesNotMatch(markup, /data-slot="input"/);
});

test('field-level wrapper wraps one field without wrapping siblings', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'wrappedName',
          type: 'text',
          label: 'Wrapped name',
          wrapper: ({ children, field }) => <section data-field-wrapper={field.name}>{children}</section>,
        },
        { name: 'plainName', type: 'text', label: 'Plain name' },
      ],
      formOptions: {
        defaultValues: { wrappedName: '', plainName: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /<section data-field-wrapper="wrappedName">/);
  assert.match(markup, /Wrapped name/);
  assert.match(markup, /Plain name/);
  assert.doesNotMatch(markup, /data-field-wrapper="plainName"/);
});

test('form-level defaultComponents map field types while preserving registry fallback', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'customText', type: 'text', label: 'Custom text' },
        { name: 'regularEmail', type: 'email', label: 'Regular email' },
      ],
      defaultComponents: {
        text: ({ fieldConfig, field }) => (
          <div data-default-component="text">
            {fieldConfig.label}:{field.name}
          </div>
        ),
      },
      formOptions: {
        defaultValues: { customText: '', regularEmail: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-default-component="text"/);
  assert.match(markup, /Custom text:customText/);
  assert.match(markup, /Regular email/);
  assert.match(markup, /data-slot="input"/);
});

test('form-level defaultComponents register custom field types rendered with legacy flat props', () => {
  const capturedProps: FormedibleFieldComponentProps<FormedibleFormValues>[] = [];
  const myWidget: FormedibleFieldComponent<FormedibleFormValues> = (props) => {
    capturedProps.push(props);

    return <div data-my-widget="true">{props.label}</div>;
  };

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'widget',
          type: 'myWidget',
          label: 'Widget label',
          placeholder: 'Widget placeholder',
          required: true,
          options: ['alpha', 'beta'],
          phoneConfig: { defaultCountry: 'FR', format: 'national' },
        },
      ],
      defaultComponents: { myWidget },
      formOptions: {
        defaultValues: { widget: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-my-widget="true"/);
  assert.match(markup, /Widget label/);

  const widgetProps = capturedProps.at(-1);
  assert.ok(widgetProps);
  assert.ok(widgetProps.fieldApi);
  assert.equal(typeof widgetProps.fieldApi.handleChange, 'function');
  assert.equal(widgetProps.fieldApi.name, 'widget');
  assert.equal(widgetProps.label, 'Widget label');
  assert.equal(widgetProps.placeholder, 'Widget placeholder');
  assert.equal(widgetProps.required, true);
  assert.deepEqual(widgetProps.options, [
    { value: 'alpha', label: 'alpha' },
    { value: 'beta', label: 'beta' },
  ]);
  assert.deepEqual(widgetProps.phoneConfig, { defaultCountry: 'FR', format: 'national' });
  assert.equal(widgetProps.fieldConfig.type, 'myWidget');
  assert.equal(widgetProps.fieldConfig.name, 'widget');
  assert.equal(widgetProps.field.name, 'widget');
  assert.equal(typeof widgetProps.field.onChange, 'function');
});

test('field component overrides receive both legacy flat props and render props', () => {
  const globalWrapper: FormedibleFieldWrapper<FormedibleFormValues> = ({ children }) => <div data-global-wrap="true">{children}</div>;
  let capturedProps: FormedibleFieldComponentProps<FormedibleFormValues> | undefined;
  const dualShapeComponent: FormedibleFieldComponent<FormedibleFormValues> = (props) => {
    capturedProps = props;

    return <input name={props.field.name} value={String(props.field.value ?? '')} onChange={() => undefined} readOnly />;
  };

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Enter your email',
          description: 'Work email only',
          component: dualShapeComponent,
        },
      ],
      globalWrapper,
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-global-wrap="true"/);
  assert.match(markup, /name="email"/);

  const componentProps = capturedProps;
  assert.ok(componentProps);
  assert.ok(componentProps.fieldApi);
  assert.equal(componentProps.fieldConfig.type, 'email');
  assert.equal(componentProps.fieldConfig.label, 'Email');
  assert.equal(componentProps.field.name, 'email');
  assert.equal(typeof componentProps.field.onChange, 'function');
  assert.equal(componentProps.label, 'Email');
  assert.equal(componentProps.placeholder, 'Enter your email');
  assert.equal(componentProps.description, 'Work email only');
  assert.equal(componentProps.globalWrapper, globalWrapper);
  assert.equal(componentProps.defaultComponent, undefined);
  assert.equal(typeof componentProps.renderField, 'function');
});

test('field wrappers receive children field and fieldConfig', () => {
  const capturedWrapperProps: FormedibleFieldWrapperProps<FormedibleFormValues>[] = [];
  const fieldWrapper: FormedibleFieldWrapper<FormedibleFormValues> = (props) => {
    capturedWrapperProps.push(props);

    return <section data-wrapped-field={props.field.name}>{props.children}</section>;
  };

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'firstName',
          type: 'text',
          label: 'First name',
          wrapper: fieldWrapper,
        },
      ],
      formOptions: {
        defaultValues: { firstName: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /<section data-wrapped-field="firstName">/);
  assert.match(markup, /First name/);
  assert.match(markup, /data-slot="input"/);

  const wrapperProps = capturedWrapperProps.at(-1);
  assert.ok(wrapperProps);
  assert.equal(wrapperProps.field.name, 'firstName');
  assert.equal(wrapperProps.fieldConfig.name, 'firstName');
  assert.equal(wrapperProps.fieldConfig.type, 'text');
  assert.ok(wrapperProps.children);
});

test('unregistered custom field types fall back to text rendering', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'mystery', type: 'mysteryShape', label: 'Mystery' }],
      formOptions: {
        defaultValues: { mystery: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-slot="input"/);
  assert.match(markup, /type="text"/);
  assert.match(markup, /Mystery/);
});

test('form-level globalWrapper wraps all rendered fields', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'firstName', type: 'text', label: 'First name' },
        { name: 'lastName', type: 'text', label: 'Last name' },
      ],
      globalWrapper: ({ children, field }) => <div data-global-wrapper={field.name}>{children}</div>,
      formOptions: {
        defaultValues: { firstName: '', lastName: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-global-wrapper="firstName"/);
  assert.match(markup, /data-global-wrapper="lastName"/);
  assert.match(markup, /First name/);
  assert.match(markup, /Last name/);
});

test('registry rendering remains stable without customization extension points', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'email', label: 'Email' }],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-slot="input"/);
  assert.match(markup, /type="email"/);
  assert.doesNotMatch(markup, /data-custom-field/);
  assert.doesNotMatch(markup, /data-field-wrapper/);
  assert.doesNotMatch(markup, /data-global-wrapper/);
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

test('field wrapper renders legacy help tooltip behind a popover trigger', () => {
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
  assert.match(markup, /data-formedible-help-tooltip="true"/);
  assert.doesNotMatch(markup, /We use this to personalize your experience\./);
});

test('field wrapper renders rich help text and documentation link', () => {
  const markup = renderToStaticMarkup(
    <TextField
      fieldConfig={{
        name: 'email',
        type: 'email',
        label: 'Email',
        disabled: false,
        required: false,
        help: {
          text: 'We only use this for account access.',
          link: { url: 'https://example.com/help', text: 'Read more' },
        },
      }}
      field={{ id: 'email', name: 'email', value: '', onBlur: () => undefined, onChange: () => undefined }}
    />,
  );

  assert.match(markup, /data-formedible-field-help="true"/);
  assert.match(markup, /We only use this for account access\./);
  assert.match(markup, /href="https:\/\/example\.com\/help"/);
  assert.match(markup, /Read more/);
  assert.match(markup, /data-formedible-help-link="true"/);
});

test('tab analytics fire on tab switch with legacy arguments', async () => {
  const tabChangeCalls: string[] = [];
  const tabFirstVisitCalls: string[] = [];

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'firstName', type: 'text', label: 'First name', tab: 'personal' },
        { name: 'email', type: 'email', label: 'Email', tab: 'contact' },
      ],
      tabs: [
        { id: 'personal', label: 'Personal' },
        { id: 'contact', label: 'Contact' },
      ],
      analytics: {
        onTabChange: (fromTab, toTab, timeSpent, tabCompletionState) =>
          tabChangeCalls.push(`${fromTab}>${toTab}:${timeSpent >= 0}:${String(tabCompletionState?.completionPercentage)}`),
        onTabFirstVisit: (tabId, timestamp) => tabFirstVisitCalls.push(`${tabId}:${timestamp > 0}`),
      },
      formOptions: {
        defaultValues: { firstName: 'Ada', email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(tabFirstVisitCalls, ['personal:true']);

  const contactTab = [...rendered.document.querySelectorAll('[role="tab"]')].find((tab): tab is HTMLElement => tab.textContent?.includes('Contact') === true);
  assert.ok(contactTab);
  act(() => {
    contactTab.click();
  });
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(tabChangeCalls, ['personal>contact:true:100']);
  assert.deepEqual(tabFirstVisitCalls, ['personal:true', 'contact:true']);
  rendered.unmount();
});

test('submission performance analytics fire after a successful submit', async () => {
  const performanceCalls: string[] = [];

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'text', label: 'Email', component: ({ field }) => (
        <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />
      ) }],
      analytics: {
        onSubmissionPerformance: (submissionTime, validationTime, processingTime) =>
          performanceCalls.push(`${submissionTime >= 0}:${validationTime}:${processingTime >= 0}`),
      },
      formOptions: {
        defaultValues: { email: 'ada@example.com' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(performanceCalls, ['true:0:true']);
  rendered.unmount();
});

test('help tooltip popover opens on click and interpolates dynamic tokens', async () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'firstName', type: 'text', label: 'First name' },
        { name: 'nickname', type: 'text', label: 'Nickname', help: { tooltip: 'Hi {{ firstName }}, pick a nickname.', position: 'bottom' } },
      ],
      formOptions: {
        defaultValues: { firstName: 'Ada', nickname: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const trigger = rendered.document.querySelector<HTMLElement>('[data-formedible-help-tooltip="true"]');
  assert.ok(trigger, 'the help tooltip trigger must render');

  act(() => {
    trigger.click();
  });
  await act(async () => {
    await wait(0);
  });

  const tooltipContent = rendered.document.querySelector('[data-formedible-help-tooltip-content="true"]');
  assert.ok(tooltipContent, 'the help tooltip must open on click');
  assert.match(tooltipContent.textContent ?? '', /Hi Ada, pick a nickname\./);
  rendered.unmount();
});

test('hook-level styling classNames reach the field wrappers, labels, and buttons', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'email', label: 'Email' }],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
      fieldClassName: 'hook-field-class',
      labelClassName: 'hook-label-class',
      submitButtonClassName: 'hook-submit-class',
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-slot="field"[^>]*hook-field-class/);
  assert.match(markup, /data-slot="field-label"[^>]*hook-label-class/);
  assert.match(markup, /<button[^>]*hook-submit-class[^>]*>Submit<\/button>/);
});

test('hook-level field and label classNames merge with field-level classNames', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'email', label: 'Email', className: 'field-class', labelClassName: 'field-label-class' }],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
      fieldClassName: 'hook-field-class',
      labelClassName: 'hook-label-class',
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-slot="field"[^>]*field-class hook-field-class/);
  assert.match(markup, /data-slot="field-label"[^>]*field-label-class hook-label-class/);
});

test('multipage navigation forwards buttonClassName and submitButtonClassName', () => {
  function renderMultipageClassNamesExample(startOnLastPage: boolean) {
    function ExampleForm() {
      const { Form } = useFormedible<FormedibleFormValues>({
        fields: [
          { name: 'firstName', type: 'text', label: 'First name', page: 1, conditional: () => startOnLastPage !== true },
          { name: 'lastName', type: 'text', label: 'Last name', page: 2 },
        ],
        formOptions: {
          defaultValues: { firstName: '', lastName: '' },
          onSubmit: () => undefined,
        },
        buttonClassName: 'hook-button-class',
        submitButtonClassName: 'hook-submit-class',
      });

      return <Form />;
    }

    return renderToStaticMarkup(<ExampleForm />);
  }

  const firstPageMarkup = renderMultipageClassNamesExample(false);

  assert.match(firstPageMarkup, /<button[^>]*hook-button-class[^>]*>Next<\/button>/);
  assert.doesNotMatch(firstPageMarkup, /hook-submit-class/, 'page one renders Next, not the submit button');

  const lastPageMarkup = renderMultipageClassNamesExample(true);

  assert.match(lastPageMarkup, /<button[^>]*hook-submit-class[^>]*>Submit<\/button>/);
});

test('submit button disables and re-enables reactively through canSubmit', async () => {
  const fieldStore: { email?: FormedibleFieldController } = {};
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          component: ({ field }) => {
            fieldStore.email = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />;
          },
        },
      ],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const submitButton = [...rendered.document.querySelectorAll('button')].find((button) => button.textContent === 'Submit');
  assert.ok(submitButton);
  assert.equal(submitButton.disabled, false, 'an untouched form starts submittable');

  act(() => {
    fieldStore.email?.onBlur();
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(submitButton.disabled, true, 'a touched invalid form must disable the submit button');

  act(() => {
    fieldStore.email?.onChange('ada@example.com');
  });
  await act(async () => {
    await wait(0);
  });
  assert.equal(submitButton.disabled, false, 'fixing the invalid field must re-enable the submit button');
  rendered.unmount();
});

test('successful submit resets the form to its default values by default', async () => {
  const fieldStore: { email?: FormedibleFieldController } = {};
  const submittedValues: string[] = [];
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          component: ({ field }) => {
            fieldStore.email = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />;
          },
        },
      ],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: ({ value }) => {
          submittedValues.push(String(value.email));
        },
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.email?.onChange('ada@example.com');
  });
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(submittedValues, ['ada@example.com']);
  assert.equal(fieldStore.email?.value, '', 'a successful submit must reset the form values by default');
  rendered.unmount();
});

test('resetOnSubmitSuccess false keeps the submitted values', async () => {
  const fieldStore: { email?: FormedibleFieldController } = {};
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          component: ({ field }) => {
            fieldStore.email = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />;
          },
        },
      ],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
      resetOnSubmitSuccess: false,
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  act(() => {
    fieldStore.email?.onChange('grace@example.com');
  });
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(fieldStore.email?.value, 'grace@example.com', 'resetOnSubmitSuccess: false must keep the submitted values');
  rendered.unmount();
});

test('canSubmitWhenInvalid keeps the submit button enabled on a touched invalid form', async () => {
  const fieldStore: { email?: FormedibleFieldController } = {};
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        {
          name: 'email',
          type: 'text',
          label: 'Email',
          required: true,
          component: ({ field }) => {
            fieldStore.email = field;
            return <input name={field.name} value={String(field.value ?? '')} onChange={(event) => field.onChange(event.target.value)} readOnly />;
          },
        },
      ],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
        canSubmitWhenInvalid: true,
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  const submitButton = [...rendered.document.querySelectorAll('button')].find((button) => button.textContent === 'Submit');
  assert.ok(submitButton);

  act(() => {
    fieldStore.email?.onBlur();
  });
  await act(async () => {
    await wait(0);
  });

  assert.equal(submitButton.disabled, false, 'canSubmitWhenInvalid must keep the submit button enabled despite errors');
  rendered.unmount();
});

test('formOptions.onSubmitInvalid is forwarded and fires on invalid submit', async () => {
  const invalidSubmitCalls: string[] = [];

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'email', type: 'text', label: 'Email', required: true }],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
        onSubmitInvalid: ({ value, formApi }) => {
          invalidSubmitCalls.push(`empty:${value.email === ''}:api:${typeof formApi.handleSubmit}`);
        },
      },
    });

    return <Form />;
  }

  const rendered = renderClient(<ExampleForm />);
  await act(async () => {
    await wait(0);
  });

  act(() => {
    rendered.document.querySelector('form')?.requestSubmit();
  });
  await act(async () => {
    await wait(0);
  });

  assert.deepEqual(invalidSubmitCalls, ['empty:true:api:function']);
  rendered.unmount();
});

test('useFormedible renders with empty fields and no formOptions', () => {
  function ExampleForm() {
    const { Form } = useFormedible({ fields: [] });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /<form/);
  assert.match(markup, />Submit<\/button>/);
});

test('sections without a title render their description without a heading', () => {
  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [{ name: 'firstName', type: 'text', label: 'First name', section: { description: 'About you' } }],
      formOptions: {
        defaultValues: { firstName: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  const markup = renderToStaticMarkup(<ExampleForm />);

  assert.match(markup, /data-formedible-section="true"/);
  assert.doesNotMatch(markup, /<h2/);
  assert.match(markup, /About you/);
});

test('custom select components receive an empty options array when the field declares none', () => {
  const capturedProps: FormedibleFieldComponentProps<FormedibleFormValues>[] = [];

  function CapturingComponent(props: FormedibleFieldComponentProps<FormedibleFormValues>) {
    capturedProps.push(props);
    return <input name={props.fieldConfig.name} readOnly />;
  }

  function ExampleForm() {
    const { Form } = useFormedible<FormedibleFormValues>({
      fields: [
        { name: 'country', type: 'select', label: 'Country', component: CapturingComponent },
        { name: 'notes', type: 'text', label: 'Notes', component: CapturingComponent },
      ],
      formOptions: {
        defaultValues: { country: '', notes: '' },
        onSubmit: () => undefined,
      },
    });

    return <Form />;
  }

  renderToStaticMarkup(<ExampleForm />);

  const selectProps = capturedProps.find((props) => props.fieldConfig.name === 'country');
  const textProps = capturedProps.find((props) => props.fieldConfig.name === 'notes');

  assert.ok(selectProps);
  assert.ok(textProps);
  assert.deepEqual(selectProps.options, []);
  assert.equal(textProps.options, undefined);
});
