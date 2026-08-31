/**
 * Ambient declarations for the baseline (main-branch) bridge modules used by
 * `adapter-main.ts` and `run-main.ts`.
 *
 * Runtime resolution happens through the GENERATED `tests/bench/tsconfig.main.json`
 * (written by `baseline-worktree.ts --setup` from `tsconfig.main.template.json`):
 * tsx maps these specifiers into the baseline worktree, where Node's resolution
 * lands in the worktree's own hoisted `node_modules` — main runs on its pinned
 * dependencies (DECISION-1) in a separate process from the current
 * implementation's runner.
 *
 * The shapes below model the main-branch API surface verified against
 * `git show main:packages/formedible/src/hooks/use-formedible.tsx`,
 * `git show main:packages/formedible/src/lib/formedible/types.ts`, and
 * `git show main:packages/formedible-parser/src/lib/formedible/formedible-parser.ts`.
 * They exist so the committed strict typecheck covers the baseline adapter
 * without requiring the worktree to exist on this machine. Keep them in sync
 * with the main branch if the baseline is ever re-pinned.
 *
 * Known main-branch divergences from the current implementation (annotated on
 * the affected benchmark artifacts by `run-main.ts`, never hidden):
 * - the top-level `schema` option is accepted by main's option type but never
 *   wired into validation; only per-field `validation` schemas run — the
 *   adapter distributes the scenario's zod schema across per-field
 *   `validation` entries instead;
 * - `setCurrentPage` is `setCurrentPageWithValidation` on main (per-page
 *   validation gates navigation, FROM-SCRATCH-2.md D12; `currentPage`
 *   semantics differ per D11);
 * - select fields render a radix trigger (no native `<select>`/`[name]`
 *   control), so field-count verification uses `label[for]` elements.
 */

declare module 'formedible-bench-main-hook' {
  import type { ComponentType } from 'react';

  /**
   * Structural stand-in for a zod schema as consumed by main's per-field
   * validator (`validation.safeParse(value)` → first issue message).
   */
  export interface MainZodSchemaLike {
    safeParse(value: unknown): {
      success: boolean;
      error?: { issues?: readonly { message?: string }[] };
    };
  }

  export interface MainFieldOption {
    value: string;
    label: string;
  }

  export interface MainFieldConfig {
    name: string;
    type: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: MainFieldOption[] | string[];
    page?: number;
    tab?: string;
    validation?: MainZodSchemaLike;
    arrayConfig?: MainArrayConfig;
  }

  export interface MainArrayObjectConfig {
    layout?: string;
    columns?: number;
    fields: MainFieldConfig[];
  }

  export interface MainArrayConfig {
    itemType: string;
    minItems?: number;
    maxItems?: number;
    addButtonLabel?: string;
    removeButtonLabel?: string;
    defaultValue?: unknown;
    objectConfig?: MainArrayObjectConfig;
  }

  export interface MainPageConfig {
    page: number;
    title?: string;
    description?: string;
  }

  export interface MainTabConfig {
    id: string;
    label: string;
    description?: string;
  }

  export interface MainPersistenceConfig {
    key: string;
    storage: 'localStorage' | 'sessionStorage';
    debounceMs?: number;
    exclude?: string[];
    restoreOnMount?: boolean;
  }

  export interface MainSubmitContext<TFormValues extends Record<string, unknown>> {
    value: TFormValues;
    formApi: unknown;
  }

  export interface MainUseFormedibleOptions<TFormValues extends Record<string, unknown>> {
    fields?: MainFieldConfig[];
    pages?: MainPageConfig[];
    tabs?: MainTabConfig[];
    persistence?: MainPersistenceConfig;
    submitLabel?: string;
    formOptions?: Partial<{
      defaultValues: TFormValues;
      onSubmit: (context: MainSubmitContext<TFormValues>) => unknown | Promise<unknown>;
    }>;
  }

  /** Slice of main's TanStack form API the adapter reads (persistence save). */
  export interface MainFormApiLike<TFormValues extends Record<string, unknown>> {
    readonly state: { readonly values: Readonly<TFormValues> };
  }

  export interface MainHookResult<TFormValues extends Record<string, unknown>> {
    readonly form: MainFormApiLike<TFormValues>;
    readonly Form: ComponentType;
    readonly currentPage: number;
    readonly totalPages: number;
    readonly goToNextPage: () => void;
    readonly goToPreviousPage: () => void;
    /** main: validation-gated page switch (D12 divergence from current). */
    readonly setCurrentPage: (pageNumber: number) => void;
    /** main: unlike current, `values` is required (no argument defaulting). */
    readonly saveToStorage: (values: Partial<TFormValues>) => void;
  }

  export function useFormedible<TFormValues extends Record<string, unknown>>(
    options: MainUseFormedibleOptions<TFormValues>,
  ): MainHookResult<TFormValues>;
}

declare module 'formedible-bench-main-parser' {
  export interface MainParsedFieldConfig {
    readonly name: string;
  }

  export interface MainParsedFormConfig {
    readonly fields?: readonly MainParsedFieldConfig[];
  }

  export class FormedibleParser {
    static parse(code: string, options?: Record<string, unknown>): MainParsedFormConfig;
  }
}
