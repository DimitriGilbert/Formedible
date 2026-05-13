import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { z } from 'zod';

import { TextField } from '../../../packages/formedible/src/components/formedible/fields/text-field';
import { useFormedible } from '../../../packages/formedible/src/hooks/use-formedible';
import type { FormedibleFormValues, NormalizedFieldConfig } from '../../../packages/formedible/src/lib/formedible/types';
import { buildFieldValidators, buildFormValidators } from '../../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleAsyncValidatorContext, FormedibleFormValidationApi, FormedibleFormValidatorContext, FormedibleValidatorContext } from '../../../packages/formedible/src/lib/formedible/validation';
import { getIssueFieldName } from '../../../packages/formedible/src/lib/formedible/zod-errors';
import { removedUseFormedibleReturnFields } from '../../compatibility-examples/use-formedible-return-contract';

interface ValidationValues extends FormedibleFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  age: number;
}

interface TestSchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

type SyncRunner<TFormValues extends FormedibleFormValues> = (context: FormedibleValidatorContext<TFormValues>) => string | undefined;

type AsyncRunner<TFormValues extends FormedibleFormValues> = (context: FormedibleAsyncValidatorContext<TFormValues>) => Promise<string | undefined>;

type FormRunner<TFormValues extends FormedibleFormValues> = (
  context: FormedibleFormValidatorContext<TFormValues>,
) => { readonly fields: Partial<Record<string, string>> } | undefined;

function collectIssues(issues: readonly TestSchemaIssue[]) {
  const fields: Record<string, TestSchemaIssue[]> = {};

  for (const issue of issues) {
    const fieldName = getIssueFieldName(issue);

    if (!fieldName) {
      continue;
    }

    fields[fieldName] = [...(fields[fieldName] ?? []), issue];
  }

  return { fields };
}

function fakeFormApi<TFormValues extends FormedibleFormValues>(values: TFormValues): FormedibleFormValidationApi<TFormValues> {
  return {
    state: { values },
    parseValuesWithSchema: (schema) => {
      const result = schema['~standard'].validate(values);

      if (result instanceof Promise) {
        throw new Error('Expected synchronous validation in this assertion');
      }

      return result.issues ? collectIssues(result.issues) : undefined;
    },
    parseValuesWithSchemaAsync: async (schema) => {
      const result = await schema['~standard'].validate(values);

      return result.issues ? collectIssues(result.issues) : undefined;
    },
  };
}

function context<TFormValues extends FormedibleFormValues>(value: unknown, values: TFormValues): FormedibleValidatorContext<TFormValues> {
  return { value, fieldApi: { form: fakeFormApi(values) } };
}

function asyncContext<TFormValues extends FormedibleFormValues>(
  value: unknown,
  values: TFormValues,
  signal: AbortSignal,
): FormedibleAsyncValidatorContext<TFormValues> {
  return { value, signal, fieldApi: { form: fakeFormApi(values) } };
}

function fieldConfig(config: Partial<NormalizedFieldConfig<ValidationValues>> & Pick<NormalizedFieldConfig<ValidationValues>, 'name'>): NormalizedFieldConfig<ValidationValues> {
  return {
    type: 'text',
    disabled: false,
    required: false,
    ...config,
  };
}

const validValues: ValidationValues = {
  email: 'user@example.com',
  password: 'secret-123',
  confirmPassword: 'secret-123',
  username: 'available',
  age: 21,
};

test('built-in constraints render through normal field errors', () => {
  const validators = buildFieldValidators<ValidationValues, string>(fieldConfig({ name: 'email', type: 'email', label: 'Email', required: true }), undefined, undefined, undefined);
  const onChange = validators.onChange as unknown as SyncRunner<ValidationValues>;
  const requiredError = onChange(context('', validValues));
  const emailError = onChange(context('not-an-email', { ...validValues, email: 'not-an-email' }));

  assert.equal(requiredError, 'Email is required');
  assert.equal(emailError, 'Please enter a valid email address');

  const markup = renderToStaticMarkup(
    <TextField
      fieldConfig={fieldConfig({ name: 'email', type: 'email', label: 'Email' })}
      field={{ id: 'email', name: 'email', value: '', error: requiredError, onBlur: () => undefined, onChange: () => undefined }}
    />,
  );

  assert.match(markup, /Email is required/);
  assert.match(markup, /data-invalid="true"/);
});

test('field-level validation uses TanStack field validators', () => {
  const validators = buildFieldValidators<ValidationValues, string>(
    fieldConfig({
      name: 'username',
      validation: (value) => (value === 'admin' ? 'Username is reserved' : undefined),
    }),
    undefined,
    undefined,
    undefined,
  );

  const onChange = validators.onChange as unknown as SyncRunner<ValidationValues>;

  assert.equal(onChange(context('admin', { ...validValues, username: 'admin' })), 'Username is reserved');
});

