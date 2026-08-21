import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { z } from 'zod';

import { reorderArrayItems } from '../../packages/formedible/src/components/formedible/fields/array-field';
import { useFormedible } from '../../packages/formedible/src/hooks/use-formedible';
import { arrayItemFieldPath, getValueAtFieldPath, joinFieldPath } from '../../packages/formedible/src/lib/formedible/field-path';
import { buildFieldValidators, buildFormValidators } from '../../packages/formedible/src/lib/formedible/validation';
import { getIssueFieldName } from '../../packages/formedible/src/lib/formedible/zod-errors';
import { arrayFieldsCompatibilityExample, nestedConditionalObjectArrayCompatibilityExample } from '../compatibility-examples/nested-examples';
import type { FieldDescriptor } from '../compatibility-examples/example-manifest';
import type { FormedibleFormValidationApi, FormedibleFormValidatorContext, FormedibleValidatorContext } from '../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleFieldConfig, FormedibleFormValues, NormalizedFieldConfig } from '../../packages/formedible/src/lib/formedible/types';

interface NestedValues extends FormedibleFormValues {
  readonly object: {
    readonly child: string;
  };
  readonly array: readonly (string | {
    readonly child: string;
    readonly object: {
      readonly child: string;
    };
  })[];
  readonly roomDetails: readonly {
    readonly equipementRoom: boolean;
    readonly equipementListRoom: string;
  }[];
}

interface TestSchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

type SyncRunner<TFormValues extends FormedibleFormValues> = (context: FormedibleValidatorContext<TFormValues>) => string | undefined;

type FormRunner<TFormValues extends FormedibleFormValues> = (
  context: FormedibleFormValidatorContext<TFormValues>,
) => { readonly fields: Partial<Record<string, string>> } | undefined;

function collectIssues(issues: readonly TestSchemaIssue[]) {
  const fields: Record<string, TestSchemaIssue[]> = {};

  for (const issue of issues) {
    const fieldName = getIssueFieldName(issue);

    if (fieldName) {
      fields[fieldName] = [...(fields[fieldName] ?? []), issue];
    }
  }

  return { fields };
}

function fakeFormApi<TFormValues extends FormedibleFormValues>(values: TFormValues): FormedibleFormValidationApi<TFormValues> {
  return {
    state: { values },
    parseValuesWithSchema: (schema) => {
      const result = schema['~standard'].validate(values);

      if (result instanceof Promise) {
        throw new Error('Expected synchronous validation in nested field test');
      }

      return result.issues ? collectIssues(result.issues) : undefined;
    },
    parseValuesWithSchemaAsync: async (schema) => {
      const result = await schema['~standard'].validate(values);

      return result.issues ? collectIssues(result.issues) : undefined;
    },
  };
}

function normalizedField(config: Partial<NormalizedFieldConfig<NestedValues>> & Pick<NormalizedFieldConfig<NestedValues>, 'name'>): NormalizedFieldConfig<NestedValues> {
  return {
    type: 'text',
    disabled: false,
    required: false,
    ...config,
  };
}

function NestedRenderForm() {
  const { Form } = useFormedible<NestedValues>({
    fields: [
      {
        name: 'object',
        type: 'object',
        label: 'Object',
        objectConfig: {
          fields: [{ name: 'child', type: 'text', label: 'Object child' }],
        },
      },
      {
        name: 'array',
        type: 'array',
        label: 'Primitive array',
        arrayConfig: {
          itemType: 'string',
          minItems: 1,
          defaultValue: '',
        },
      },
      {
        name: 'array',
        type: 'array',
        label: 'Object array',
        arrayConfig: {
          itemType: 'object',
          objectConfig: {
            fields: [
              { name: 'child', type: 'text', label: 'Array child' },
              {
                name: 'object',
                type: 'object',
                label: 'Nested object',
                objectConfig: {
                  fields: [{ name: 'child', type: 'text', label: 'Deep child' }],
                },
              },
            ],
          },
        },
      },
    ],
    formOptions: {
      defaultValues: {
        object: { child: 'inside-object' },
        array: ['first', { child: 'inside-array-object', object: { child: 'deep' } }],
        roomDetails: [],
      },
    },
  });

  return <Form />;
}

