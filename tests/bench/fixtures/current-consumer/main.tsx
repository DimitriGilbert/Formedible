import { createElement, Fragment, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

import { createAiStreamScheduler } from '@ai-src/lib/formedible/ai-stream-scheduler';
import type { AiStreamEvent } from '@ai-src/lib/formedible/ai-types';
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
  createMemoryFormScenario,
  createPagedFormScenario,
  createStreamChunkEvents,
  createStreamTranscriptText,
  createSubmitSchema,
  createTabbedFormScenario,
  createTextHeavyFields,
  createValidValues,
} from '@bench-scenarios';
import type { BenchArrayOp, BenchField, BenchMemoryOp, BenchStreamChunkEvent } from '../../lib/adapter-types';
import type {
  BenchHarnessGlobal,
  HarnessArrayOpResult,
  HarnessHeapSnapshot,
  HarnessKeystrokeResult,
  HarnessLoopOptions,
  HarnessMemoryRunResult,
  HarnessMountResult,
  HarnessStatus,
  HarnessStreamLoop,
  HarnessStreamRunResult,
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
const STREAM_SCENARIO_ID = 'stream';
const STREAM_EXPECTED_TEXT = createStreamTranscriptText();

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

function createMemoryScenario(): ScenarioSpec {
  const scenario = createMemoryFormScenario();

  return {
    options: {
      fields: scenario.fields.map((field) => toFieldConfig(field)),
      pages: scenario.pages.map((page) => ({ page: page.page, title: page.title, description: page.description })),
      formOptions: { defaultValues: { ...scenario.defaultValues } },
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

  if (scenario === 'memory') {
    return createMemoryScenario();
  }

  throw new Error(
    `Unknown benchmark scenario "${scenario}". Use ?scenario=<mount|typing|submit>-<N> | paged | tabbed | array | persistent | memory | stream.`,
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

/** Settles a freshly rendered tree on its first commit (mount scenarios). */
function CommitProbe({ onCommit }: { readonly onCommit: () => void }) {
  useEffect(() => {
    onCommit();
  }, []);

  return null;
}

/** Renders a fresh tree and resolves when its commit has settled. */
function mountElement(element: ReactElement, containerId?: string): Promise<MountedTree> {
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

    const start = performance.now();
    const timeout = window.setTimeout(
      () => {
        settle(new Error(`The scenario form did not commit within ${OPERATION_TIMEOUT_MS}ms.`));
      },
      OPERATION_TIMEOUT_MS,
    );

    root.render(
      createElement(Fragment, null, element, createElement(CommitProbe, { onCommit: () => settle() })),
    );
  });
}

/** Renders a fresh scenario form (mount scenarios and the startup tree). */
function mountTree(
  options: UseFormedibleOptions<FormedibleFormValues>,
  containerId?: string,
): Promise<MountedTree> {
  return mountElement(createElement(BenchForm, { options }), containerId);
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

/**
 * Streaming benchmark section (`stream-100chunks`, current-only).
 *
 * The REAL `AiStreamScheduler` (default frame ticking, the exact configuration
 * `ChatInterface` uses in production) drives a MINIMAL transcript component:
 * each flush appends its text delta and commits, mirroring the essential
 * `scheduler flush → state update → transcript commit` path of the chat
 * interface without its UI-kit chrome (scroll area, textarea, buttons) — those
 * would measure the wrong tree and bloat the fixture bundle.
 *
 * The loop feeds one chunk per scheduler frame tick: every chunk's commit is
 * awaited before the next is enqueued, so flushes can never coalesce, exactly
 * one commit is attributable to each flush, and the pacing is the scheduler's
 * own ~16ms tick. Commits are counted by an in-page commit-counting hook (a
 * `useEffect` with no dependency array inside the transcript tree fires once
 * per React commit) — chosen over react-devtools render counting because it
 * counts exactly the transcript subtree's commits with zero instrumentation
 * overhead, keeping `flush-ms-total` uncontaminated (risk #7).
 */

interface StreamRunState {
  text: string;
  commits: number;
  flushCount: number;
  flushLatenciesMs: number[];
  pendingFlushStart: number | undefined;
  waiter: { readonly timeoutId: number; readonly settle: () => void } | undefined;
}

function createStreamController() {
  const state: StreamRunState = {
    text: '',
    commits: 0,
    flushCount: 0,
    flushLatenciesMs: [],
    pendingFlushStart: undefined,
    waiter: undefined,
  };
  let setText: ((next: string) => void) | undefined;

  const scheduler = createAiStreamScheduler((flush) => {
    state.flushCount += 1;
    state.text += flush.textDelta;
    state.pendingFlushStart = performance.now();
    setText?.(state.text);
  });

  return {
    bind(nextSetText: ((next: string) => void) | undefined): void {
      setText = nextSetText;
    },
    /** Commit-counting hook callback: fires once per React commit of the transcript. */
    noteCommit(): void {
      state.commits += 1;

      if (state.pendingFlushStart === undefined) {
        return;
      }

      state.flushLatenciesMs.push(performance.now() - state.pendingFlushStart);
      state.pendingFlushStart = undefined;

      const waiter = state.waiter;

      if (waiter !== undefined) {
        state.waiter = undefined;
        window.clearTimeout(waiter.timeoutId);
        waiter.settle();
      }
    },
    /** Clears the transcript and waits for the reset commit before counters zero. */
    async reset(): Promise<void> {
      state.text = '';
      setText?.('');
      await nextFrame();
      await nextFrame();
      state.commits = 0;
      state.flushCount = 0;
      state.flushLatenciesMs = [];
      state.pendingFlushStart = undefined;
    },
    /** Enqueues one chunk and resolves once its flush has COMMITTED in React. */
    feedChunk(chunk: BenchStreamChunkEvent): Promise<void> {
      const event: AiStreamEvent = { type: 'text-delta', delta: chunk.delta, receivedAt: chunk.receivedAt };

      return new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          state.waiter = undefined;
          reject(new Error(`A streamed chunk did not flush and commit within ${OPERATION_TIMEOUT_MS}ms.`));
        }, OPERATION_TIMEOUT_MS);

        state.waiter = {
          timeoutId,
          settle: () => {
            resolve();
          },
        };

        scheduler.enqueue(event);
      });
    },
    snapshot(chunkCount: number): HarnessStreamRunResult {
      return {
        flushMsTotal: state.flushLatenciesMs.reduce((total, latency) => total + latency, 0),
        commitCount: state.commits,
        flushCount: state.flushCount,
        chunkCount,
        finalText: state.text,
      };
    },
  };
}

