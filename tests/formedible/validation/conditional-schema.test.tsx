import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { ReactElement } from 'react';
import { z } from 'zod';

import { useFormedible } from '../../../packages/formedible/src/hooks/use-formedible';
import { isFieldPathVisible } from '../../../packages/formedible/src/lib/formedible/field-visibility';
import type { FormediblePageTabVisibility } from '../../../packages/formedible/src/lib/formedible/field-visibility';
import type { FormedibleFormValues, NormalizedFieldConfig } from '../../../packages/formedible/src/lib/formedible/types';
import { buildFieldValidators, buildFormValidators } from '../../../packages/formedible/src/lib/formedible/validation';
import type {
  FormedibleAsyncFormValidatorContext,
  FormedibleFormValidationApi,
  FormedibleFormValidatorContext,
  FormedibleValidatorContext,
} from '../../../packages/formedible/src/lib/formedible/validation';
import { getIssueFieldName } from '../../../packages/formedible/src/lib/formedible/zod-errors';

interface TestSchemaIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

type SyncRunner<TFormValues extends FormedibleFormValues> = (context: FormedibleValidatorContext<TFormValues>) => string | undefined;

type FormRunner<TFormValues extends FormedibleFormValues> = (
  context: FormedibleFormValidatorContext<TFormValues>,
) => { readonly fields: Partial<Record<string, string>> } | undefined;

type AsyncFormRunner<TFormValues extends FormedibleFormValues> = (
  context: FormedibleAsyncFormValidatorContext<TFormValues>,
) => Promise<{ readonly fields: Partial<Record<string, string>> } | undefined>;

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

function countingFormApi<TFormValues extends FormedibleFormValues>(values: TFormValues) {
  let syncParseCount = 0;

  const api: FormedibleFormValidationApi<TFormValues> = {
    state: { values },
    parseValuesWithSchema: (schema) => {
      syncParseCount += 1;

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

  return {
    api,
    get syncParseCount() {
      return syncParseCount;
    },
  };
}

function fieldConfig<TFormValues extends FormedibleFormValues>(
  config: Partial<NormalizedFieldConfig<TFormValues>> & Pick<NormalizedFieldConfig<TFormValues>, 'name'>,
): NormalizedFieldConfig<TFormValues> {
  return {
    type: 'text',
    disabled: false,
    required: false,
    ...config,
  };
}

function context<TFormValues extends FormedibleFormValues>(value: unknown, values: TFormValues): FormedibleValidatorContext<TFormValues> {
  return { value, fieldApi: { form: fakeFormApi(values) } };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderClient(element: ReactElement) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
  const rootElement = dom.window.document.getElementById('root');

  assert.ok(rootElement);

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousHTMLElement = globalThis.HTMLElement;
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
      globalThis.Event = previousEvent;
      actGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
      dom.window.close();
    },
  };
}

const conditionalPagesSchema = z.object({
  applicationType: z.enum(['individual', 'business']),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  dateOfBirth: z.date().optional(),
  personalId: z.string().min(1, 'Personal ID is required').optional(),
  companyName: z.string().min(1, 'Company name is required').optional(),
  businessType: z.enum(['llc', 'corporation', 'partnership', 'sole_proprietorship']).optional(),
  taxId: z.string().min(1, 'Tax ID is required').optional(),
  employeeCount: z.number().min(1, 'Employee count is required').optional(),
  needsPremium: z.boolean().default(false),
  premiumFeatures: z.array(z.string()).optional(),
  premiumBudget: z.enum(['basic', 'standard', 'premium']).optional(),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone number is required'),
  preferredContact: z.enum(['email', 'phone', 'both']),
});

type ConditionalPagesFormValues = z.infer<typeof conditionalPagesSchema>;

