/**
 * Ambient declaration for the baseline (main-branch) PARSER bridge module
 * used by `run-main.ts` (the node-side `parser-*` scenarios — the only
 * surviving in-process worktree import; the UI baseline runs in the browser
 * through `tests/bench/fixtures/main-consumer/`, whose main-hook typing lives
 * in that fixture's `main-hook-types.d.ts`).
 *
 * Runtime resolution happens through the GENERATED `tests/bench/tsconfig.main.json`
 * (written by `baseline-worktree.ts --setup` from `tsconfig.main.template.json`):
 * tsx maps this specifier into the baseline worktree, where Node's resolution
 * lands in the worktree's own hoisted `node_modules` — main runs on its pinned
 * dependencies (DECISION-1) in a separate process from the current
 * implementation's runner.
 *
 * The shape below models the main-branch parser API verified against
 * `git show main:packages/formedible-parser/src/index.ts` and
 * `git show main:packages/formedible-parser/src/lib/formedible/formedible-parser.ts`.
 * It exists so the committed strict typecheck covers the baseline runner
 * without requiring the worktree to exist on this machine. Keep it in sync
 * with the main branch if the baseline is ever re-pinned.
 */

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
