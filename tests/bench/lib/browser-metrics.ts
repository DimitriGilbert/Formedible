import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { summarize } from './bench-timing';
import { INSTRUMENTED_KEYSTROKE_COUNT, createInstrumentedTypingText } from './scenarios/forms';
import type { BenchBrowserDriver } from '../utils/agent-browser';
import type { BrowserScenarioOutcome, ScenarioMetricStats } from './run-common';

/**
 * Browser-native instrumentation extras (current-only, PERF-BENCHMARK-PLAN.md
 * §3.2, DECISION-2 revised). These records are the INSTRUMENTED counterparts
 * of the timing scenarios: they run react-devtools render counting, the Chrome
 * DevTools profiler, and Core Web Vitals collection around the same fixture
 * pages the timing scenarios measure. Instrumentation perturbs what it
 * measures (plan risk #7), so every value produced here is a SEPARATE record —
 * the timing medians always come from the un-instrumented path, and these
 * notes say which tool produced which number.
 *
 * All interactions are REAL browser input driven through agent-browser's
 * keyboard path (`keyboard type`, CDP text insertion: beforeinput/textInput/
 * input dispatches — no synthetic in-page events), in deliberate contrast with
 * the typing-* scenarios' in-page `input` dispatch loops.
 */

const TYPING_FIELD_SELECTOR = 'input[name="field001"]';
const TYPING_VALUE_EXPRESSION = 'document.querySelector(\'input[name="field001"]\')?.value ?? ""';
const PROFILE_PATH = join(tmpdir(), 'formedible-bench-typing-trace.json');

/**
 * EventDispatch types that make up a real `keyboard type` interaction in a
 * Chrome DevTools trace (empirically: agent-browser's keyboard path produces
 * beforeinput/textInput/input plus selectionchange per keystroke; keydown/
 * keyup are accepted too in case the CLI changes transport).
 */
const KEYBOARD_DISPATCH_TYPES: ReadonlySet<string> = new Set([
  'keydown',
  'keyup',
  'keypress',
  'beforeinput',
  'textInput',
  'input',
  'selectionchange',
]);

interface TraceEvent {
  readonly ph?: string;
  readonly ts?: number;
  readonly dur?: number;
  readonly name?: string;
  readonly args?: { readonly data?: { readonly type?: string } };
}

interface TraceFile {
  readonly traceEvents?: readonly TraceEvent[];
}

/**
 * `browser-typing-50`: react-devtools render count for 50 real keystrokes on
 * the typing-50 page, plus a Chrome DevTools profiler trace around the same
 * interaction (re-driven on a fresh page so the recording window contains
 * exactly one 50-keystroke interaction).
 */