const conditionalPagesFields = [
  {
    name: 'applicationType',
    type: 'radio',
    label: 'Application Type',
    page: 1,
    options: [
      { value: 'individual', label: 'Individual Application' },
      { value: 'business', label: 'Business Application' },
    ],
  },
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
    page: 2,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'individual',
  },
  {
    name: 'lastName',
    type: 'text',
    label: 'Last Name',
    page: 2,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'individual',
  },
  {
    name: 'dateOfBirth',
    type: 'date',
    label: 'Date of Birth',
    page: 2,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'individual',
  },
  {
    name: 'personalId',
    type: 'text',
    label: 'Personal ID / SSN',
    page: 2,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'individual',
  },
  {
    name: 'companyName',
    type: 'text',
    label: 'Company Name',
    page: 3,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'business',
  },
  {
    name: 'businessType',
    type: 'select',
    label: 'Business Type',
    page: 3,
    options: [
      { value: 'llc', label: 'Limited Liability Company (LLC)' },
      { value: 'corporation', label: 'Corporation' },
    ],
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'business',
  },
  {
    name: 'taxId',
    type: 'text',
    label: 'Tax ID / EIN',
    page: 3,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'business',
  },
  {
    name: 'employeeCount',
    type: 'number',
    label: 'Number of Employees',
    page: 3,
    min: 1,
    conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'business',
  },
  {
    name: 'needsPremium',
    type: 'checkbox',
    label: "I'm interested in premium features",
    page: 4,
  },
  {
    name: 'premiumFeatures',
    type: 'multiSelect',
    label: 'Which premium features interest you?',
    page: 5,
    options: [
      { value: 'analytics', label: 'Advanced Analytics Dashboard' },
      { value: 'support', label: 'Priority 24/7 Support' },
    ],
    conditional: (values: ConditionalPagesFormValues) => values.needsPremium === true,
  },
  {
    name: 'premiumBudget',
    type: 'radio',
    label: 'Budget Range for Premium Features',
    page: 5,
    options: [
      { value: 'basic', label: 'Basic ($99/month)' },
      { value: 'standard', label: 'Standard ($299/month)' },
    ],
    conditional: (values: ConditionalPagesFormValues) => values.needsPremium === true,
  },
  { name: 'email', type: 'email', label: 'Email Address', page: 6 },
  { name: 'phone', type: 'phone', label: 'Phone Number', page: 6 },
  {
    name: 'preferredContact',
    type: 'radio',
    label: 'Preferred Contact Method',
    page: 6,
    options: [
      { value: 'email', label: 'Email' },
      { value: 'phone', label: 'Phone' },
    ],
  },
] as const;

const conditionalPagesPages = [
  { page: 1, title: 'Application Type' },
  { page: 2, title: 'Personal Information', conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'individual' },
  { page: 3, title: 'Business Information', conditional: (values: ConditionalPagesFormValues) => values.applicationType === 'business' },
  { page: 4, title: 'Premium Features' },
  { page: 5, title: 'Premium Options', conditional: (values: ConditionalPagesFormValues) => values.needsPremium === true },
  { page: 6, title: 'Contact Information' },
] as const;

function conditionalPagesDefaults(applicationType: 'individual' | 'business'): ConditionalPagesFormValues {
  return {
    applicationType,
    firstName: applicationType === 'individual' ? 'Ada' : '',
    lastName: applicationType === 'individual' ? 'Lovelace' : '',
    dateOfBirth: new Date(),
    personalId: applicationType === 'individual' ? '123-45-6789' : '',
    companyName: applicationType === 'business' ? 'Acme Corp' : '',
    businessType: 'llc',
    taxId: applicationType === 'business' ? '12-3456789' : '',
    employeeCount: applicationType === 'business' ? 10 : 0,
    needsPremium: false,
    premiumFeatures: [],
    premiumBudget: 'basic',
    email: 'ada@example.com',
    phone: '+1 555 010 0101',
    preferredContact: 'email',
  };
}

const roomDetailsSchema = z.object({
  roomDetails: z
    .array(
      z.object({
        equipementRoom: z.boolean(),
        equipementListRoom: z.string().min(10, 'Equipment list must be at least 10 characters').optional(),
      }),
    )
    .min(1, 'Vous devez ajouter au moins une pièce')
    .max(20, 'Vous ne pouvez pas ajouter plus de 20 pièces')
    .optional(),
});

type RoomDetailsFormValues = z.infer<typeof roomDetailsSchema>;

interface RoomDetailsItem {
  readonly equipementRoom: boolean;
  readonly equipementListRoom: string;
}

