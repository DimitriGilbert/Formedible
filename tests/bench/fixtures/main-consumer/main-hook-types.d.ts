/**
 * Ambient declarations for the baseline (main-branch) modules the MAIN browser
 * fixture imports (`tests/bench/fixtures/main-consumer/main.tsx`).
 *
 * TYPECHECK side (this file, included by the fixture's committed
 * `tsconfig.check.json`): the shapes below model the main-branch hook API
 * verified against `git show main:packages/formedible/src/hooks/use-formedible.tsx`
 * and `git show main:packages/formedible/src/lib/formedible/types.ts`, so the
 * committed strict typecheck covers the fixture without requiring the baseline
 * worktree to exist on this machine.
 *
 * BUILD side (`vite build`, which does not typecheck): the fixture's generated
 * `tsconfig.json` (written by `baseline-worktree.ts` from
 * `tsconfig.template.json` with the `FORMEDIBLE_MAIN_WORKTREE` path
 * substituted) maps these specifiers into the baseline worktree —
 * `formedible-bench-main-hook` to main's hook source, and the two manifest
 * modules to the worktree's installed `@tanstack/react-form`/`react`
 * `package.json` files, whose versions the page reports on the bench global as
 * the dependency-isolation proof (DECISION-6 revised).
 *
 * Known main-branch divergences from the current implementation (annotated on
 * the affected benchmark artifacts by `run-main.ts`, never hidden):
 * - the top-level `schema` option is accepted by main's option type but never
 *   wired into validation; only per-field `validation` schemas run — the
 *   fixture distributes the scenario's zod schema across per-field
 *   `validation` entries instead;
 * - `setCurrentPage` is `setCurrentPageWithValidation` on main (per-page
 *   validation gates forward navigation, FROM-SCRATCH-2.md D12; `currentPage`
 *   is a 1-based index over visible pages, D11) — the paged scenario mounts
 *   with schema-valid values so the gate passes and the paths stay comparable;
 * - main's submit wrapper unconditionally resets the form after the consumer
 *   `onSubmit` resolves (`resetOnSubmitSuccess` is destructured but never
 *   read); the fixture captures its timing sample inside `onSubmit`, so the
 *   reset stays outside the timed region;
 * - select fields render a radix trigger with no native `<select>`/`[name]`
 *   control, so field-count verification counts `label[for]` elements (main's
 *   FieldWrapper renders `Label htmlFor={name}` for every labeled field).
 */

declare module 'formedible-bench-main-hook' {
  import type { ComponentType } from 'react';

  /** Values record the fixture drives main's generic hook with. */
  export type MainFormValues = Record<string, unknown>;

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

  /** Slice of main's TanStack form API the fixture reads (values, persistence save). */
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

declare module 'formedible-bench-main-react-form-manifest' {
  /** The worktree's installed `@tanstack/react-form` manifest (build-time JSON import). */
  const manifest: { readonly version: string };
  export default manifest;
}

declare module 'formedible-bench-main-react-manifest' {
  /** The worktree's installed `react` manifest (build-time JSON import). */
  const manifest: { readonly version: string };
  export default manifest;
}
