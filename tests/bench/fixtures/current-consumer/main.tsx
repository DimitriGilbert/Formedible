import { createElement, Fragment, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

import { useFormedible } from '@formedible-src/hooks/use-formedible';
import type {
  FormedibleArrayConfig,
  FormedibleFieldConfig,
  FormedibleFormValues,
  UseFormedibleOptions,
} from '@formedible-src/lib/formedible/types';
import {
  createArrayFieldFormScenario,
  createDefaultValues,
  createPagedFormScenario,
  createSubmitSchema,
  createTabbedFormScenario,
  createTextHeavyFields,
  createValidValues,
} from '@bench-scenarios';
import type { BenchField } from '../../lib/adapter-types';
import type {
  BenchHarnessGlobal,
  HarnessArrayOpResult,
  HarnessKeystrokeResult,
  HarnessLoopOptions,
  HarnessMountResult,
  HarnessPersistenceResult,
  HarnessStatus,
  HarnessSubmitResult,
  HarnessSwitchResult,
} from '../../lib/harness-protocol';

/**
 * Current-implementation benchmark fixture (PERF-BENCHMARK-PLAN.md Phase 1,
 * DECISION-2 revised): a minimal committed consumer app that renders REAL
 * formedible forms from LOCAL SOURCE (`@formedible-src` alias) using the SHARED
 * scenario generators — the fixture holds no form-config data of its own.
 *
 * The page mounts the form selected by `?scenario=<id>` and exposes
 * `window.__benchHarness`: an in-page surface the agent-browser driver calls to
 * run scenario operation loops with `performance.now()` sampling. Everything
 * crossing the boundary is JSON-serializable (protocol:
 * `tests/bench/lib/harness-protocol.ts`).
 */

const BENCH_ROOT_ID = 'bench-root';
const BENCH_MOUNT_ID = 'bench-mount';
const FLAT_SCENARIO_PATTERN = /^(?:mount|typing|submit)-(\d+)$/;
const PERSISTENCE_KEY = 'formedible-bench-draft';
const OPERATION_TIMEOUT_MS = 15_000;

type CapturedHook = ReturnType<typeof useFormedible<FormedibleFormValues>>;

interface ScenarioSpec {
  readonly options: UseFormedibleOptions<FormedibleFormValues>;
}

let capturedHook: CapturedHook | undefined;
let submitCount = 0;
const submitSettlers: Array<() => void> = [];

function toArrayConfig(config: NonNullable<BenchField['arrayConfig']>): FormedibleArrayConfig<FormedibleFormValues> {
  return {
    itemType: config.itemType as FormedibleArrayConfig<FormedibleFormValues>['itemType'],
    minItems: config.minItems,
    maxItems: config.maxItems,
    defaultValue: config.defaultValue,
    objectConfig: config.objectConfig
      ? {
          layout: config.objectConfig.layout,
          columns: config.objectConfig.columns,
          fields: config.objectConfig.fields.map((field) => toFieldConfig(field)),
        }
      : undefined,
  };
}

function toFieldConfig(field: BenchField): FormedibleFieldConfig<FormedibleFormValues> {
  return {
    name: field.name,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder,
    required: field.required,
    options: field.options?.map((option) => ({ value: option.value, label: option.label })),
    page: field.page,
    tab: field.tab,
    arrayConfig: field.arrayConfig ? toArrayConfig(field.arrayConfig) : undefined,
  };
}

function BenchForm({ options }: { readonly options: UseFormedibleOptions<FormedibleFormValues> }) {
  const formedible = useFormedible<FormedibleFormValues>(options);

  capturedHook = formedible;

  return createElement(formedible.Form);
}

function createFlatScenario(fieldCount: number, submit: boolean): ScenarioSpec {
  const fields = createTextHeavyFields(fieldCount);
  const values = submit ? createValidValues(fields) : createDefaultValues(fields);

  return {
    options: {
      fields: fields.map((field) => toFieldConfig(field)),
      schema: submit ? createSubmitSchema(fields) : undefined,
      // Submit scenarios time the zod validation + onSubmit round trip only,
      // so the post-submit reset stays out of the timed region.
      resetOnSubmitSuccess: submit ? false : undefined,
      formOptions: {
        defaultValues: { ...values },
        onSubmit: submit
          ? async () => {
              submitCount += 1;
              submitSettlers.splice(0).forEach((settle) => {
                settle();
              });
            }
          : undefined,
      },
    },
  };
}

function createPagedScenario(): ScenarioSpec {
  const scenario = createPagedFormScenario();

  return {
    options: {
      fields: scenario.fields.map((field) => toFieldConfig(field)),
      pages: scenario.pages.map((page) => ({ page: page.page, title: page.title, description: page.description })),
      formOptions: { defaultValues: { ...scenario.defaultValues } },
    },
  };
}

function createTabbedScenario(): ScenarioSpec {
  const scenario = createTabbedFormScenario();

  return {
    options: {
      fields: scenario.fields.map((field) => toFieldConfig(field)),
      tabs: scenario.tabs.map((tab) => ({ id: tab.id, label: tab.label })),
      formOptions: { defaultValues: { ...scenario.defaultValues } },
    },
  };
}

function createArrayScenario(): ScenarioSpec {
  const scenario = createArrayFieldFormScenario();

  return {
    options: {
      fields: scenario.fields.map((field) => toFieldConfig(field)),
      formOptions: { defaultValues: { ...scenario.defaultValues } },
    },
  };
}

function createPersistentScenario(): ScenarioSpec {
  const fields = createTextHeavyFields(50);

  return {
    options: {
      fields: fields.map((field) => toFieldConfig(field)),
      persistence: { key: PERSISTENCE_KEY, storage: 'localStorage', debounceMs: 0 },
      formOptions: { defaultValues: { ...createDefaultValues(fields) } },
    },
  };
}

function resolveScenario(scenario: string): ScenarioSpec {
  const flatMatch = FLAT_SCENARIO_PATTERN.exec(scenario);
  const fieldCount = flatMatch === null ? Number.NaN : Number.parseInt(flatMatch[1] ?? '', 10);

  if (flatMatch !== null && Number.isInteger(fieldCount) && fieldCount > 0) {
    return createFlatScenario(fieldCount, scenario.startsWith('submit-'));
  }

  if (scenario === 'paged') {
    return createPagedScenario();
  }

  if (scenario === 'tabbed') {
    return createTabbedScenario();
  }

  if (scenario === 'array') {
    return createArrayScenario();
  }

  if (scenario === 'persistent') {
    return createPersistentScenario();
  }

  throw new Error(
    `Unknown benchmark scenario "${scenario}". Use ?scenario=<mount|typing|submit>-<N> | paged | tabbed | array | persistent.`,
  );
}

function requireBenchRoot(): HTMLElement {
  const root = document.getElementById(BENCH_ROOT_ID);

  if (!root) {
    throw new Error(`The benchmark fixture document is missing #${BENCH_ROOT_ID}.`);
  }

  return root;
}

function requireCapturedHook(): CapturedHook {
  if (!capturedHook) {
    throw new Error('The benchmark form hook result was not captured during mount.');
  }

  return capturedHook;
}

function countRenderedFields(scope: ParentNode): number {
  const names = new Set<string>();

  scope.querySelectorAll('form [name]').forEach((control) => {
    const name = control.getAttribute('name');

    if (name !== null) {
      names.add(name);
    }
  });

  return names.size;
}

interface MountedTree {
  readonly elapsedMs: number;
  readonly renderedFieldCount: number;
  dispose(): void;
}

/** Renders a fresh scenario form and resolves when its commit has settled. */
function mountTree(
  options: UseFormedibleOptions<FormedibleFormValues>,
  containerId?: string,
): Promise<MountedTree> {
  return new Promise<MountedTree>((resolve, reject) => {
    const container = document.createElement('div');

    if (containerId !== undefined) {
      container.id = containerId;
    }

    requireBenchRoot().appendChild(container);

    const root: Root = createRoot(container);
    let settled = false;

    function settle(error?: Error): void {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeout);

      if (error) {
        root.unmount();
        container.remove();
        reject(error);

        return;
      }

      resolve({
        elapsedMs: performance.now() - start,
        renderedFieldCount: countRenderedFields(container),
        dispose: () => {
          root.unmount();
          container.remove();
        },
      });
    }

    function CommitProbe() {
      useEffect(() => {
        settle();
      }, []);

      return null;
    }

    const start = performance.now();
    const timeout = window.setTimeout(
      () => {
        settle(new Error(`The scenario form did not commit within ${OPERATION_TIMEOUT_MS}ms.`));
      },
      OPERATION_TIMEOUT_MS,
    );

    root.render(createElement(Fragment, null, createElement(BenchForm, { options }), createElement(CommitProbe)));
  });
}