function hasRoomEquipment(values: RoomDetailsFormValues | RoomDetailsItem): boolean {
  return 'equipementRoom' in values && values.equipementRoom === true;
}

const roomDetailsFields = [
  {
    name: 'roomDetails',
    type: 'array',
    label: 'Ajouter une pièce',
    arrayConfig: {
      itemType: 'object',
      itemLabel: 'Pièce',
      minItems: 1,
      maxItems: 20,
      defaultValue: { equipementRoom: false, equipementListRoom: '' },
      objectConfig: {
        columns: 2,
        layout: 'grid',
        fields: [
          {
            name: 'equipementRoom',
            type: 'switch',
            label: 'Équipement spécifique *',
          },
          {
            name: 'equipementListRoom',
            type: 'textarea',
            label: 'Liste des équipements',
            conditional: (values: RoomDetailsFormValues | RoomDetailsItem): boolean => hasRoomEquipment(values),
          },
        ],
      },
    },
  },
] as const;

test('form-level schema validation skips issues on conditionally hidden fields', () => {
  const validatorsWithFields = buildFormValidators<ConditionalPagesFormValues>(
    conditionalPagesSchema,
    undefined,
    conditionalPagesFields.map((field) => fieldConfig<ConditionalPagesFormValues>(field)),
  );
  const individualValues = conditionalPagesDefaults('individual');
  const runner = validatorsWithFields?.onChange as unknown as FormRunner<ConditionalPagesFormValues>;
  const individualResult = runner({ value: individualValues, formApi: fakeFormApi(individualValues) });

  assert.equal(individualResult, undefined);

  const businessValues = conditionalPagesDefaults('business');
  const businessResult = runner({ value: businessValues, formApi: fakeFormApi(businessValues) });

  assert.equal(businessResult, undefined);

  const validatorsWithoutFields = buildFormValidators<ConditionalPagesFormValues>(conditionalPagesSchema, undefined);
  const unfilteredRunner = validatorsWithoutFields?.onChange as unknown as FormRunner<ConditionalPagesFormValues>;

  assert.ok(unfilteredRunner, 'expected validators without visibility awareness');
  assert.notEqual(unfilteredRunner({ value: individualValues, formApi: fakeFormApi(individualValues) }), undefined);
});

test('form-level schema validation still enforces issues on visible fields', () => {
  const validators = buildFormValidators<ConditionalPagesFormValues>(
    conditionalPagesSchema,
    undefined,
    conditionalPagesFields.map((field) => fieldConfig<ConditionalPagesFormValues>(field)),
  );
  const invalidIndividualValues: ConditionalPagesFormValues = { ...conditionalPagesDefaults('individual'), email: '' };
  const runner = validators?.onChange as unknown as FormRunner<ConditionalPagesFormValues>;
  const result = runner({ value: invalidIndividualValues, formApi: fakeFormApi(invalidIndividualValues) });

  assert.equal(result?.fields.email, 'Valid email required');
  assert.equal(result?.fields.firstName, undefined);
});

test('conditional-pages example submits in individual and business default states', async () => {
  for (const applicationType of ['individual', 'business'] as const) {
    const submitted: ConditionalPagesFormValues[] = [];

    function ConditionalPagesExample() {
      const { Form } = useFormedible<ConditionalPagesFormValues>({
        schema: conditionalPagesSchema,
        fields: [...conditionalPagesFields],
        pages: [...conditionalPagesPages],
        formOptions: {
          defaultValues: conditionalPagesDefaults(applicationType),
          onSubmit: ({ value }) => {
            submitted.push(value);
          },
        },
      });

      return <Form />;
    }

    const rendered = renderClient(<ConditionalPagesExample />);
    await act(async () => {
      await wait(0);
    });

    await act(async () => {
      rendered.document.querySelector('form')?.requestSubmit();
      await wait(20);
    });

    assert.equal(submitted.length, 1, `expected the ${applicationType} default state to submit`);
    assert.equal(submitted[0]?.applicationType, applicationType);
    rendered.unmount();
  }
});