export async function executeTypingInstrumentationScenario(
  driver: BenchBrowserDriver,
): Promise<BrowserScenarioOutcome> {
  const typingText = createInstrumentedTypingText();

  if (typingText.length !== INSTRUMENTED_KEYSTROKE_COUNT) {
    throw new Error(`The instrumented typing payload is ${typingText.length} chars, expected ${INSTRUMENTED_KEYSTROKE_COUNT}.`);
  }

  await driver.openScenario('typing-50');
  await driver.focusSelector(TYPING_FIELD_SELECTOR);

  await driver.startRenderRecording();
  await driver.keyboardType(typingText);
  const renderProfile = await driver.stopRenderRecording();

  const typedValue = await driver.evaluate<string>(TYPING_VALUE_EXPRESSION);

  if (typedValue !== typingText) {
    throw new Error(
      `browser-typing-50: the keystrokes did not land; input value is "${typedValue.slice(0, 16)}...", expected "${typingText.slice(0, 16)}...".`,
    );
  }

  if (renderProfile.totalRenders <= 0) {
    throw new Error('browser-typing-50: react-devtools recorded zero renders for 50 keystrokes.');
  }

  const traceMs = await traceKeyboardInteraction(driver, typingText);
  const metrics: readonly ScenarioMetricStats[] = [
    { metric: 'renders-per-50-keystrokes', stats: summarize([renderProfile.totalRenders]) },
    { metric: 'interaction-trace-ms', stats: summarize([traceMs]) },
  ];

  return {
    metrics,
    notes: [
      'renders-per-50-keystrokes: react-devtools render counting (agent-browser react renders start/stop --json, session opened with --enable react-devtools) around 50 REAL keystrokes (agent-browser keyboard type: CDP text insertion dispatching beforeinput/textInput/input per character) into field001 of the typing-50 page — contrast with typing-50, which measures in-page synthetic input events',
      'the react-devtools counter counts COMPONENT render invocations (mounts + re-renders across every component instance), NOT root commits, so the memoized-path expectation commits <= keystrokes x 2 does not apply at this granularity; the commit-level counterpart is stream-100chunks (verified 100 commits for 100 chunks)',
      `interaction-trace-ms: span of the keyboard interaction's EventDispatch entries inside a Chrome DevTools profiler trace (profiler start -> keyboard type -> profiler stop, re-driven on a fresh page so the window holds exactly one 50-keystroke interaction); the span excludes profiler start/stop round-trip gaps`,
      'single instrumented pass per metric (runs = 1): render counts and trace spans are deterministic in shape, not sample distributions; instrumentation perturbs what it measures, so these records are kept separate from the un-instrumented typing-50 timing medians (plan risk #7)',
      `verified: the typed input value equals the deterministic payload, ${renderProfile.totalRenders} renders (${renderProfile.mounts} mounts + ${renderProfile.reRenders} re-renders) across ${renderProfile.componentCount} components in a ${renderProfile.recordingMs.toFixed(0)}ms recording`,
    ],
  };
}

/** Fresh page -> profiler start -> keyboard type -> stop; returns the in-trace interaction span in ms. */
async function traceKeyboardInteraction(driver: BenchBrowserDriver, typingText: string): Promise<number> {
  await driver.openScenario('typing-50');
  await driver.focusSelector(TYPING_FIELD_SELECTOR);

  await driver.startProfiler();

  try {
    await driver.keyboardType(typingText);
  } finally {
    await driver.stopProfiler(PROFILE_PATH);
  }

  if (!existsSync(PROFILE_PATH)) {
    throw new Error(`browser-typing-50: the profiler wrote no trace to ${PROFILE_PATH}.`);
  }

  const trace = JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) as TraceFile;
  const dispatches = (trace.traceEvents ?? []).filter(
    (event) =>
      event.ph !== 'M' &&
      typeof event.ts === 'number' &&
      event.ts > 0 &&
      event.name === 'EventDispatch' &&
      typeof event.args?.data?.type === 'string' &&
      KEYBOARD_DISPATCH_TYPES.has(event.args.data.type),
  );

  rmSync(PROFILE_PATH, { force: true });

  const first = dispatches[0];
  const last = dispatches[dispatches.length - 1];

  if (first === undefined || last === undefined || typeof first.ts !== 'number' || typeof last.ts !== 'number') {
    throw new Error('browser-typing-50: the trace contains no keyboard EventDispatch entries.');
  }

  if (dispatches.length < INSTRUMENTED_KEYSTROKE_COUNT) {
    throw new Error(
      `browser-typing-50: the trace holds ${dispatches.length} keyboard EventDispatch entries, fewer than the ${INSTRUMENTED_KEYSTROKE_COUNT} typed characters.`,
    );
  }

  return (last.ts + (last.dur ?? 0) - first.ts) / 1000;
}

/** What the in-page INP collector reports after the interaction workload. */
interface InpReadResult {
  readonly inpMs: number;
  readonly interactionCount: number;
}

/** The 16ms floor below which the event-timing API censors durations. */
const EVENT_TIMING_FLOOR_MS = 16;

