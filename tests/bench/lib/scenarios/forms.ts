import { z } from 'zod';

import type { BenchField, BenchFieldOption, BenchPageConfig, BenchTabConfig } from '../adapter-types';

/**
 * Deterministic, implementation-neutral form data for the benchmark
 * scenarios. Everything here is pure data or a pure generator: fixed field
 * names/labels derived from the seeded index, no randomness, no imports from
 * `packages/*`. The field set sticks to the lowest common denominator both
 * benchmarked implementations support (text, email, password, textarea,
 * number, select, checkbox, switch, radio, array, pages, zod submit).
 */

/** Type cycle for the text-heavy forms; index-seeded, so output is stable. */
const TEXT_HEAVY_TYPE_CYCLE = [
  'text',
  'email',
  'text',
  'password',
  'text',
  'textarea',
  'text',
  'number',
  'text',
  'select',
] as const satisfies readonly string[];

const SELECT_OPTIONS: readonly BenchFieldOption[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma' },
];

const PAGE_COUNT = 5;
const TAB_COUNT = 4;
const PAGE_FIELD_COUNT = 50;
const TAB_FIELD_COUNT = 50;
const ARRAY_ITEM_COUNT = 20;

function fieldId(index: number): string {
  return `field${String(index).padStart(3, '0')}`;
}

export function createTextHeavyFields(count: number): readonly BenchField[] {
  const fields: BenchField[] = [];

  for (let index = 1; index <= count; index += 1) {
    const type = TEXT_HEAVY_TYPE_CYCLE[(index - 1) % TEXT_HEAVY_TYPE_CYCLE.length] ?? 'text';

    fields.push({
      name: fieldId(index),
      type,
      label: `Field ${String(index).padStart(3, '0')}`,
      placeholder: `Enter ${fieldId(index)}`,
      required: true,
      ...(type === 'select' ? { options: SELECT_OPTIONS } : {}),
    });
  }

  return fields;
}

/** Deterministic empty-state defaults for the given fields (fresh mount). */
export function createDefaultValues(fields: readonly BenchField[]): Readonly<Record<string, unknown>> {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === 'number') {
      values[field.name] = 0;
    } else if (field.type === 'checkbox' || field.type === 'switch') {
      values[field.name] = false;
    } else if (field.type === 'select' || field.type === 'radio') {
      values[field.name] = field.options?.[0]?.value ?? '';
    } else {
      values[field.name] = '';
    }
  }

  return values;
}

/** Deterministic schema-valid values for the given fields (submit scenarios). */
export function createValidValues(fields: readonly BenchField[]): Readonly<Record<string, unknown>> {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === 'number') {
      values[field.name] = 7;
    } else if (field.type === 'checkbox' || field.type === 'switch') {
      values[field.name] = true;
    } else if (field.type === 'select' || field.type === 'radio') {
      values[field.name] = field.options?.[0]?.value ?? 'alpha';
    } else if (field.type === 'email') {
      values[field.name] = `${field.name}@example.com`;
    } else if (field.type === 'password') {
      values[field.name] = `secret-${field.name}`;
    } else {
      values[field.name] = `value-${field.name}`;
    }
  }

  return values;
}

/** Paired zod schema over the text-heavy field set (submit scenarios). */
export function createSubmitSchema(fields: readonly BenchField[]): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    if (field.type === 'email') {
      shape[field.name] = z.email('Enter a valid email address');
    } else if (field.type === 'number') {
      shape[field.name] = z.number().min(0);
    } else if (field.type === 'select') {
      shape[field.name] = z.enum(['alpha', 'beta', 'gamma']);
    } else if (field.type === 'password') {
      shape[field.name] = z.string().min(8, 'Password must be at least 8 characters');
    } else {
      shape[field.name] = z.string().min(1, 'This field is required');
    }
  }

  return z.object(shape);
}

export interface PagedFormScenario {
  readonly fields: readonly BenchField[];
  readonly pages: readonly BenchPageConfig[];
  readonly defaultValues: Readonly<Record<string, unknown>>;
}

/** Five-page, 50-field form (all pages valid, no conditionals). */
export function createPagedFormScenario(): PagedFormScenario {
  const fields: BenchField[] = [];

  for (let index = 1; index <= PAGE_FIELD_COUNT; index += 1) {
    const type = TEXT_HEAVY_TYPE_CYCLE[(index - 1) % TEXT_HEAVY_TYPE_CYCLE.length] ?? 'text';
    const page = ((index - 1) % PAGE_COUNT) + 1;

    fields.push({
      name: fieldId(index),
      type,
      label: `Field ${String(index).padStart(3, '0')}`,
      page,
      ...(type === 'select' ? { options: SELECT_OPTIONS } : {}),
    });
  }

  const pages: BenchPageConfig[] = [];

  for (let page = 1; page <= PAGE_COUNT; page += 1) {
    pages.push({ page, title: `Step ${page}`, description: `Benchmark page ${page} of ${PAGE_COUNT}` });
  }

  return { fields, pages, defaultValues: createDefaultValues(fields) };
}