test('conditional-in-obj example submits in its default state and blocks when the nested field is visible and invalid', async () => {
  const submitted: RoomDetailsFormValues[] = [];

  function RoomDetailsExample({ defaultItem }: { defaultItem: RoomDetailsItem }) {
    const { Form } = useFormedible<RoomDetailsFormValues>({
      schema: roomDetailsSchema,
      fields: [...roomDetailsFields],
      formOptions: {
        defaultValues: { roomDetails: [defaultItem] },
        onSubmit: ({ value }) => {
          submitted.push(value);
        },
      },
    });

    return <Form />;
  }

  const hiddenByDefault = renderClient(<RoomDetailsExample defaultItem={{ equipementRoom: false, equipementListRoom: '' }} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    hiddenByDefault.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'expected the default state (equipementRoom=false) to submit');
  hiddenByDefault.unmount();

  const visibleInvalid = renderClient(<RoomDetailsExample defaultItem={{ equipementRoom: true, equipementListRoom: 'courte' }} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    visibleInvalid.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'expected the visible invalid nested field to block submit');
  visibleInvalid.unmount();
});

test('hidden required field issues do not block submit while visible ones do', async () => {
  const hiddenSchema = z.object({
    show: z.boolean(),
    secret: z.string().min(1, 'Secret is required').optional(),
  });

  type HiddenValues = z.infer<typeof hiddenSchema>;

  const submitted: HiddenValues[] = [];

  function HiddenExample({ show }: { show: boolean }) {
    const { Form } = useFormedible<HiddenValues>({
      schema: hiddenSchema,
      fields: [
        { name: 'show', type: 'checkbox', label: 'Show secret' },
        {
          name: 'secret',
          type: 'text',
          label: 'Secret',
          conditional: (values: HiddenValues) => values.show === true,
          required: true,
        },
      ],
      formOptions: {
        defaultValues: { show, secret: '' },
        onSubmit: ({ value }) => {
          submitted.push(value);
        },
      },
    });

    return <Form />;
  }

  const hiddenRendered = renderClient(<HiddenExample show={false} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    hiddenRendered.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'hidden required field must not block submit');
  hiddenRendered.unmount();

  const visibleRendered = renderClient(<HiddenExample show={true} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    visibleRendered.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'visible required field must block submit');
  assert.match(visibleRendered.document.body.textContent ?? '', /Secret is required/);
  visibleRendered.unmount();
});

interface PageOnlyVisibilityValues extends FormedibleFormValues {
  readonly showDetails: boolean;
  readonly summary: string;
  readonly details: string;
}

test('required field on a page hidden via pages[].conditional only does not block submit, and blocks once the page is visible', async () => {
  const submitted: PageOnlyVisibilityValues[] = [];

  function PageOnlyExample({ showDetails }: { readonly showDetails: boolean }) {
    const { Form } = useFormedible<PageOnlyVisibilityValues>({
      fields: [
        { name: 'showDetails', type: 'checkbox', label: 'Show details', page: 1 },
        { name: 'summary', type: 'text', label: 'Summary', required: true, page: 1 },
        { name: 'details', type: 'text', label: 'Details', required: true, page: 2 },
      ],
      pages: [
        { page: 1, title: 'Base' },
        { page: 2, title: 'Details', conditional: (values) => values.showDetails === true },
      ],
      formOptions: {
        defaultValues: { showDetails, summary: 'Filled in', details: '' },
        onSubmit: ({ value }) => {
          submitted.push(value);
        },
      },
    });

    return <Form />;
  }

  const hiddenPage = renderClient(<PageOnlyExample showDetails={false} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    hiddenPage.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'required field on a page hidden only through pages[].conditional must not block submit');
  hiddenPage.unmount();

  const visiblePage = renderClient(<PageOnlyExample showDetails={true} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    visiblePage.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'the required field must block submit once its page becomes visible');
  assert.match(visiblePage.document.body.textContent ?? '', /Details is required/);
  visiblePage.unmount();
});

interface TabOnlyVisibilityValues extends FormedibleFormValues {
  readonly showAdvanced: boolean;
  readonly name: string;
  readonly reference: string;
}

