import { z } from 'zod';

import type {
  BenchArrayOp,
  BenchField,
  BenchFieldOption,
  BenchMemoryOp,
  BenchPageConfig,
  BenchStreamChunkEvent,
  BenchTabConfig,
} from '../adapter-types';

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
export const ARRAY_ITEM_COUNT = 20;

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

/** Full passes over the 5-page form in `pageswitch-50` (5 switches each). */
export const PAGE_SWITCH_CYCLE_COUNT = 10;

/**
 * Deterministic 50-switch page sequence: from the initial page 1 the workload
 * walks `[2, 3, 4, 5, 1]` ten times. Every entry differs from the page the form
 * is on when it executes, so no switch is ever a same-page no-op (main's
 * validation-gated `setCurrentPage` early-returns on those, D12).
 */
export function createPageSwitchSequence(): readonly number[] {
  const sequence: number[] = [];

  for (let cycle = 0; cycle < PAGE_SWITCH_CYCLE_COUNT; cycle += 1) {
    for (let page = 2; page <= PAGE_COUNT; page += 1) {
      sequence.push(page);
    }

    sequence.push(1);
  }

  return sequence;
}

/** Full passes over the 4-tab form in `tabswitch-50` (4 switches each). */
export const TAB_SWITCH_CYCLE_COUNT = 10;

/**
 * Deterministic 40-switch tab sequence (0-based tab indices): from the initial
 * tab 0 the workload walks `[1, 2, 3, 0]` ten times, never re-activating the
 * tab that is already active.
 */
export function createTabSwitchSequence(): readonly number[] {
  const sequence: number[] = [];

  for (let cycle = 0; cycle < TAB_SWITCH_CYCLE_COUNT; cycle += 1) {
    for (let step = 1; step <= TAB_COUNT; step += 1) {
      sequence.push(step % TAB_COUNT);
    }
  }

  return sequence;
}

/** `add` operations in `array-50`. */
export const ARRAY_ADD_OP_COUNT = 20;
/** `remove` operations in `array-50`. */
export const ARRAY_REMOVE_OP_COUNT = 20;
/**
 * Fixed item index every `array-50` remove targets. The form starts with 20
 * items, the 20 adds take it to 40, and the length stays >= 21 throughout the
 * removals, so index 19 exists for every remove in both implementations.
 */
export const ARRAY_REMOVE_ITEM_INDEX = 19;

/** Deterministic `array-50` op sequence: 20 adds, then 20 removes of item 19. */
export function createArrayOpSequence(): readonly BenchArrayOp[] {
  const ops: BenchArrayOp[] = [];

  for (let add = 0; add < ARRAY_ADD_OP_COUNT; add += 1) {
    ops.push({ op: 'add' });
  }

  for (let remove = 0; remove < ARRAY_REMOVE_OP_COUNT; remove += 1) {
    ops.push({ op: 'remove', itemIndex: ARRAY_REMOVE_ITEM_INDEX });
  }

  return ops;
}

/** Total interactions in `memory-500`. */
export const MEMORY_INTERACTION_COUNT = 500;
/** Ops per memory cycle: 2 switches + 4 types + 2 adds + 2 removes. */
const MEMORY_CYCLE_OP_COUNT = 10;
/** Heap checkpoints are read every this many interactions (plus the baseline). */
export const MEMORY_CHECKPOINT_INTERVAL = 100;
/** Object items the memory form's array field starts with. */
const MEMORY_ARRAY_ITEM_COUNT = 5;
/** Fixed index every memory remove targets (always the just-added 6th item). */
const MEMORY_ARRAY_REMOVE_ITEM_INDEX = 5;

export interface MemoryFormScenario {
  readonly fields: readonly BenchField[];
  readonly pages: readonly BenchPageConfig[];
  readonly defaultValues: Readonly<Record<string, unknown>>;
}

/**
 * Memory-scenario form: the 50-field text-heavy field set spread over the same
 * five pages as the paged scenario, plus one object-item array field on page 1.
 * No `required` flags and no validation — main's page-navigation gate (D12)
 * reads field errors, and the workload must never trip it.
 */