export interface TabbedFormScenario {
  readonly fields: readonly BenchField[];
  readonly tabs: readonly BenchTabConfig[];
  readonly defaultValues: Readonly<Record<string, unknown>>;
}

/** Four-tab, 50-field form (no conditionals). */
export function createTabbedFormScenario(): TabbedFormScenario {
  const fields: BenchField[] = [];

  for (let index = 1; index <= TAB_FIELD_COUNT; index += 1) {
    const type = TEXT_HEAVY_TYPE_CYCLE[(index - 1) % TEXT_HEAVY_TYPE_CYCLE.length] ?? 'text';
    const tabIndex = ((index - 1) % TAB_COUNT) + 1;

    fields.push({
      name: fieldId(index),
      type,
      label: `Field ${String(index).padStart(3, '0')}`,
      tab: `tab-${tabIndex}`,
      ...(type === 'select' ? { options: SELECT_OPTIONS } : {}),
    });
  }

  const tabs: BenchTabConfig[] = [];

  for (let tabIndex = 1; tabIndex <= TAB_COUNT; tabIndex += 1) {
    tabs.push({ id: `tab-${tabIndex}`, label: `Tab ${tabIndex}` });
  }

  return { fields, tabs, defaultValues: createDefaultValues(fields) };
}

export interface ArrayFieldFormScenario {
  readonly fields: readonly BenchField[];
  readonly defaultValues: Readonly<Record<string, unknown>>;
}

/**
 * Array-field form with object items: one `members` array field (three
 * sub-fields per item) plus two scalar fields, seeded with `itemCount`
 * deterministic object items.
 */
export function createArrayFieldFormScenario(itemCount: number = ARRAY_ITEM_COUNT): ArrayFieldFormScenario {
  const fields: readonly BenchField[] = [
    { name: 'projectName', type: 'text', label: 'Project name', required: true },
    { name: 'summary', type: 'textarea', label: 'Summary' },
    {
      name: 'members',
      type: 'array',
      label: 'Team members',
      arrayConfig: {
        itemType: 'object',
        minItems: 0,
        maxItems: 50,
        defaultValue: { name: '', email: '', role: 'alpha' },
        objectConfig: {
          layout: 'stack',
          fields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'email', type: 'email', label: 'Email' },
            { name: 'role', type: 'select', label: 'Role', options: SELECT_OPTIONS },
          ],
        },
      },
    },
  ];

  const members = Array.from({ length: itemCount }, (_unused, index) => ({
    name: `Member ${String(index + 1).padStart(2, '0')}`,
    email: `member${String(index + 1).padStart(2, '0')}@example.com`,
    role: SELECT_OPTIONS[index % SELECT_OPTIONS.length]?.value ?? 'alpha',
  }));

  return {
    fields,
    defaultValues: { projectName: 'Benchmark project', summary: '', members },
  };
}

/** Typing scenarios fire exactly this many synthetic input events per run. */
export const TYPING_EVENT_COUNT = 100;

const TYPING_TEXT_PATTERN = 'Formedible benchmark typing workload 0123456789 ';

/** Deterministic 100-character typing workload (one input event per char). */
export function createTypingText(): string {
  return TYPING_TEXT_PATTERN.repeat(3).slice(0, TYPING_EVENT_COUNT);
}

/** Parses per measured run for the parser throughput scenarios. */
export const PARSER_RUN_PARSE_COUNT = 50;

/** Medium (25-field) config serialized to JSON for the parser scenarios. */
export function createMediumParserConfig(): string {
  const fields = createTextHeavyFields(25);
  const pages: BenchPageConfig[] = [
    { page: 1, title: 'Identity', description: 'First ten fields' },
    { page: 2, title: 'Details', description: 'Next ten fields' },
    { page: 3, title: 'Review', description: 'Final fields' },
  ];
  const config = {
    title: 'Benchmark medium form',
    description: 'Deterministic 25-field config for parser throughput scenarios',
    fields: fields.map((field, index) => ({
      ...field,
      page: Math.floor(index / 10) + 1,
    })),
    pages,
    formOptions: { defaultValues: createDefaultValues(fields) },
  };

  return JSON.stringify(config);
}