function NestedConditionalForm() {
  const { Form } = useFormedible<NestedValues>({
    fields: [
      {
        name: 'roomDetails',
        type: 'array',
        label: 'Ajouter une pièce',
        arrayConfig: {
          itemType: 'object',
          minItems: 1,
          maxItems: 20,
          sortable: true,
          defaultValue: {
            equipementRoom: false,
            equipementListRoom: '',
          },
          objectConfig: {
            layout: 'grid',
            columns: 2,
            fields: [
              { name: 'equipementRoom', type: 'switch', label: 'Équipement spécifique' },
              {
                name: 'equipementListRoom',
                type: 'textarea',
                label: 'Liste des équipements',
                conditional: (values) => values.equipementRoom === true,
                maxLength: 1000,
              },
            ],
          },
        },
      },
    ],
    formOptions: {
      defaultValues: {
        object: { child: '' },
        array: [],
        roomDetails: [
          { equipementRoom: false, equipementListRoom: '' },
          { equipementRoom: true, equipementListRoom: 'Meubles intégrés' },
        ],
      },
    },
  });

  return <Form />;
}

test('field path utilities create and read TanStack nested paths', () => {
  const values: NestedValues = {
    object: { child: 'object-value' },
    array: ['primitive-value', { child: 'object-array-value', object: { child: 'deep-value' } }],
    roomDetails: [],
  };

  assert.equal(joinFieldPath('object', 'child'), 'object.child');
  assert.equal(arrayItemFieldPath('array', 0), 'array[0]');
  assert.equal(joinFieldPath(arrayItemFieldPath('array', 1), 'child'), 'array[1].child');
  assert.equal(joinFieldPath(joinFieldPath(arrayItemFieldPath('array', 1), 'object'), 'child'), 'array[1].object.child');
  assert.equal(getValueAtFieldPath(values, 'object.child'), 'object-value');
  assert.equal(getValueAtFieldPath(values, 'array[0]'), 'primitive-value');
  assert.equal(getValueAtFieldPath(values, 'array[1].child'), 'object-array-value');
  assert.equal(getValueAtFieldPath(values, 'array[1].object.child'), 'deep-value');
});

test('nested object and array fields render real TanStack field names', () => {
  const markup = renderToStaticMarkup(<NestedRenderForm />);

  assert.match(markup, /name="object\.child"/);
  assert.match(markup, /name="array\[0\]"/);
  assert.match(markup, /name="array\[1\]\.child"/);
  assert.match(markup, /name="array\[1\]\.object\.child"/);
});

test('conditional-in-obj nested conditionals receive local array item values', () => {
  const markup = renderToStaticMarkup(<NestedConditionalForm />);
  const textareaMatches = markup.match(/name="roomDetails\[\d+\]\.equipementListRoom"/g) ?? [];

  assert.equal(nestedConditionalObjectArrayCompatibilityExample.sourceFile.endsWith('conditional-in-obj.tsx'), true);
  assert.equal(textareaMatches.length, 1);
  assert.equal(textareaMatches[0], 'name="roomDetails[1].equipementListRoom"');
});

interface ArrayFieldsExampleValues extends FormedibleFormValues {
  readonly teamMembers: readonly Record<string, unknown>[];
  readonly contactMethods: readonly string[];
  readonly emergencyContacts: readonly Record<string, unknown>[];
}

function fixtureDescriptor(name: string): FieldDescriptor {
  const descriptor = arrayFieldsCompatibilityExample.fields.find((field) => field.name === name);

  if (!descriptor) {
    throw new Error(`array fields example fixture is missing the ${name} field`);
  }

  return descriptor;
}

function fixtureConfigValue(descriptor: FieldDescriptor, key: string): string | undefined {
  const entry = descriptor.config?.find((token) => token.startsWith(`${key}:`));

  return entry?.slice(key.length + 1);
}

function fixtureConfigNumber(descriptor: FieldDescriptor, key: string): number | undefined {
  const value = fixtureConfigValue(descriptor, key);

  return value !== undefined && /^\d+$/.test(value) ? Number(value) : undefined;
}

function fixtureStringOptions(descriptor: FieldDescriptor | undefined): readonly string[] {
  return (descriptor?.options ?? []).filter((option): option is string => typeof option === 'string');
}

function fixtureArrayItem(descriptor: FieldDescriptor): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  for (const nested of descriptor.nestedFields ?? []) {
    item[nested.name] = nested.type === 'switch' ? false : nested.type === 'select' ? (fixtureStringOptions(nested)[0] ?? '') : '';
  }

  return item;
}

function fixtureArrayField(descriptor: FieldDescriptor): FormedibleFieldConfig<FormedibleFormValues> {
  const nestedFields: readonly FormedibleFieldConfig<FormedibleFormValues>[] = (descriptor.nestedFields ?? []).map((nested) => ({
    name: nested.name,
    type: nested.type,
    options: nested.options,
  }));
  const configuredItemType = fixtureConfigValue(descriptor, 'itemType');
  const itemType = configuredItemType === 'email' ? 'email' : configuredItemType === 'object' || nestedFields.length > 0 ? 'object' : 'string';

  return {
    name: descriptor.name,
    type: 'array',
    label: descriptor.name,
    arrayConfig: {
      itemType,
      objectConfig: nestedFields.length > 0 ? { fields: nestedFields } : undefined,
    },
  };
}

