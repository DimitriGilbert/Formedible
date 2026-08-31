import { createElement, Fragment, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import type { z } from 'zod';

import { useFormedible } from 'formedible-bench-main-hook';
import type {
  MainFormValues,
  MainArrayConfig,
  MainFieldConfig,
  MainHookResult,
  MainUseFormedibleOptions,
  MainZodSchemaLike,
} from 'formedible-bench-main-hook';
import reactFormManifest from 'formedible-bench-main-react-form-manifest';
import reactManifest from 'formedible-bench-main-react-manifest';
import {
  createDefaultValues,
  createPagedFormScenario,
  createSubmitSchema,
  createTextHeavyFields,
  createValidValues,
} from '@bench-scenarios';
import type { BenchField } from '../../lib/adapter-types';
import type { BenchHarnessGlobal } from '../../lib/harness-protocol';
import type {
  HarnessKeystrokeResult,
  HarnessLoopOptions,
  HarnessMountResult,
  HarnessPersistenceResult,
  HarnessStatus,
  HarnessSubmitResult,
  HarnessSwitchResult,
} from '../../lib/harness-protocol';

/**
 * MAIN-baseline benchmark fixture (PERF-BENCHMARK-PLAN.md Phase 2, DECISION-6
 * revised): a minimal committed consumer app whose served page runs the
 * `main`-branch hook FROM THE BASELINE WORKTREE on main's own pinned
 * dependencies, against the SAME shared scenario generators
 * (`@bench-scenarios`) and the same `?scenario=` + `window.__benchHarness`
 * pattern as `current-consumer/` — the existing driver drives it unchanged.
 *
 * Main-vs-current API divergences are shimmed here with typed code (the
 * verified main shapes live in `main-hook-types.d.ts`): per-field zod
 * `validation` instead of the never-wired top-level `schema`,
 * validation-gated `setCurrentPage` (D12) driven with schema-valid values,
 * and `label[for]` field counting (main's selects render a radix trigger
 * without a `[name]` control).
 *
 * `window.__benchRuntimeVersions` reports the @tanstack/react-form and react
 * versions the page actually resolved (the worktree manifests, imported
 * through the same aliasing the hook's module graph uses) — `run-main.ts`
 * asserts them against the worktree's installed tree before measuring, which
 * is the DECISION-1 isolation proof for the browser medium.
 */

const BENCH_ROOT_ID = 'bench-root';
const BENCH_MOUNT_ID = 'bench-mount';
const FLAT_SCENARIO_PATTERN = /^(?:mount|typing|submit)-(\d+)$/;
const PERSISTENCE_KEY = 'formedible-bench-draft';
const OPERATION_TIMEOUT_MS = 15_000;

type CapturedHook = MainHookResult<MainFormValues>;

interface ScenarioSpec {
  readonly options: MainUseFormedibleOptions<MainFormValues>;
}

let capturedHook: CapturedHook | undefined;
let submitCount = 0;
const submitSettlers: Array<() => void> = [];

/**
 * Wraps a scenario zod schema as main's per-field `validation` shape. Main
 * never wires the top-level `schema` option into validation (its hook
 * destructures it away), so the submit scenarios distribute the schema across
 * per-field entries; the wrapper keeps the bridge type decoupled from the zod
 * instance types.
 */
function toFieldValidation(fieldSchema: z.ZodType): MainZodSchemaLike {
  return {
    safeParse: (value: unknown) => fieldSchema.safeParse(value),
  };
}

function toArrayConfig(config: NonNullable<BenchField['arrayConfig']>): MainArrayConfig {
  return {
    itemType: config.itemType ?? 'string',
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

function toFieldConfig(field: BenchField, validation?: z.ZodType): MainFieldConfig {
  return {
    name: field.name,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder,
    required: field.required,
    options: field.options?.map((option) => ({ value: option.value, label: option.label })),
    page: field.page,
    tab: field.tab,
    validation: validation === undefined ? undefined : toFieldValidation(validation),
    arrayConfig: field.arrayConfig ? toArrayConfig(field.arrayConfig) : undefined,
  };
}

function BenchForm({ options }: { readonly options: MainUseFormedibleOptions<MainFormValues> }) {
  const formedible = useFormedible<MainFormValues>(options);

  capturedHook = formedible;

  return createElement(formedible.Form);
}

function createFlatScenario(fieldCount: number, submit: boolean): ScenarioSpec {
  const fields = createTextHeavyFields(fieldCount);
  const values = submit ? createValidValues(fields) : createDefaultValues(fields);
  const submitSchema = submit ? createSubmitSchema(fields) : undefined;

  return {
    options: {
      fields: fields.map((field) =>
        toFieldConfig(field, submitSchema === undefined ? undefined : submitSchema.shape[field.name]),
      ),
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

  /**
   * D12 shim: main's `setCurrentPage` (= `setCurrentPageWithValidation`)
   * refuses forward navigation while any field on the crossed pages carries
   * errors, so the paged scenario mounts with schema-valid values (the
   * current fixture mounts with empty defaults — its navigation is ungated).
   */
  const validValues = createValidValues(scenario.fields);

  return {
    options: {
      fields: scenario.fields.map((field) => toFieldConfig(field)),
      pages: scenario.pages.map((page) => ({ page: page.page, title: page.title, description: page.description })),
      formOptions: { defaultValues: { ...validValues } },
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

  if (scenario === 'persistent') {
    return createPersistentScenario();
  }

  throw new Error(
    `Unknown benchmark scenario "${scenario}" for the main fixture. Use ?scenario=<mount|typing|submit>-<N> | paged | persistent.`,
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

/**
 * Main renders every labeled field inside a FieldWrapper whose Label carries
 * `htmlFor={name}`, but its selects are radix triggers with no `[name]`
 * control — distinct `label[for]` names are main's stable field count (the
 * current fixture counts `form [name]` instead).
 */
function countRenderedFields(scope: ParentNode): number {
  const names = new Set<string>();

  scope.querySelectorAll('form label[for]').forEach((label) => {
    const htmlFor = label.getAttribute('for');

    if (htmlFor !== null) {
      names.add(htmlFor);
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
  options: MainUseFormedibleOptions<MainFormValues>,
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

let specOptions: MainUseFormedibleOptions<MainFormValues> = {};
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

      /**
       * The sample is the validation + onSubmit round trip, captured where the
       * consumer onSubmit runs. Main's submit wrapper only RESETS the form and
       * tears down `isSubmitting` AFTER that promise resolves, and the browser
       * silently refuses `requestSubmit()` while the (first) submit button is
       * still disabled mid-lifecycle — so the loop's next submit waits one
       * frame plus one macrotask for main's lifecycle to settle. The wait is
       * OUTSIDE the timed sample (elapsed was captured above).
       */
      const elapsed = performance.now() - start;

      void nextFrame().then(() => {
        settleGap().then(() => {
          resolve(elapsed);
        });
      });
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
  /**
   * D11: main's `currentPage` is a 1-based index over VISIBLE pages; the
   * loop returns main's reading so the driver-side contract stays identical.
   */
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

async function persistenceSaveLoop(options: HarnessLoopOptions): Promise<HarnessPersistenceResult> {
  const hook = requireCapturedHook();
  const values = hook.form.state.values;

  const runOnce = (): number => {
    const start = performance.now();

    /**
     * Main's `saveToStorage` takes the values explicitly (the current hook
     * defaults them from the form state).
     */
    hook.saveToStorage(values);

    return performance.now() - start;
  };

  for (let run = 0; run < options.warmupRuns; run += 1) {
    runOnce();
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    samples.push(runOnce());
  }

  return { samples, storageKey: PERSISTENCE_KEY, stored: window.localStorage.getItem(PERSISTENCE_KEY) !== null };
}

/**
 * The operations this fixture serves today (the shared protocol surface the
 * existing driver calls): tab switches and array operations need main-side
 * DOM selector verification and land with the Phase 3.1 scenarios.
 */
type MainBenchHarness = Pick<
  BenchHarnessGlobal,
  'status' | 'mountLoop' | 'keystrokeLoop' | 'submitLoop' | 'switchPageLoop' | 'persistenceSaveLoop'
>;

function status(): HarnessStatus {
  return {
    ready: scenarioError === undefined && startupError === undefined && startupTree !== undefined,
    scenario,
    error: scenarioError ?? startupError,
  };
}

const harness: MainBenchHarness = {
  status,
  mountLoop,
  keystrokeLoop,
  submitLoop,
  switchPageLoop,
  persistenceSaveLoop,
};

const benchWindow = window as typeof window & {
  __benchHarness?: MainBenchHarness;
  __benchRuntimeVersions?: Readonly<Record<string, string>>;
};

benchWindow.__benchHarness = harness;
benchWindow.__benchRuntimeVersions = {
  '@tanstack/react-form': reactFormManifest.version,
  react: reactManifest.version,
};

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