/** Macrotask gap so React finishes cleanup between measured operations. */
function settleGap(): Promise<void> {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => {
      resolve();
    }, 0);
  });
}

/** One animation frame: pending React renders flush before the next paint. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

function requireControl(fieldName: string): HTMLInputElement | HTMLTextAreaElement {
  const control = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `input[name="${fieldName}"], textarea[name="${fieldName}"]`,
  );

  if (!control) {
    throw new Error(`No rendered input control is named "${fieldName}".`);
  }

  return control;
}

function setNativeValue(control: HTMLInputElement | HTMLTextAreaElement, nextValue: string): void {
  const prototype =
    control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (!valueSetter) {
    throw new Error('Unable to resolve the native value setter for the typing control.');
  }

  valueSetter.call(control, nextValue);
}

function dispatchInput(control: HTMLInputElement | HTMLTextAreaElement): void {
  control.dispatchEvent(new Event('input', { bubbles: true }));
}

const scenario = new URLSearchParams(window.location.search).get('scenario') ?? '';

let specOptions: UseFormedibleOptions<FormedibleFormValues> = {};
let scenarioError: string | undefined;

try {
  specOptions = resolveScenario(scenario).options;
} catch (error: unknown) {
  scenarioError = error instanceof Error ? error.message : String(error);
}

let startupTree: MountedTree | undefined;
let startupError: string | undefined;

async function mountStartupTree(): Promise<void> {
  startupTree = await mountTree(specOptions, BENCH_MOUNT_ID);
}

async function mountLoop(options: HarnessLoopOptions): Promise<HarnessMountResult> {
  startupTree?.dispose();
  startupTree = undefined;
  capturedHook = undefined;

  const samples: number[] = [];
  let renderedFieldCount = 0;

  const runOnce = async (): Promise<void> => {
    const tree = await mountTree(specOptions);

    renderedFieldCount = tree.renderedFieldCount;
    tree.dispose();
    await settleGap();
  };

  for (let run = 0; run < options.warmupRuns; run += 1) {
    await runOnce();
  }

  for (let run = 0; run < options.measuredRuns; run += 1) {
    const tree = await mountTree(specOptions);

    renderedFieldCount = tree.renderedFieldCount;
    samples.push(tree.elapsedMs);
    tree.dispose();

    if (run < options.measuredRuns - 1) {
      await settleGap();
    }
  }

  await mountStartupTree();

  return { samples, renderedFieldCount };
}

async function keystrokeLoop(
  fieldName: string,
  text: string,
  options: HarnessLoopOptions,
): Promise<HarnessKeystrokeResult> {
  const control = requireControl(fieldName);

  const runOnce = (): number => {
    setNativeValue(control, '');
    dispatchInput(control);

    const start = performance.now();

    for (let charCount = 1; charCount <= text.length; charCount += 1) {
      setNativeValue(control, text.slice(0, charCount));
      dispatchInput(control);
    }

    return performance.now() - start;
  };

  for (let run = 0; run < options.warmupRuns; run += 1) {
    runOnce();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    samples.push(runOnce());
  }

  return {
    samples,
    eventCount: text.length,
    finalInputValue: control.value,
    formValue: requireCapturedHook().form.state.values[fieldName],
  };
}

function submitOnce(): Promise<number> {
  const form = requireBenchRoot().querySelector('form');

  if (!form) {
    return Promise.reject(new Error('The mounted bench form renders no <form> element.'));
  }

  return new Promise<number>((resolve, reject) => {
    const start = performance.now();
    const timeout = window.setTimeout(() => {
      reject(new Error(`Submit did not reach onSubmit within ${OPERATION_TIMEOUT_MS}ms (validation failed?).`));
    }, OPERATION_TIMEOUT_MS);

    submitSettlers.push(() => {
      window.clearTimeout(timeout);
      resolve(performance.now() - start);
    });

    form.requestSubmit();
  });
}

async function submitLoop(options: HarnessLoopOptions): Promise<HarnessSubmitResult> {
  const expectedSubmitCount = options.warmupRuns + options.measuredRuns;
  const submitsBefore = submitCount;

  for (let run = 0; run < options.warmupRuns; run += 1) {
    await submitOnce();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    samples.push(await submitOnce());
  }

  return { samples, submitCount: submitCount - submitsBefore, expectedSubmitCount };
}

async function switchPageLoop(pageNumber: number, options: HarnessLoopOptions): Promise<HarnessSwitchResult> {
  const setCurrentPage = requireCapturedHook().setCurrentPage;

  const runOnce = async (): Promise<number> => {
    const start = performance.now();

    setCurrentPage(pageNumber);
    await nextFrame();

    return performance.now() - start;
  };

  for (let run = 0; run < options.warmupRuns; run += 1) {
    await runOnce();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    samples.push(await runOnce());
  }

  return { samples, activeIndex: requireCapturedHook().currentPage };
}

async function switchTabLoop(tabIndex: number, options: HarnessLoopOptions): Promise<HarnessSwitchResult> {
  const runOnce = async (): Promise<number> => {
    const triggers = document.querySelectorAll<HTMLButtonElement>('[data-tabs-trigger="true"]');
    const trigger = triggers[tabIndex];

    if (!trigger) {
      throw new Error(`No rendered tab trigger for tab index ${tabIndex}.`);
    }

    const start = performance.now();

    trigger.click();
    await nextFrame();

    return performance.now() - start;
  };

  for (let run = 0; run < options.warmupRuns; run += 1) {
    await runOnce();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    samples.push(await runOnce());
  }

  return { samples, activeIndex: tabIndex };
}

function findArrayFieldRoot(fieldName: string): HTMLElement {
  const fieldRoot = document.querySelector<HTMLElement>(`[data-formedible-array-field="${fieldName}"]`);

  if (!fieldRoot) {
    throw new Error(`No rendered array field named "${fieldName}".`);
  }

  return fieldRoot;
}

async function arrayOpLoop(
  operation: 'add' | 'remove',
  fieldName: string,
  itemIndex: number,
  options: HarnessLoopOptions,
): Promise<HarnessArrayOpResult> {
  const fieldRoot = findArrayFieldRoot(fieldName);

  const runOnce = async (): Promise<number> => {
    const buttons = [...fieldRoot.querySelectorAll<HTMLButtonElement>('button')];
    const button =
      operation === 'add'
        ? buttons.find((candidate) => candidate.textContent?.startsWith('Add'))
        : buttons.filter((candidate) => candidate.getAttribute('aria-label')?.startsWith('Remove'))[itemIndex];

    if (!button) {
      throw new Error(
        operation === 'add'
          ? `The array field "${fieldName}" renders no add-item button.`
          : `The array field "${fieldName}" renders no remove button for item index ${itemIndex}.`,
      );
    }

    const start = performance.now();

    button.click();
    await nextFrame();

    return performance.now() - start;
  };

  for (let run = 0; run < options.warmupRuns; run += 1) {
    await runOnce();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    samples.push(await runOnce());
  }

  return { samples, itemCount: fieldRoot.querySelectorAll('[data-formedible-array-item]').length };
}

async function persistenceSaveLoop(options: HarnessLoopOptions): Promise<HarnessPersistenceResult> {
  const saveToStorage = requireCapturedHook().saveToStorage;

  for (let run = 0; run < options.warmupRuns; run += 1) {
    saveToStorage();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    const start = performance.now();

    saveToStorage();
    samples.push(performance.now() - start);
  }

  return { samples, storageKey: PERSISTENCE_KEY, stored: window.localStorage.getItem(PERSISTENCE_KEY) !== null };
}

const harness: BenchHarnessGlobal = {
  status: (): HarnessStatus => ({
    ready: scenarioError === undefined && startupError === undefined && startupTree !== undefined,
    scenario,
    error: scenarioError ?? startupError,
  }),
  mountLoop,
  keystrokeLoop,
  submitLoop,
  switchPageLoop,
  switchTabLoop,
  arrayAddLoop: (fieldName: string, options: HarnessLoopOptions) => arrayOpLoop('add', fieldName, 0, options),
  arrayRemoveLoop: (fieldName: string, itemIndex: number, options: HarnessLoopOptions) =>
    arrayOpLoop('remove', fieldName, itemIndex, options),
  persistenceSaveLoop,
};

const benchWindow = window as typeof window & { __benchHarness?: BenchHarnessGlobal };

benchWindow.__benchHarness = harness;

if (scenarioError === undefined) {
  mountStartupTree().catch((error: unknown) => {
    startupError = error instanceof Error ? error.message : String(error);
  });
} else {
  const message = document.createElement('p');

  message.setAttribute('data-bench-error', 'true');
  message.textContent = scenarioError;
  requireBenchRoot().appendChild(message);
}