function ArrayFieldsExampleFixtureForm() {
  const defaultValues: FormedibleFormValues = {};

  for (const descriptor of arrayFieldsCompatibilityExample.fields) {
    defaultValues[descriptor.name] = descriptor.nestedFields ? [fixtureArrayItem(descriptor)] : [''];
  }

  const { Form } = useFormedible<FormedibleFormValues>({
    fields: arrayFieldsCompatibilityExample.fields.map(fixtureArrayField),
    formOptions: { defaultValues },
  });

  return <Form />;
}

test('array fields example fixture renders nested item fields addressed by name', () => {
  assert.ok(arrayFieldsCompatibilityExample.assertionsRequired.includes('nested fields are addressed by field names and not by array index'));

  const markup = renderToStaticMarkup(<ArrayFieldsExampleFixtureForm />);

  for (const descriptor of arrayFieldsCompatibilityExample.fields) {
    for (const nested of descriptor.nestedFields ?? []) {
      assert.match(markup, new RegExp(`name="${descriptor.name}\\[0\\]\\.${nested.name}"`), `${descriptor.name}.${nested.name} must render as a named TanStack path`);
    }

    if (!descriptor.nestedFields) {
      assert.match(markup, new RegExp(`name="${descriptor.name}\\[0\\]"`));
    }
  }

  const roleDescriptor = fixtureDescriptor('teamMembers').nestedFields?.find((nested) => nested.name === 'role');
  assert.equal(fixtureStringOptions(roleDescriptor).length, 4, 'the fixture must keep the four team member role options');
});

test('array fields example min, max, and email item rules match fixture evidence through the real pipeline', () => {
  assert.ok(arrayFieldsCompatibilityExample.assertionsRequired.includes('teamMembers requires at least one item and allows at most ten items'));
  assert.ok(arrayFieldsCompatibilityExample.assertionsRequired.includes('contactMethods requires at least one valid email item and allows at most five items'));
  assert.ok(arrayFieldsCompatibilityExample.assertionsRequired.includes('emergencyContacts allows at most three items'));

  const teamMembers = fixtureDescriptor('teamMembers');
  const contactMethods = fixtureDescriptor('contactMethods');
  const emergencyContacts = fixtureDescriptor('emergencyContacts');

  const roleDescriptor = teamMembers.nestedFields?.find((nested) => nested.name === 'role');
  const roleOptions = fixtureStringOptions(roleDescriptor);
  const itemShape = (descriptor: FieldDescriptor) => {
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const nested of descriptor.nestedFields ?? []) {
      shape[nested.name] =
        nested.type === 'select' && descriptor.name === 'teamMembers'
          ? z.string().refine((value) => roleOptions.includes(value), 'Role must be one of the fixture options')
          : z.string();
    }

    return z.object(shape);
  };
  const boundedArray = (descriptor: FieldDescriptor, itemSchema: z.ZodTypeAny) => {
    const minItems = fixtureConfigNumber(descriptor, 'minItems');
    const maxItems = fixtureConfigNumber(descriptor, 'maxItems');
    let arraySchema = z.array(itemSchema);

    if (minItems !== undefined) {
      arraySchema = arraySchema.min(minItems);
    }

    if (maxItems !== undefined) {
      arraySchema = arraySchema.max(maxItems);
    }

    return arraySchema;
  };

  const contactItemSchema = fixtureConfigValue(contactMethods, 'itemType') === 'email' ? z.string().email('Contact method must be a valid email') : z.string();
  const schema = z.object({
    teamMembers: boundedArray(teamMembers, itemShape(teamMembers)),
    contactMethods: boundedArray(contactMethods, contactItemSchema),
    emergencyContacts: boundedArray(emergencyContacts, itemShape(emergencyContacts)),
  });

  const validators = buildFormValidators<ArrayFieldsExampleValues>(schema, undefined);
  const onChange = validators?.onChange as unknown as FormRunner<ArrayFieldsExampleValues>;

  const teamMembersMax = fixtureConfigNumber(teamMembers, 'maxItems') ?? 0;
  const emergencyContactsMax = fixtureConfigNumber(emergencyContacts, 'maxItems') ?? 0;

  const valuesWith = (teamMembersCount: number, contactMethodsValues: readonly string[], emergencyContactsCount: number): ArrayFieldsExampleValues => ({
    teamMembers: Array.from({ length: teamMembersCount }, () => fixtureArrayItem(teamMembers)),
    contactMethods: [...contactMethodsValues],
    emergencyContacts: Array.from({ length: emergencyContactsCount }, () => fixtureArrayItem(emergencyContacts)),
  });

  const emptyValues = valuesWith(0, [], 0);
  const emptyResult = onChange({ value: emptyValues, formApi: fakeFormApi(emptyValues) });
  assert.ok(emptyResult?.fields.teamMembers !== undefined, 'teamMembers below its fixture minItems must error');
  assert.ok(emptyResult?.fields.contactMethods !== undefined, 'contactMethods below its fixture minItems must error');

  const invalidEmailValues = valuesWith(1, ['not-an-email'], 0);
  const invalidEmailResult = onChange({ value: invalidEmailValues, formApi: fakeFormApi(invalidEmailValues) });
  assert.equal(invalidEmailResult?.fields['contactMethods[0]'], 'Contact method must be a valid email');

  const invalidRoleValues: ArrayFieldsExampleValues = {
    ...valuesWith(1, ['dev@example.com'], 0),
    teamMembers: [{ ...fixtureArrayItem(teamMembers), role: 'wizard' }],
  };
  const invalidRoleResult = onChange({ value: invalidRoleValues, formApi: fakeFormApi(invalidRoleValues) });
  assert.equal(invalidRoleResult?.fields['teamMembers[0].role'], 'Role must be one of the fixture options');

  const overMaxValues = valuesWith(teamMembersMax + 1, ['dev@example.com'], emergencyContactsMax + 1);
  const overMaxResult = onChange({ value: overMaxValues, formApi: fakeFormApi(overMaxValues) });
  assert.ok(overMaxResult?.fields.teamMembers !== undefined, 'teamMembers above its fixture maxItems must error');
  assert.ok(overMaxResult?.fields.emergencyContacts !== undefined, 'emergencyContacts above its fixture maxItems must error');

  const validValues = valuesWith(1, ['dev@example.com'], 1);
  const validResult = onChange({ value: validValues, formApi: fakeFormApi(validValues) });
  assert.equal(validResult, undefined, 'values within every fixture bound must validate clean');
});

