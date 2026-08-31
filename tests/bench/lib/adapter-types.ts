/**
 * Benchmark adapter contract — the single source of truth shared by every
 * implementation adapter (`adapter-current.ts` today, `adapter-main.ts` in
 * Phase 2). Scenario data is expressed purely through the plain-data shapes
 * below so the same scenarios run against both implementations unchanged.
 *
 * Rules enforced by design:
 * - Adapter operations must not know about scenarios.
 * - Scenarios must not know about implementations.
 * - Every timed operation returns the elapsed milliseconds measured inside
 *   the adapter via the shared timing helpers, so all implementations measure
 *   identically.
 */

export type BenchImplementation = 'current' | 'main';

/** Elapsed milliseconds reported by an adapter operation. */
export type MsElapsed = number;

export interface BenchFieldOption {
  readonly value: string;
  readonly label: string;
}

export interface BenchArrayObjectConfig {
  readonly layout?: 'stack' | 'grid';
  readonly columns?: number;
  readonly fields: readonly BenchField[];
}

export interface BenchArrayConfig {
  readonly itemType?: string;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly defaultValue?: unknown;
  readonly objectConfig?: BenchArrayObjectConfig;
}

export interface BenchField {
  readonly name: string;
  readonly type: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly options?: readonly BenchFieldOption[];
  readonly page?: number;
  readonly tab?: string;
  readonly arrayConfig?: BenchArrayConfig;
}

export interface BenchPageConfig {
  readonly page: number;
  readonly title: string;
  readonly description?: string;
}

export interface BenchTabConfig {
  readonly id: string;
  readonly label: string;
}

export interface BenchPersistenceConfig {
  readonly key: string;
  readonly storage: 'localStorage' | 'sessionStorage';
  readonly debounceMs: number;
}

export interface BenchSubmitContext {
  readonly value: Readonly<Record<string, unknown>>;
}

export interface MountFormOptions {
  readonly fields: readonly BenchField[];
  readonly defaultValues: Readonly<Record<string, unknown>>;
  /**
   * Validation schema handed to the implementation's submit path (a Standard
   * Schema object, for example a zod schema). Omitted for scenarios that do
   * not exercise schema submit.
   */
  readonly schema?: unknown;
  readonly pages?: readonly BenchPageConfig[];
  readonly tabs?: readonly BenchTabConfig[];
  readonly persistence?: BenchPersistenceConfig;
  readonly submitLabel?: string;
  readonly onSubmit?: (context: BenchSubmitContext) => void | Promise<void>;
}

/** Handle over a mounted benchmark form; `unmount` tears the tree down. */
export interface RootHandle {
  unmount(): void;
}

export interface MountedForm {
  readonly root: RootHandle;
  /** Elapsed milliseconds of the initial render + commit of this mount. */
  readonly mountMs: MsElapsed;
  /**
   * Types `text` into the named field one character at a time using synthetic
   * input events (one event per character) and returns the elapsed total.
   */
  keystroke(fieldName: string, text: string): Promise<MsElapsed>;
  /** Switches the mounted paged form to `pageNumber` (1-based). */
  switchPage(pageNumber: number): Promise<MsElapsed>;
  /** Activates the tab with the given id on the mounted tabbed form. */
  switchTab(tabId: string): Promise<MsElapsed>;
  /** Appends one item to the named array field. */
  arrayAdd(fieldName: string): Promise<MsElapsed>;
  /** Removes the item at `itemIndex` from the named array field. */
  arrayRemove(fieldName: string, itemIndex: number): Promise<MsElapsed>;
  /** Runs the full submit round trip (validation + consumer `onSubmit`). */
  submit(): Promise<MsElapsed>;
  /** Runs an explicit persistence save of the current values. */
  persistenceSave(): Promise<MsElapsed>;
  /** Number of distinct named field controls currently rendered. */
  getRenderedFieldCount(): number;
}

export interface BenchAdapter {
  readonly implementation: BenchImplementation;
  mountForm(options: MountFormOptions): Promise<MountedForm>;
}
