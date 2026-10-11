import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { useFormedible } from '../../../packages/formedible/src/hooks/use-formedible';
import {
  defaultFormedibleFormMessages,
  defaultFormedibleValidationMessages,
  resolveFormedibleFormMessages,
  resolveFormedibleValidationMessages,
} from '../../../packages/formedible/src/lib/formedible/messages';
import { buildFieldValidators, buildFormValidators, runFieldSyncValidation } from '../../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleFormValidationApi, FormedibleFormValidatorContext, FormedibleValidatorContext } from '../../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleCrossFieldValidation, FormedibleFormValues, NormalizedFieldConfig } from '../../../packages/formedible/src/lib/formedible/types';

interface MessageValues extends FormedibleFormValues {
  email: string;
  website: string;
  age: number;
  bio: string;
  password: string;
  confirmPassword: string;
}

type SyncRunner = (context: FormedibleValidatorContext<MessageValues>) => string | undefined;
type FormRunner = (context: FormedibleFormValidatorContext<MessageValues>) => { readonly fields: Partial<Record<string, string>> } | undefined;

function fieldConfig(config: Partial<NormalizedFieldConfig<MessageValues>> & Pick<NormalizedFieldConfig<MessageValues>, 'name'>): NormalizedFieldConfig<MessageValues> {
  return {
    type: 'text',
    disabled: false,
    required: false,
    ...config,
  };
}

function validatorContext(value: unknown): FormedibleValidatorContext<MessageValues> {
  return {
    value,
    fieldApi: {
      form: {
        state: { values: { email: '', website: '', age: 0, bio: '', password: '', confirmPassword: '' } },
        parseValuesWithSchema: () => undefined,
        parseValuesWithSchemaAsync: async () => undefined,
      },
    },
  };
}

function formApi(values: MessageValues): FormedibleFormValidationApi<MessageValues> {
  return {
    state: { values },
    parseValuesWithSchema: () => undefined,
    parseValuesWithSchemaAsync: async () => undefined,
  };
}

const french = {
  requiredField: ({ fieldLabel }: { readonly fieldLabel: string }) => `${fieldLabel} est obligatoire`,
  invalidEmail: () => 'Saisissez une adresse e-mail valide',
  invalidUrl: () => 'Saisissez une URL valide',
  maxLength: ({ maxLength }: { readonly maxLength: number }) => `${maxLength} caractères maximum`,
  numberMin: ({ min }: { readonly min: number }) => `Doit valoir au moins ${min}`,
  numberMax: ({ max }: { readonly max: number }) => `Doit valoir au plus ${max}`,
  invalidValue: () => 'Valeur invalide',
  invalidFieldCombination: () => 'Combinaison de champs invalide',
} as const;

test('built-in messages default to the exact legacy English strings when no override is supplied', () => {
  const required = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'email', type: 'email', label: 'Email', required: true }), undefined, undefined, undefined);
  assert.equal((required.onChange as unknown as SyncRunner)(validatorContext('')), 'Email is required');

  const email = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'email', type: 'email', label: 'Email' }), undefined, undefined, undefined);
  assert.equal((email.onChange as unknown as SyncRunner)(validatorContext('not-an-email')), 'Please enter a valid email address');

  const url = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'website', type: 'url', label: 'Website' }), undefined, undefined, undefined);
  assert.equal((url.onChange as unknown as SyncRunner)(validatorContext('not-a-url')), 'Please enter a valid URL');

  const maxLength = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'bio', maxLength: 10, label: 'Bio' }), undefined, undefined, undefined);
  assert.equal((maxLength.onChange as unknown as SyncRunner)(validatorContext('0123456789a')), 'Must be at most 10 characters');

  const number = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'age', type: 'number', min: 18, max: 99, label: 'Age' }), undefined, undefined, undefined);
  assert.equal((number.onChange as unknown as SyncRunner)(validatorContext(17)), 'Must be at least 18');
  assert.equal((number.onChange as unknown as SyncRunner)(validatorContext(100)), 'Must be at most 99');
});