type StreamController = ReturnType<typeof createStreamController>;

const streamController = createStreamController();

/** Minimal transcript: re-renders per flush; the effect counts every commit. */
function StreamTranscript({ text, onCommit }: { readonly text: string; readonly onCommit: () => void }) {
  useEffect(() => {
    onCommit();
  });

  return createElement('p', { 'data-bench-stream-text': true }, text);
}

function StreamBenchHost({ controller }: { readonly controller: StreamController }) {
  const [text, setText] = useState('');

  useEffect(() => {
    controller.bind(setText);

    return () => {
      controller.bind(undefined);
    };
  }, [controller]);

  return createElement(
    'div',
    { 'data-bench-stream-root': true },
    createElement(StreamTranscript, { text, onCommit: controller.noteCommit }),
  );
}

async function streamLoop(options: HarnessLoopOptions): Promise<HarnessStreamRunResult> {
  const chunks = createStreamChunkEvents();
  let last = streamController.snapshot(0);

  const runOnce = async (): Promise<HarnessStreamRunResult> => {
    await streamController.reset();

    for (const chunk of chunks) {
      await streamController.feedChunk(chunk);
    }

    const result = streamController.snapshot(chunks.length);

    if (result.flushCount !== chunks.length) {
      throw new Error(`The stream loop flushed ${result.flushCount} times for ${chunks.length} chunks (chunks coalesced).`);
    }

    if (result.commitCount !== result.flushCount) {
      throw new Error(
        `The stream loop committed ${result.commitCount} times for ${result.flushCount} flushes; every flush must commit the transcript exactly once.`,
      );
    }

    if (result.finalText !== STREAM_EXPECTED_TEXT) {
      throw new Error('The streamed transcript text drifted from the deterministic 100-chunk payload.');
    }

    return result;
  };

  for (let warmup = 0; warmup < options.warmupRuns; warmup += 1) {
    last = await runOnce();
  }

  for (let run = 0; run < options.measuredRuns; run += 1) {
    last = await runOnce();
  }

  return last;
}