export function createMemoryFormScenario(): MemoryFormScenario {
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

  fields.push({
    name: 'members',
    type: 'array',
    label: 'Team members',
    page: 1,
    arrayConfig: {
      itemType: 'object',
      minItems: 0,
      maxItems: 50,
      defaultValue: { name: '', email: '', role: 'alpha' },
      objectConfig: {
        layout: 'stack',
        fields: [
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'email', type: 'email', label: 'Email' },
          { name: 'role', type: 'select', label: 'Role', options: SELECT_OPTIONS },
        ],
      },
    },
  });

  const pages: BenchPageConfig[] = [];

  for (let page = 1; page <= PAGE_COUNT; page += 1) {
    pages.push({ page, title: `Step ${page}`, description: `Memory benchmark page ${page} of ${PAGE_COUNT}` });
  }

  const members = Array.from({ length: MEMORY_ARRAY_ITEM_COUNT }, (_unused, index) => ({
    name: `Member ${String(index + 1).padStart(2, '0')}`,
    email: `member${String(index + 1).padStart(2, '0')}@example.com`,
    role: SELECT_OPTIONS[index % SELECT_OPTIONS.length]?.value ?? 'alpha',
  }));

  return {
    fields,
    pages,
    defaultValues: { ...createDefaultValues(fields.filter((field) => field.type !== 'array')), members },
  };
}

function createMemoryTypingText(opOrdinal: number): string {
  return `tick-${String(opOrdinal).padStart(5, '0')}`;
}

/**
 * Field types the memory workload types into: every one renders a native
 * `[name]` input/textarea control in BOTH implementations (selects render
 * trigger buttons without `[name]`, and number inputs reject the text payload,
 * so both are excluded as typing targets).
 */
const MEMORY_TYPABLE_TYPES: readonly string[] = ['text', 'email', 'password', 'textarea'];

/**
 * Deterministic 500-interaction memory workload: 50 cycles of 10 ops each.
 * Every cycle switches to a rotating away page (2..5), types into that page's
 * first two typable fields, switches back to page 1 (where the array field
 * lives), types into page 1's first two typable fields, then adds and removes
 * an array item twice. Adds are always paired with removes so the live form
 * state returns to its baseline every cycle — heap growth therefore measures
 * RETAINED memory (leaks), not growing user data.
 */
export function createMemoryWorkload(): readonly BenchMemoryOp[] {
  const scenario = createMemoryFormScenario();
  const textFieldsByPage = new Map<number, string[]>();

  for (const field of scenario.fields) {
    if (!MEMORY_TYPABLE_TYPES.includes(field.type)) {
      continue;
    }

    const page = field.page ?? 1;
    const names = textFieldsByPage.get(page) ?? [];

    names.push(field.name);
    textFieldsByPage.set(page, names);
  }

  const ops: BenchMemoryOp[] = [];
  let opOrdinal = 0;

  const typeInto = (page: number, fieldSlot: number): void => {
    const fieldName = (textFieldsByPage.get(page) ?? [])[fieldSlot];

    if (fieldName === undefined) {
      throw new Error(`The memory form has no field ${fieldSlot} on page ${page}.`);
    }

    ops.push({ op: 'type', fieldName, text: createMemoryTypingText(opOrdinal) });
    opOrdinal += 1;
  };

  for (let cycle = 0; cycle < MEMORY_INTERACTION_COUNT / MEMORY_CYCLE_OP_COUNT; cycle += 1) {
    const awayPage = (cycle % (PAGE_COUNT - 1)) + 2;

    ops.push({ op: 'switchPage', pageNumber: awayPage });
    typeInto(awayPage, 0);
    typeInto(awayPage, 1);
    ops.push({ op: 'switchPage', pageNumber: 1 });
    typeInto(1, 0);
    typeInto(1, 1);
    ops.push({ op: 'arrayAdd', fieldName: 'members' });
    ops.push({ op: 'arrayRemove', fieldName: 'members', itemIndex: MEMORY_ARRAY_REMOVE_ITEM_INDEX });
    ops.push({ op: 'arrayAdd', fieldName: 'members' });
    ops.push({ op: 'arrayRemove', fieldName: 'members', itemIndex: MEMORY_ARRAY_REMOVE_ITEM_INDEX });
  }

  if (ops.length !== MEMORY_INTERACTION_COUNT) {
    throw new Error(`The memory workload generated ${ops.length} interactions, expected ${MEMORY_INTERACTION_COUNT}.`);
  }

  return ops;
}