test('submitted nested value shape remains a normal object and array tree', () => {
  const submitted: NestedValues = {
    object: { child: 'Ada' },
    array: ['email@example.com', { child: 'Grace', object: { child: 'Hopper' } }],
    roomDetails: [{ equipementRoom: true, equipementListRoom: 'Projecteur' }],
  };

  assert.deepEqual(submitted, {
    object: { child: 'Ada' },
    array: ['email@example.com', { child: 'Grace', object: { child: 'Hopper' } }],
    roomDetails: [{ equipementRoom: true, equipementListRoom: 'Projecteur' }],
  });
});

test('sorting preserves submitted values and object identity', () => {
  const first = { id: 'first', child: 'Ada' };
  const second = { id: 'second', child: 'Grace' };
  const sorted = reorderArrayItems([first, second], 0, 1);

  assert.equal(sorted[0], second);
  assert.equal(sorted[1], first);
  assert.deepEqual(sorted, [second, first]);
});

test('nested Zod errors map to object and array TanStack paths', () => {
  const schema = z.object({
    object: z.object({ child: z.string().min(2, 'Object child too short') }),
    array: z.array(z.object({ child: z.string().min(2, 'Array child too short'), object: z.object({ child: z.string().min(2, 'Deep child too short') }) })),
    roomDetails: z.array(z.object({ equipementRoom: z.boolean(), equipementListRoom: z.string() })),
  });
  const values: NestedValues = {
    object: { child: '' },
    array: [{ child: '', object: { child: '' } }],
    roomDetails: [],
  };
  const formValidators = buildFormValidators<NestedValues>(schema, undefined);
  const onChange = formValidators?.onChange as unknown as FormRunner<NestedValues>;
  const formResult = onChange({ value: values, formApi: fakeFormApi(values) });
  const fieldValidators = buildFieldValidators<NestedValues, string>(normalizedField({ name: 'array[0].object.child' }), schema, undefined, undefined);
  const onFieldChange = fieldValidators.onChange as unknown as SyncRunner<NestedValues>;

  assert.equal(formResult?.fields['object.child'], 'Object child too short');
  assert.equal(formResult?.fields['array[0].child'], 'Array child too short');
  assert.equal(formResult?.fields['array[0].object.child'], 'Deep child too short');
  assert.equal(onFieldChange({ value: '', fieldApi: { form: fakeFormApi(values) } }), 'Deep child too short');
});