test('field-level direct schema validation returns field errors without calling object validator properties', () => {
  const validators = buildFieldValidators<ValidationValues, string>(
    fieldConfig({
      name: 'username',
      validation: z.string().min(3, 'Username must be at least 3 characters'),
    }),
    undefined,
    undefined,
    undefined,
  );

  const onChange = validators.onChange as unknown as SyncRunner<ValidationValues>;

  assert.equal(onChange(context('ab', { ...validValues, username: 'ab' })), 'Username must be at least 3 characters');
  assert.equal(onChange(context('abcd', { ...validValues, username: 'abcd' })), undefined);
});

test('field-level validation object behavior remains supported', () => {
  const validators = buildFieldValidators<ValidationValues, string>(
    fieldConfig({
      name: 'username',
      validation: {
        validator: (value) => (value === 'root' ? false : undefined),
        message: 'Username is not allowed',
      },
    }),
    undefined,
    undefined,
    undefined,
  );

  const onChange = validators.onChange as unknown as SyncRunner<ValidationValues>;

  assert.equal(onChange(context('root', { ...validValues, username: 'root' })), 'Username is not allowed');
});

test('top-level schema validation resolves field errors without custom state', () => {
  const schema = z.object({
    email: z.string().email('Schema email error'),
    password: z.string(),
    confirmPassword: z.string(),
    username: z.string(),
    age: z.number().min(18, 'Must be an adult'),
  });
  const validators = buildFormValidators<ValidationValues>(schema, undefined);
  const onChange = validators?.onChange as unknown as FormRunner<ValidationValues>;
  const result = onChange({ value: { ...validValues, email: 'bad', age: 17 }, formApi: fakeFormApi({ ...validValues, email: 'bad', age: 17 }) });

  assert.equal(result?.fields.email, 'Schema email error');
  assert.equal(result?.fields.age, 'Must be an adult');
});

test('cross-field validation maps to field errors without crossFieldErrors', () => {
  const validators = buildFieldValidators<ValidationValues, string>(
    fieldConfig({ name: 'confirmPassword', type: 'password' }),
    undefined,
    [
      {
        fields: ['password', 'confirmPassword'],
        validator: (values) => (values.password === values.confirmPassword ? undefined : 'Passwords do not match'),
      },
    ],
    undefined,
  );

  assert.deepEqual(validators.onChangeListenTo, ['password']);
  const onChange = validators.onChange as unknown as SyncRunner<ValidationValues>;

  assert.equal(onChange(context('different', { ...validValues, confirmPassword: 'different' })), 'Passwords do not match');
});

test('async and inline validation use TanStack async validators and debounce', async () => {
  const abortController = new AbortController();
  const validators = buildFieldValidators<ValidationValues, string>(
    fieldConfig({
      name: 'username',
      inlineValidation: {
        enabled: true,
        debounceMs: 125,
        validator: async (value) => (value === 'inline-blocked' ? 'Inline username error' : undefined),
      },
    }),
    undefined,
    undefined,
    {
      username: {
        debounceMs: 250,
        validator: async (value) => (value === 'taken' ? 'Username is already taken' : undefined),
      },
    },
  );

  assert.equal(validators.onChangeAsyncDebounceMs, 250);
  const onChangeAsync = validators.onChangeAsync as unknown as AsyncRunner<ValidationValues>;

  assert.equal(await onChangeAsync(asyncContext('taken', { ...validValues, username: 'taken' }, abortController.signal)), 'Username is already taken');

  const inlineValidators = buildFieldValidators<ValidationValues, string>(
    fieldConfig({
      name: 'username',
      inlineValidation: {
        enabled: true,
        debounceMs: 125,
        validator: async (value) => (value === 'inline-blocked' ? 'Inline username error' : undefined),
      },
    }),
    undefined,
    undefined,
    undefined,
  );

  assert.equal(inlineValidators.onChangeAsyncDebounceMs, 125);
  const inlineOnChangeAsync = inlineValidators.onChangeAsync as unknown as AsyncRunner<ValidationValues>;

  assert.equal(
    await inlineOnChangeAsync(asyncContext('inline-blocked', { ...validValues, username: 'inline-blocked' }, abortController.signal)),
    'Inline username error',
  );
});

test('removed validation helpers are neither returned nor authored in the hook', () => {
  function ContractProbe() {
    const formedible = useFormedible<ValidationValues>({
      fields: [fieldConfig({ name: 'email', type: 'email' })],
      formOptions: {
        defaultValues: validValues,
      },
    });

    for (const removedField of removedUseFormedibleReturnFields) {
      assert.equal(Object.hasOwn(formedible, removedField), false);
    }

    return <formedible.Form />;
  }

  renderToStaticMarkup(<ContractProbe />);

  const source = readFileSync(join(process.cwd(), 'packages/formedible/src/hooks/use-formedible.tsx'), 'utf8');

  for (const removedField of removedUseFormedibleReturnFields) {
    assert.doesNotMatch(source, new RegExp(`\\b${removedField}\\b`));
  }
});