const INSTALL_INP_COLLECTOR_EXPRESSION = `(() => {
  const pageWindow = window;
  if (pageWindow.__benchInpCollector) {
    return 'already-installed';
  }
  const interactions = new Map();
  let anonymousId = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const id = typeof entry.interactionId === 'number' && entry.interactionId > 0 ? entry.interactionId : ++anonymousId;
      const duration = typeof entry.duration === 'number' ? entry.duration : 0;
      interactions.set(id, Math.max(interactions.get(id) ?? 0, duration));
    }
  });
  observer.observe({ type: 'event', buffered: true, durationThreshold: ${EVENT_TIMING_FLOOR_MS} });
  pageWindow.__benchInpCollector = { interactions };
  return 'installed';
})()`;

const READ_INP_COLLECTOR_EXPRESSION = `(() => {
  const collector = window.__benchInpCollector;
  if (!collector) {
    throw new Error('The INP collector is not installed on this page.');
  }
  const durations = Array.from(collector.interactions.values());
  return {
    inpMs: durations.length === 0 ? 0 : Math.max(...durations),
    interactionCount: durations.length,
  };
})()`;

/**
 * `browser-mount-100`: load vitals for the 100-field form page. `lcp-ms` comes
 * from `agent-browser vitals <url> --json` on a fresh load; `inp-ms` is
 * collected in-page (the PerformanceObserver event-timing API, grouped by
 * interactionId, max interaction latency) around a deterministic real-input
 * workload, because the CLI's vitals command advertises INP but never reports
 * it. Runs in an un-instrumented session after every timing scenario has
 * finished.
 */
export async function executeMountVitalsScenario(driver: BenchBrowserDriver): Promise<BrowserScenarioOutcome> {
  const mountUrl = `${driver.origin}/?scenario=mount-100`;
  const vitals = await driver.readVitals(mountUrl);
  const lcpMs = vitals.lcpMs;

  if (lcpMs === undefined || !(lcpMs > 0)) {
    throw new Error(`browser-mount-100: the vitals report carries no LCP value (${JSON.stringify(vitals)}).`);
  }

  await driver.openUrl(mountUrl);
  await driver.evaluate<string>(INSTALL_INP_COLLECTOR_EXPRESSION);
  await driver.clickSelector(TYPING_FIELD_SELECTOR);
  await driver.keyboardType(createInstrumentedTypingText());

  const inp = await driver.evaluate<InpReadResult>(READ_INP_COLLECTOR_EXPRESSION);

  if (inp.interactionCount === 0) {
    throw new Error('browser-mount-100: the event-timing observer recorded no interactions for the typing workload.');
  }

  const inpMs = inp.inpMs > 0 ? inp.inpMs : EVENT_TIMING_FLOOR_MS;
  const metrics: readonly ScenarioMetricStats[] = [
    { metric: 'lcp-ms', stats: summarize([lcpMs]) },
    { metric: 'inp-ms', stats: summarize([inpMs]) },
  ];

  return {
    metrics,
    notes: [
      'lcp-ms: agent-browser vitals --json on a fresh load of the mount-100 page (the command navigates, waits for load, and reports TTFB/LCP/CLS/FCP); single fresh load, runs = 1',
      `inp-ms: collected in-page with the PerformanceObserver event-timing API (entries grouped by interactionId, maximum interaction latency) because agent-browser 0.27's vitals command advertises INP but never reports it; the workload is one real click into field001 plus ${INSTRUMENTED_KEYSTROKE_COUNT} real keystrokes (agent-browser keyboard type)`,
      inp.inpMs > 0
        ? `inp-ms is the maximum observed interaction latency over ${inp.interactionCount} recorded interactions`
        : `no interaction crossed the event-timing API's ${EVENT_TIMING_FLOOR_MS}ms duration floor (${inp.interactionCount} interactions observed); the floor value is recorded as the upper bound`,
      'collected in an un-instrumented browser session (no react-devtools hook) after every timing scenario had finished, so neither LCP nor INP absorbs instrumentation overhead (plan risk #7); single pass per metric (runs = 1)',
    ],
  };
}
