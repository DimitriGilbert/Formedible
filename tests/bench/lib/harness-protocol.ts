/**
 * JSON-serializable protocol between the bench driver
 * (`tests/bench/utils/agent-browser.ts`) and the in-page harness global the
 * committed fixture exposes (`window.__benchHarness`, built by
 * `tests/bench/fixtures/current-consumer/main.tsx`).
 *
 * Every harness method takes plain-serializable arguments and returns a plain
 * result object whose numbers are milliseconds sampled in-page with
 * `performance.now()` (DECISION-2 revised). The driver summarizes those samples
 * with the shared `bench-timing.ts` statistics — identical warmup/median/p75/
 * min/max math, applied to browser-collected samples.
 *
 * This module is TYPE-ONLY by design: the fixture bundle and the node driver
 * both import it, so the protocol has exactly one definition while the two
 * programs stay independent.
 */

/** Answers "is the scenario form mounted and the harness callable?". */
export interface HarnessStatus {
  readonly ready: boolean;
  /** The `?scenario=` value the page was opened with. */
  readonly scenario: string;
  /** Populated when the scenario id is unknown or mounting failed. */
  readonly error?: string;
}

/** Loop options shared by every harness timing loop. */
export interface HarnessLoopOptions {
  /** Untimed runs executed before sampling begins. */
  readonly warmupRuns: number;
  /** Timed runs whose samples are returned. */
  readonly measuredRuns: number;
}

/** Result of the mount loop (initial render + commit of the scenario form). */
export interface HarnessMountResult {
  readonly samples: readonly number[];
  /** Distinct named controls inside the freshly mounted form (last run). */
  readonly renderedFieldCount: number;
}

/** Result of the keystroke loop (one input event per character). */
export interface HarnessKeystrokeResult {
  readonly samples: readonly number[];
  /** Input events dispatched per run (the typing workload length). */
  readonly eventCount: number;
  /** The typed control's DOM value after the final run. */
  readonly finalInputValue: string;
  /** The form-state value for the typed field after the final run. */
  readonly formValue: unknown;
}

/** Result of the submit loop (zod validation + `onSubmit` round trip). */
export interface HarnessSubmitResult {
  readonly samples: readonly number[];
  /** How many submits actually reached the consumer `onSubmit`. */
  readonly submitCount: number;
  /** Warmup + measured submits the loop attempted. */
  readonly expectedSubmitCount: number;
}

/** Result of a page-switch or tab-switch loop. */
export interface HarnessSwitchResult {
  readonly samples: readonly number[];
  /** 1-based current page (page switch) or 0-based active tab index. */
  readonly activeIndex: number;
}

/** Result of an array add/remove loop. */
export interface HarnessArrayOpResult {
  readonly samples: readonly number[];
  /** Rendered array items after the final operation. */
  readonly itemCount: number;
}

/** Result of an explicit persistence save loop. */
export interface HarnessPersistenceResult {
  readonly samples: readonly number[];
  /** Storage key the harness saved under. */
  readonly storageKey: string;
  /** Whether a payload exists under the storage key after the final save. */
  readonly stored: boolean;
}

/** The in-page harness surface (all methods JSON-serializable in and out). */
export interface BenchHarnessGlobal {
  status(): HarnessStatus;
  mountLoop(options: HarnessLoopOptions): Promise<HarnessMountResult>;
  keystrokeLoop(fieldName: string, text: string, options: HarnessLoopOptions): Promise<HarnessKeystrokeResult>;
  submitLoop(options: HarnessLoopOptions): Promise<HarnessSubmitResult>;
  switchPageLoop(pageNumber: number, options: HarnessLoopOptions): Promise<HarnessSwitchResult>;
  switchTabLoop(tabIndex: number, options: HarnessLoopOptions): Promise<HarnessSwitchResult>;
  arrayAddLoop(fieldName: string, options: HarnessLoopOptions): Promise<HarnessArrayOpResult>;
  arrayRemoveLoop(fieldName: string, itemIndex: number, options: HarnessLoopOptions): Promise<HarnessArrayOpResult>;
  persistenceSaveLoop(options: HarnessLoopOptions): Promise<HarnessPersistenceResult>;
}