test('required field on a tab hidden via tabs[].conditional only does not block submit, and blocks once the tab is visible', async () => {
  const submitted: TabOnlyVisibilityValues[] = [];

  function TabOnlyExample({ showAdvanced }: { readonly showAdvanced: boolean }) {
    const { Form } = useFormedible<TabOnlyVisibilityValues>({
      fields: [
        { name: 'showAdvanced', type: 'checkbox', label: 'Show advanced', tab: 'basics' },
        { name: 'name', type: 'text', label: 'Name', required: true, tab: 'basics' },
        { name: 'reference', type: 'text', label: 'Reference', required: true, tab: 'advanced' },
      ],
      tabs: [
        { id: 'basics', label: 'Basics' },
        { id: 'advanced', label: 'Advanced', conditional: (values) => values.showAdvanced === true },
      ],
      formOptions: {
        defaultValues: { showAdvanced, name: 'Ada', reference: '' },
        onSubmit: ({ value }) => {
          submitted.push(value);
        },
      },
    });

    return <Form />;
  }

  const hiddenTab = renderClient(<TabOnlyExample showAdvanced={false} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    hiddenTab.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'required field on a tab hidden only through tabs[].conditional must not block submit');
  hiddenTab.unmount();

  const visibleTab = renderClient(<TabOnlyExample showAdvanced={true} />);
  await act(async () => {
    await wait(0);
  });
  await act(async () => {
    visibleTab.document.querySelector('form')?.requestSubmit();
    await wait(20);
  });

  assert.equal(submitted.length, 1, 'the required field must block submit once its tab becomes visible');
  assert.match(visibleTab.document.body.textContent ?? '', /Reference is required/);
  visibleTab.unmount();
});

test('form and field schema validators filter issues through the page/tab visibility context', () => {
  const visibilitySchema = z.object({
    keep: z.string().min(1, 'Keep is required'),
    pageOnly: z.string().min(1, 'Page-only is required').optional(),
    tabOnly: z.string().min(1, 'Tab-only is required').optional(),
  });

  type VisibilityValues = z.infer<typeof visibilitySchema>;

  const pageFields = [
    fieldConfig<VisibilityValues>({ name: 'keep', page: 1 }),
    fieldConfig<VisibilityValues>({ name: 'pageOnly', page: 2 }),
  ];
  const pageVisibility: FormediblePageTabVisibility<VisibilityValues> = {
    pages: [
      { page: 1, title: 'Base' },
      { page: 2, title: 'Details', conditional: (values) => values.keep === 'show-page' },
    ],
  };
  const hiddenPageValues: VisibilityValues = { keep: 'hidden', pageOnly: '' };
  const shownPageValues: VisibilityValues = { keep: 'show-page', pageOnly: '' };

  assert.equal(isFieldPathVisible(pageFields, 'pageOnly', hiddenPageValues, pageVisibility), false);
  assert.equal(isFieldPathVisible(pageFields, 'pageOnly', shownPageValues, pageVisibility), true);
  assert.equal(isFieldPathVisible(pageFields, 'keep', hiddenPageValues, pageVisibility), true);

  const formValidators = buildFormValidators<VisibilityValues>(visibilitySchema, undefined, pageFields, pageVisibility);
  const formRunner = formValidators?.onChange as unknown as FormRunner<VisibilityValues>;

  assert.equal(formRunner({ value: hiddenPageValues, formApi: fakeFormApi(hiddenPageValues) }), undefined, 'hidden-page schema issues must be filtered');
  assert.equal(formRunner({ value: shownPageValues, formApi: fakeFormApi(shownPageValues) })?.fields.pageOnly, 'Page-only is required');

  const fieldValidators = buildFieldValidators<VisibilityValues, 'pageOnly'>(
    fieldConfig<VisibilityValues>({ name: 'pageOnly', page: 2 }),
    visibilitySchema,
    undefined,
    undefined,
    pageFields,
    pageVisibility,
  );
  const fieldRunner = fieldValidators.onSubmit as unknown as SyncRunner<VisibilityValues>;

  assert.equal(fieldRunner(context('', hiddenPageValues)), undefined);
  assert.equal(fieldRunner(context('', shownPageValues)), 'Page-only is required');

  const tabFields = [
    fieldConfig<VisibilityValues>({ name: 'keep', tab: 'basics' }),
    fieldConfig<VisibilityValues>({ name: 'tabOnly', tab: 'advanced' }),
  ];
  const tabVisibility: FormediblePageTabVisibility<VisibilityValues> = {
    tabs: [
      { id: 'basics', label: 'Basics' },
      { id: 'advanced', label: 'Advanced', conditional: (values) => values.keep === 'show-tab' },
    ],
  };
  const shownTabValues: VisibilityValues = { keep: 'show-tab', tabOnly: '' };

  assert.equal(isFieldPathVisible(tabFields, 'tabOnly', hiddenPageValues, tabVisibility), false);
  assert.equal(isFieldPathVisible(tabFields, 'tabOnly', shownTabValues, tabVisibility), true);
});