/** Parses per measured run for the parser throughput scenarios. */
export const PARSER_RUN_PARSE_COUNT = 50;

/** Field count of the small parser config (`parser-small`). */
export const SMALL_PARSER_FIELD_COUNT = 5;
/** Field count of the medium parser config (`parser-medium`). */
export const MEDIUM_PARSER_FIELD_COUNT = 25;
/** Field count of the large parser config (`parser-large`). */
export const LARGE_PARSER_FIELD_COUNT = 100;

function createParserConfig(fieldCount: number, title: string, description: string): string {
  const fields = createTextHeavyFields(fieldCount);
  const pageCount = Math.ceil(fieldCount / 10);
  const pages: BenchPageConfig[] = [];

  for (let page = 1; page <= pageCount; page += 1) {
    pages.push({ page, title: `Part ${page}`, description: `Fields ${(page - 1) * 10 + 1}..${Math.min(page * 10, fieldCount)}` });
  }

  const config = {
    title,
    description,
    fields: fields.map((field, index) => ({
      ...field,
      page: Math.floor(index / 10) + 1,
    })),
    pages,
    formOptions: { defaultValues: createDefaultValues(fields) },
  };

  return JSON.stringify(config);
}

/** Small (5-field) config serialized to JSON for the parser scenarios. */
export function createSmallParserConfig(): string {
  return createParserConfig(
    SMALL_PARSER_FIELD_COUNT,
    'Benchmark small form',
    'Deterministic 5-field config for parser throughput scenarios',
  );
}

/** Medium (25-field) config serialized to JSON for the parser scenarios. */
export function createMediumParserConfig(): string {
  return createParserConfig(
    MEDIUM_PARSER_FIELD_COUNT,
    'Benchmark medium form',
    'Deterministic 25-field config for parser throughput scenarios',
  );
}

/** Large (100-field) config serialized to JSON for the parser scenarios. */
export function createLargeParserConfig(): string {
  return createParserConfig(
    LARGE_PARSER_FIELD_COUNT,
    'Benchmark large form',
    'Deterministic 100-field config for parser throughput scenarios',
  );
}

/** Synthetic text-delta chunks fed through the scheduler in `stream-100chunks`. */
export const STREAM_CHUNK_COUNT = 100;

/** Simulated arrival spacing between streaming chunks (the scheduler's frame tick). */
export const STREAM_CHUNK_TICK_MS = 16;

const STREAM_CHUNK_WORDS = [
  'Streaming',
  'forms',
  'render',
  'from',
  'the',
  'scheduler',
  'flush',
  'into',
  'the',
  'transcript',
] as const satisfies readonly string[];

/** Deterministic 100-chunk text-delta workload (fixed seed words, index-stable). */
export function createStreamChunkEvents(): readonly BenchStreamChunkEvent[] {
  return Array.from({ length: STREAM_CHUNK_COUNT }, (_unused, index) => ({
    type: 'text-delta',
    delta: `${STREAM_CHUNK_WORDS[index % STREAM_CHUNK_WORDS.length] ?? 'chunk'}-${String(index + 1).padStart(3, '0')} `,
    receivedAt: index * STREAM_CHUNK_TICK_MS,
  }));
}

/** The transcript text the 100 chunks must accumulate to (stream verification). */
export function createStreamTranscriptText(): string {
  return createStreamChunkEvents()
    .map((event) => event.delta)
    .join('');
}

/**
 * Real keystrokes the instrumentation extras type (agent-browser
 * `keyboard type`): browser-driven input events, in contrast with the in-page
 * synthetic `input` dispatch loop of the `typing-*` scenarios.
 */
export const INSTRUMENTED_KEYSTROKE_COUNT = 50;

const INSTRUMENTED_TYPING_PATTERN = 'Formedible instrumented typing 0123456789 ';

/** Deterministic 50-character keyboard payload (one real keystroke per char). */
export function createInstrumentedTypingText(): string {
  return INSTRUMENTED_TYPING_PATTERN.repeat(3).slice(0, INSTRUMENTED_KEYSTROKE_COUNT);
}