const scenario = new URLSearchParams(window.location.search).get('scenario') ?? '';
const streamMode = scenario === STREAM_SCENARIO_ID;

let specOptions: UseFormedibleOptions<FormedibleFormValues> = {};
let scenarioError: string | undefined;

if (!streamMode) {
  try {
    specOptions = resolveScenario(scenario).options;
  } catch (error: unknown) {
    scenarioError = error instanceof Error ? error.message : String(error);
  }
}

let startupTree: MountedTree | undefined;
let startupError: string | undefined;

async function mountStartupTree(): Promise<void> {
  startupTree = streamMode
    ? await mountElement(createElement(StreamBenchHost, { controller: streamController }), BENCH_MOUNT_ID)
    : await mountTree(specOptions, BENCH_MOUNT_ID);
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

/**
 * Executes a deterministic op sequence `warmupRuns + measuredRuns` times and
 * returns one `performance.now()` sample per executed operation of every
 * MEASURED run (warmup passes are untimed).
 */
async function sequenceLoop(
  opCount: number,
  options: HarnessLoopOptions,
  runStep: (stepIndex: number) => Promise<number>,
): Promise<readonly number[]> {
  for (let warmupRun = 0; warmupRun < options.warmupRuns; warmupRun += 1) {
    for (let step = 0; step < opCount; step += 1) {
      await runStep(step);
    }
  }

  const samples: number[] = [];

  for (let run = 0; run < options.measuredRuns; run += 1) {
    for (let step = 0; step < opCount; step += 1) {
      samples.push(await runStep(step));
    }
  }

  return samples;
}

async function switchPageSequenceLoop(
  pageNumbers: readonly number[],
  options: HarnessLoopOptions,
): Promise<HarnessSwitchResult> {
  const setCurrentPage = requireCapturedHook().setCurrentPage;

  const samples = await sequenceLoop(pageNumbers.length, options, async (step) => {
    const pageNumber = pageNumbers[step];

    if (pageNumber === undefined) {
      throw new Error(`No page number for switch step ${step}.`);
    }

    const start = performance.now();

    setCurrentPage(pageNumber);
    await nextFrame();

    return performance.now() - start;
  });

  return { samples, activeIndex: requireCapturedHook().currentPage };
}

async function switchTabSequenceLoop(
  tabIndices: readonly number[],
  options: HarnessLoopOptions,
): Promise<HarnessSwitchResult> {
  const samples = await sequenceLoop(tabIndices.length, options, async (step) => {
    const tabIndex = tabIndices[step];

    if (tabIndex === undefined) {
      throw new Error(`No tab index for switch step ${step}.`);
    }

    const triggers = document.querySelectorAll<HTMLButtonElement>('[data-tabs-trigger="true"]');
    const trigger = triggers[tabIndex];

    if (!trigger) {
      throw new Error(`No rendered tab trigger for tab index ${tabIndex}.`);
    }

    const start = performance.now();

    trigger.click();
    await nextFrame();

    return performance.now() - start;
  });

  const activeTrigger = document.querySelector<HTMLButtonElement>('[data-tabs-trigger="true"][aria-selected="true"]');

  return {
    samples,
    activeIndex: activeTrigger === null ? -1 : [...document.querySelectorAll('[data-tabs-trigger="true"]')].indexOf(activeTrigger),
  };
}

function findArrayFieldRoot(fieldName: string): HTMLElement {
  const fieldRoot = document.querySelector<HTMLElement>(`[data-formedible-array-field="${fieldName}"]`);

  if (!fieldRoot) {
    throw new Error(`No rendered array field named "${fieldName}".`);
  }

  return fieldRoot;
}

function findArrayOpButton(fieldRoot: HTMLElement, op: BenchArrayOp): HTMLButtonElement {
  const buttons = [...fieldRoot.querySelectorAll<HTMLButtonElement>('button')];
  const button =
    op.op === 'add'
      ? buttons.find((candidate) => candidate.textContent?.startsWith('Add'))
      : buttons.filter((candidate) => candidate.getAttribute('aria-label')?.startsWith('Remove'))[op.itemIndex];

  if (!button) {
    throw new Error(
      op.op === 'add'
        ? 'The array field renders no add-item button.'
        : `The array field renders no remove button for item index ${op.itemIndex}.`,
    );
  }

  return button;
}

async function arraySequenceLoop(
  fieldName: string,
  ops: readonly BenchArrayOp[],
  options: HarnessLoopOptions,
): Promise<HarnessArrayOpResult> {
  const fieldRoot = findArrayFieldRoot(fieldName);

  const samples = await sequenceLoop(ops.length, options, async (step) => {
    const op = ops[step];

    if (!op) {
      throw new Error(`No array operation for step ${step}.`);
    }

    const button = findArrayOpButton(fieldRoot, op);
    const start = performance.now();

    button.click();
    await nextFrame();

    return performance.now() - start;
  });

  return { samples, itemCount: fieldRoot.querySelectorAll('[data-formedible-array-item]').length };
}

/**
 * Heap reader over the Chromium APIs the page can access. The isolated
 * `measureUserAgentSpecificMemory` path needs cross-origin isolation (COOP/COEP,
 * which `vite preview` does not set), so in practice the legacy
 * `performance.memory` counter serves; whichever API answers is reported to the
 * runner as an artifact note. No forced GC is assumed anywhere.
 */
function resolveHeapReader(): { readonly apiName: string; read(): Promise<number> } {
  const extendedPerformance = performance as Performance & {
    memory?: { readonly usedJSHeapSize?: number };
    measureUserAgentSpecificMemory?: () => Promise<{ readonly bytes: number }>;
  };

  if (crossOriginIsolated) {
    const measure = extendedPerformance.measureUserAgentSpecificMemory;

    if (typeof measure === 'function') {
      const boundMeasure = measure.bind(extendedPerformance);

      return {
        apiName: 'performance.measureUserAgentSpecificMemory',
        read: async () => (await boundMeasure()).bytes / 1_048_576,
      };
    }
  }

  const memory = extendedPerformance.memory;

  if (memory !== undefined && typeof memory.usedJSHeapSize === 'number') {
    return {
      apiName: 'performance.memory.usedJSHeapSize',
      read: async () => (memory.usedJSHeapSize ?? 0) / 1_048_576,
    };
  }

  throw new Error(
    'No Chromium heap API is available on this page (performance.memory missing and the page is not crossOriginIsolated for performance.measureUserAgentSpecificMemory).',
  );
}

/** Two frames of settle before every heap checkpoint (no forced GC assumption). */
async function heapSettle(): Promise<void> {
  await nextFrame();
  await nextFrame();
}

async function heapSnapshot(): Promise<HarnessHeapSnapshot> {
  const heap = resolveHeapReader();

  await heapSettle();

  return { apiName: heap.apiName, heapMb: await heap.read() };
}

async function memoryLoop(ops: readonly BenchMemoryOp[]): Promise<HarnessMemoryRunResult> {
  const setCurrentPage = requireCapturedHook().setCurrentPage;

  for (let index = 0; index < ops.length; index += 1) {
    const op = ops[index];

    if (!op) {
      throw new Error(`No memory operation at index ${index}.`);
    }

    if (op.op === 'type') {
      const control = requireControl(op.fieldName);

      for (let charCount = 1; charCount <= op.text.length; charCount += 1) {
        setNativeValue(control, op.text.slice(0, charCount));
        dispatchInput(control);
      }
    } else if (op.op === 'switchPage') {
      setCurrentPage(op.pageNumber);
    } else {
      const fieldRoot = findArrayFieldRoot(op.fieldName);
      const button =
        op.op === 'arrayAdd'
          ? findArrayOpButton(fieldRoot, { op: 'add' })
          : findArrayOpButton(fieldRoot, { op: 'remove', itemIndex: op.itemIndex });

      button.click();
    }

    await nextFrame();
  }

  return { opCount: ops.length };
}

const harness: BenchHarnessGlobal & HarnessStreamLoop = {
  status: (): HarnessStatus => ({
    ready: scenarioError === undefined && startupError === undefined && startupTree !== undefined,
    scenario,
    error: scenarioError ?? startupError,
  }),
  mountLoop,
  keystrokeLoop,
  submitLoop,
  switchPageSequenceLoop,
  switchTabSequenceLoop,
  arraySequenceLoop,
  memoryLoop,
  heapSnapshot,
  streamLoop,
};

const benchWindow = window as typeof window & { __benchHarness?: BenchHarnessGlobal & HarnessStreamLoop };

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