const asyncEmailSchema = z
  .object({
    email: z.string().email('Valid email required'),
  })
  .refine(async (values) => values.email !== 'taken@example.com', {
    path: ['email'],
    message: 'Email is already taken',
  });

interface AsyncValues extends FormedibleFormValues {
  readonly email: string;
}

type AsyncSchemaForm = ReturnType<typeof useFormedible<AsyncValues>>['form'];

test('async form schema does not throw on keystroke and surfaces issues through the async validator slot', async () => {
  const formCapture: { form?: AsyncSchemaForm } = {};

  function AsyncSchemaExample({ onReady }: { onReady: (form: AsyncSchemaForm) => void }) {
    const formedible = useFormedible<AsyncValues>({
      schema: asyncEmailSchema,
      fields: [{ name: 'email', type: 'email', label: 'Email' }],
      formOptions: {
        defaultValues: { email: '' },
        onSubmit: () => undefined,
      },
    });

    onReady(formedible.form);

    return <formedible.Form />;
  }

  const rendered = renderClient(<AsyncSchemaExample onReady={(form) => { formCapture.form = form; }} />);
  await act(async () => {
    await wait(0);
  });

  assert.ok(formCapture.form);

  await act(async () => {
    formCapture.form?.setFieldValue('email', 'taken@example.com');
    await wait(20);
  });

  assert.match(rendered.document.body.textContent ?? '', /Email is already taken/);

  const validators = buildFormValidators<AsyncValues>(asyncEmailSchema, undefined);
  const syncRunner = validators?.onChange as unknown as FormRunner<AsyncValues>;
  const takenValues: AsyncValues = { email: 'taken@example.com' };

  assert.equal(syncRunner({ value: takenValues, formApi: fakeFormApi(takenValues) }), undefined);

  const asyncRunner = validators?.onSubmitAsync as unknown as AsyncFormRunner<AsyncValues>;
  const asyncContext: FormedibleAsyncFormValidatorContext<AsyncValues> = {
    value: takenValues,
    formApi: fakeFormApi(takenValues),
    signal: new AbortController().signal,
  };

  assert.deepEqual((await asyncRunner(asyncContext))?.fields, { email: 'Email is already taken' });

  rendered.unmount();
});

test('async field-level schema validates through the async validator slot', async () => {
  const asyncFieldSchema = z.string().refine(async (value) => value !== 'reserved', 'Value is reserved');
  const validators = buildFieldValidators<AsyncValues, string>(
    fieldConfig<AsyncValues>({ name: 'email', type: 'text', validation: asyncFieldSchema }),
    undefined,
    undefined,
    undefined,
  );

  const onChange = validators.onChange as unknown as SyncRunner<AsyncValues>;
  const reservedValues: AsyncValues = { email: 'reserved' };

  assert.equal(onChange(context('reserved', reservedValues)), undefined);

  const onChangeAsync = validators.onChangeAsync as unknown as (contextInput: FormedibleValidatorContext<AsyncValues> & { signal: AbortSignal }) => Promise<string | undefined>;

  assert.equal(await onChangeAsync({ ...context('reserved', reservedValues), signal: new AbortController().signal }), 'Value is reserved');
  assert.equal(await onChangeAsync({ ...context('available', reservedValues), signal: new AbortController().signal }), undefined);
});