test('message overrides flow through the built-in validation chain', () => {
  const required = buildFieldValidators<MessageValues, string>(
    fieldConfig({ name: 'email', type: 'email', label: 'Courriel', required: true }),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    french,
  );
  assert.equal((required.onChange as unknown as SyncRunner)(validatorContext('')), 'Courriel est obligatoire');
  assert.equal((required.onChange as unknown as SyncRunner)(validatorContext('pas-un-email')), 'Saisissez une adresse e-mail valide');

  const url = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'website', type: 'url', label: 'Site web' }), undefined, undefined, undefined, undefined, undefined, french);
  assert.equal((url.onChange as unknown as SyncRunner)(validatorContext('pas-une-url')), 'Saisissez une URL valide');

  const bio = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'bio', maxLength: 10, label: 'Bio' }), undefined, undefined, undefined, undefined, undefined, french);
  assert.equal((bio.onChange as unknown as SyncRunner)(validatorContext('0123456789a')), '10 caractères maximum');

  const age = buildFieldValidators<MessageValues, string>(fieldConfig({ name: 'age', type: 'number', min: 18, max: 99, label: 'Âge' }), undefined, undefined, undefined, undefined, undefined, french);
  assert.equal((age.onChange as unknown as SyncRunner)(validatorContext(17)), 'Doit valoir au moins 18');
  assert.equal((age.onChange as unknown as SyncRunner)(validatorContext(100)), 'Doit valoir au plus 99');
});

test('validator fallback messages honor overrides', () => {
  const rejecting = buildFieldValidators<MessageValues, string>(
    fieldConfig({ name: 'password', validation: () => false }),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    french,
  );
  assert.equal((rejecting.onChange as unknown as SyncRunner)(validatorContext('x')), 'Valeur invalide');

  const crossField: readonly FormedibleCrossFieldValidation<MessageValues>[] = [
    { fields: ['password', 'confirmPassword'], validator: () => false },
  ];
  const formValidators = buildFormValidators<MessageValues>(undefined, crossField, undefined, undefined, french);
  const onSubmit = formValidators?.onSubmit as unknown as FormRunner;
  assert.deepEqual(onSubmit({ value: { email: '', website: '', age: 0, bio: '', password: 'a', confirmPassword: 'b' }, formApi: formApi({ email: '', website: '', age: 0, bio: '', password: 'a', confirmPassword: 'b' }) }), {
    fields: { password: 'Combinaison de champs invalide', confirmPassword: 'Combinaison de champs invalide' },
  });

  assert.equal(runFieldSyncValidation<MessageValues>(fieldConfig({ name: 'password', validation: () => false }), undefined, undefined, formApi({ email: '', website: '', age: 0, bio: '', password: '', confirmPassword: '' }), 'x', undefined, undefined, french), 'Valeur invalide');
});

test('partial overrides keep unspecified keys on the built-in English strings', () => {
  const resolved = resolveFormedibleValidationMessages({ invalidEmail: () => 'Email invalide' });

  assert.equal(resolved.invalidEmail(), 'Email invalide');
  assert.equal(resolved.requiredField({ fieldLabel: 'Email' }), 'Email is required');

  const formMessages = resolveFormedibleFormMessages({ validationSummary: ({ count }) => `${count} champ(s) à corriger` });

  assert.equal(formMessages.validationSummary({ count: 1 }), '1 champ(s) à corriger');
  assert.equal(formMessages.pageFallbackTitle({ pageNumber: 2 }), 'Step 2');
  assert.equal(formMessages.collapseSection(), 'Collapse');
  assert.equal(formMessages.expandSection(), 'Expand');

  assert.equal(resolveFormedibleValidationMessages().requiredField({ fieldLabel: 'X' }), defaultFormedibleValidationMessages.requiredField({ fieldLabel: 'X' }));
  assert.equal(resolveFormedibleFormMessages().validationSummary({ count: 2 }), defaultFormedibleFormMessages.validationSummary({ count: 2 }));
  assert.equal(defaultFormedibleFormMessages.validationSummary({ count: 1 }), 'Please fix 1 invalid field.');
  assert.equal(defaultFormedibleFormMessages.validationSummary({ count: 3 }), 'Please fix 3 invalid fields.');
});

function CollapsibleForm({ messages }: { readonly messages?: UseFormedibleMessages }) {
  const { Form } = useFormedible<MessageValues>({
    fields: [{ name: 'bio', label: 'Bio', section: { title: 'About you', collapsible: true } }],
    formOptions: { defaultValues: { email: '', website: '', age: 0, bio: '', password: '', confirmPassword: '' }, onSubmit: () => undefined },
    messages,
  });

  return <Form />;
}

type UseFormedibleMessages = Parameters<typeof useFormedible<MessageValues>>[0]['messages'];

test('the collapsible section toggle honors message overrides in rendered markup', () => {
  const defaultMarkup = renderToStaticMarkup(<CollapsibleForm />);

  assert.match(defaultMarkup, /aria-expanded="true"[^>]*>Collapse</);

  const frenchMarkup = renderToStaticMarkup(<CollapsibleForm messages={{ collapseSection: () => 'Réduire', expandSection: () => 'Déplier' }} />);

  assert.match(frenchMarkup, /aria-expanded="true"[^>]*>Réduire</);
  assert.doesNotMatch(frenchMarkup, />Collapse</);
});