test('required checkbox and switch fail on false and the message falls back to the field name for JSX labels', () => {
  const consentValidators = buildFieldValidators<FormedibleFormValues, string>(
    fieldConfig({ name: 'consent', type: 'checkbox', label: 'Consent', required: true }),
    undefined,
    undefined,
    undefined,
  );
  const consentOnSubmit = consentValidators.onSubmit as unknown as SyncRunner<FormedibleFormValues>;
  const consentValues: FormedibleFormValues = { consent: false };

  assert.equal(consentOnSubmit(context(false, consentValues)), 'Consent is required');
  assert.equal(consentOnSubmit(context(true, consentValues)), undefined);

  const switchValidators = buildFieldValidators<FormedibleFormValues, string>(
    fieldConfig({ name: 'consent', type: 'switch', label: 'Consent', required: true }),
    undefined,
    undefined,
    undefined,
  );
  const switchOnSubmit = switchValidators.onSubmit as unknown as SyncRunner<FormedibleFormValues>;

  assert.equal(switchOnSubmit(context(false, consentValues)), 'Consent is required');

  const jsxLabelValidators = buildFieldValidators<FormedibleFormValues, string>(
    fieldConfig({ name: 'consent', type: 'checkbox', label: <span>Consent</span>, required: true }),
    undefined,
    undefined,
    undefined,
  );
  const jsxLabelOnSubmit = jsxLabelValidators.onSubmit as unknown as SyncRunner<FormedibleFormValues>;

  assert.equal(jsxLabelOnSubmit(context(false, consentValues)), 'consent is required');
  assert.doesNotMatch(jsxLabelOnSubmit(context(false, consentValues)) ?? '', /object Object/);
});

test('isFieldPathVisible resolves item-local conditionals for nested array object paths', () => {
  const fields = roomDetailsFields.map((field) => fieldConfig<RoomDetailsFormValues>(field));
  const hiddenValues: RoomDetailsFormValues = {
    roomDetails: [{ equipementRoom: false, equipementListRoom: '' }],
  };
  const visibleValues: RoomDetailsFormValues = {
    roomDetails: [{ equipementRoom: true, equipementListRoom: '' }],
  };

  assert.equal(isFieldPathVisible(fields, 'roomDetails[0].equipementListRoom', hiddenValues), false);
  assert.equal(isFieldPathVisible(fields, 'roomDetails[0].equipementListRoom', visibleValues), true);
  assert.equal(isFieldPathVisible(fields, 'roomDetails[0].equipementRoom', hiddenValues), true);
  assert.equal(isFieldPathVisible(fields, 'roomDetails', hiddenValues), true);
  assert.equal(isFieldPathVisible(fields, 'unconfigured', hiddenValues), true);
});

test('schema parsing is memoized per values snapshot across validators', () => {
  const values: AsyncValues = { email: 'not-an-email' };
  const counting = countingFormApi(values);
  const schema = z.object({ email: z.string().email('Valid email required') });
  const formValidators = buildFormValidators<AsyncValues>(schema, undefined, [fieldConfig<AsyncValues>({ name: 'email', type: 'text' })]);
  const formRunner = formValidators?.onChange as unknown as FormRunner<AsyncValues>;

  assert.ok(formRunner({ value: values, formApi: counting.api })?.fields.email);
  assert.equal(counting.syncParseCount, 1);

  const fieldValidators = buildFieldValidators<AsyncValues, string>(
    fieldConfig<AsyncValues>({ name: 'email', type: 'text' }),
    schema,
    undefined,
    undefined,
    [fieldConfig<AsyncValues>({ name: 'email', type: 'text' })],
  );
  const fieldRunner = fieldValidators.onChange as unknown as SyncRunner<AsyncValues>;
  const fieldContext: FormedibleValidatorContext<AsyncValues> = { value: values.email, fieldApi: { form: counting.api } };

  assert.equal(fieldRunner(fieldContext), 'Valid email required');
  assert.equal(fieldRunner(fieldContext), 'Valid email required');
  assert.equal(formRunner({ value: values, formApi: counting.api })?.fields.email, 'Valid email required');
  assert.equal(counting.syncParseCount, 1, 'expected one schema parse per values object');
});
