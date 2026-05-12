# Formedible Rewrite Orchestration Plan 2

## Purpose

This is the executable plan for the corrected from-scratch rewrite described in `FROM-SCRATCH-2.md`.

No implementation phase may introduce a registry mirror, Formedible import path or copied directory containing `generated/formedible`, source rewrite sync, raw HTML substitute for shadcn primitives, or placeholder public export.

## Orchestration Rules

1. No guessing configuration from memory or training data.
2. Inspect existing scaffold config before changing TypeScript, package, shadcn, registry, sync, or build settings.
3. Change only the minimum required settings and document why each override exists.
4. The orchestrator loads `FROM-SCRATCH-2.md` and `ORCHESTRATION-PLAN-2.md` once at the start of execution.
5. Use implementation tasks scoped to one responsibility, normally 3-7 production files and 1-3 focused test files.
6. Validators are separate from implementers.
7. Validators read the changed files and run the real checks.
8. Fixers only fix validator findings.
9. Every implementation prompt names exact files, exact compatibility examples, and the relevant constraints from the already-loaded plan context.
10. Do not use vague `all observed` wording once implementation starts.
11. Use compatibility examples, not other vague names.
12. Do not implement parser, builder, AI builder, or docs before the core shadcn install surface works.
13. If behavior is unclear, search the plan files and original reference repo for evidence before implementing.

## Phase 0: Workspace Reset And Guardrails

Goal: prepare a clean Better-T-Stack pnpm workspace for shadcn component authoring.

Create or verify:

1. root `package.json`
2. `pnpm-workspace.yaml`
3. root `turbo.json`
4. `packages/formedible`
5. `packages/formedible-parser`
6. `packages/builder`
7. `packages/ai-builder`
8. `apps/web`

Rules:

1. Package directories are source directories for shadcn components, not npm package contracts.
2. Shared dependency versions use pnpm catalog policy.
3. No `registry/default/**` directory.
4. No Formedible import path or copied directory containing `generated/formedible`.
5. Real shadcn-installed copies at the exact paths created by `shadcn add` are allowed and expected.
6. No source rewrite sync script.

Validation:

1. `pnpm check-types`
2. `pnpm build`
3. repository scan rejects `registry/default/**`
4. repository scan rejects Formedible import paths or copied directories containing `generated/formedible`

## Phase 0A: TypeScript And Shadcn Source Directory Config Lock

Goal: lock the config strategy before any product code exists.

Read first:

1. root TypeScript config files created by the scaffold
2. workspace shared config package, if present
3. root `package.json`
4. `pnpm-workspace.yaml`
5. existing `components.json` files created by the scaffold
6. original repo `packages/*/components.json`
7. original repo `packages/*/registry.json`
8. original repo `scripts/quick-sync.js`

Create or update only after reading:

1. `packages/formedible/tsconfig.json`
2. `packages/formedible-parser/tsconfig.json`
3. `packages/builder/tsconfig.json`
4. `packages/ai-builder/tsconfig.json`
5. `packages/formedible/components.json`
6. `packages/formedible-parser/components.json`
7. `packages/builder/components.json`
8. `packages/ai-builder/components.json`
9. source-directory `package.json` scripts only if needed for real checks and shadcn build

TypeScript rules:

1. extend the scaffold/base config instead of replacing it
2. add only the minimal overrides required for shadcn source authoring
3. no guessed `target`
4. no guessed `lib`
5. no guessed `module`
6. no guessed `type: module`
7. no `NodeNext` anywhere for authored shadcn source
8. no `.js` or `.mjs` imports in `.ts` or `.tsx`
9. no post-build import rewrite
10. no emitted `dist` treated as source
11. each shadcn source directory uses a local alias matching its `components.json` install model
12. typecheck includes source `.ts` and `.tsx` files only unless a concrete imported JSON typing need exists
13. authored shadcn source uses browser/app-oriented TypeScript resolution, specifically `moduleResolution: "Bundler"` or the scaffold's proven equivalent

Validation:

1. run `tsc --showConfig` for each shadcn source directory and review the effective config
2. run the narrow source-directory typecheck command for each directory
3. run `pnpm check-types`
4. run shadcn build in each source directory once registry files exist
5. scan rejects `.js` and `.mjs` imports in `.ts` and `.tsx`
6. validator rejects any config option added without a concrete reason tied to scaffold config or command failure
7. validator confirms effective TypeScript resolution is `Bundler` or the scaffold's proven browser/app equivalent

## Phase 1: Original Evidence Extraction Into Compatibility Examples

Goal: create explicit named compatibility examples from the original docs examples.

Read from original reference:

1. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/contact-form.tsx`
2. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/registration-form.tsx`
3. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/checkout-form.tsx`
4. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/job-application-form.tsx`
5. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/survey-form.tsx`
6. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/conditional-pages-form.tsx`
7. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/persistence-form.tsx`
8. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/tabbed-form.tsx`
9. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/array-fields-form.tsx`
10. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/conditional-in-obj.tsx`
11. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/flow-form.tsx`
12. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/rental-car-flow-form.tsx`
13. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/analytics-tracking-form.tsx`
14. `old_version_for_knowledge_purpose/apps/web/src/app/docs/examples/advanced-field-types-form.tsx`

Create:

1. `tests/compatibility-examples/core-examples.ts`
2. `tests/compatibility-examples/behavior-examples.ts`
3. `tests/compatibility-examples/advanced-field-examples.ts`
4. `tests/compatibility-examples/nested-examples.ts`
5. `tests/compatibility-examples/example-manifest.ts`
6. `tests/compatibility-examples/use-formedible-return-contract.ts`

Requirements:

1. Each example has a stable named export.
2. No array-index-based lookup.
3. No old implementation code copied.
4. Schemas and expected behavior are extracted as data and assertions.
5. Each example records original source path.
6. The return contract table marks keep/remove for old hook return fields.
7. The old reference repo is used only for public behavior, compatibility examples, registry config shape, copy-only sync behavior, shadcn dependency evidence, and domain logic evidence.
8. Old source structure is not reproduced just because it exists.

Validation:

1. read all compatibility example files
2. verify every original example listed above is represented
3. verify no old component/hook implementation was copied
4. verify the term compatibility examples is used in new prompts/docs instead of other vague names

## Phase 2: Guardrail Tests Before Implementation

Goal: make the previous failure modes impossible to continue past before product code is written.

Create:

1. `tests/architecture/no-registry-mirror.test.ts`
2. `tests/architecture/no-source-rewrite-sync.test.ts`
3. `tests/architecture/no-fake-formedible-import-surface.test.ts`
4. `tests/architecture/no-placeholder-public-exports.test.ts`
5. `tests/architecture/shadcn-primitive-usage.test.ts`
6. `tests/architecture/copy-only-sync-contract.test.ts`
7. `tests/architecture/public-doc-imports.test.ts`
8. `tests/architecture/package-root-real-exports.test.ts`

The tests must fail if:

1. `registry/default/**` exists
2. any Formedible import path or copied directory containing `generated/formedible` exists
3. sync contains import rewrite logic
4. sync modifies file contents instead of copying bytes
5. sync injects headers
6. sync injects `.js` or `.mjs` import suffixes
7. sync creates replacement entry files that hide invalid source structure
8. any source root entrypoint exports a placeholder runtime component
9. docs import Formedible from paths other than the exact paths created by local copy-only sync or real `shadcn add`
10. basic fields use raw HTML instead of available shadcn primitives
11. source root entrypoints implement duplicate runtime behavior instead of exporting real modules

The tests must allow:

1. shadcn-built registry payload output
2. app/tooling output such as route tree files
3. direct byte-for-byte sync copies into real local shadcn consumer install paths

Validation:

1. run all architecture tests before product implementation
2. confirm at least one sample input in each architecture test would fail on the forbidden pattern it protects against
3. validators have veto authority if any implementation bypasses or weakens these tests

No later phase may begin until this phase passes.

## Phase 3: Core Shadcn Install Surface Skeleton

Goal: make one minimal shadcn-installed `useFormedible` form work before building the full system.

Create in `packages/formedible`:

1. `components.json`
2. `registry.json`
3. `src/hooks/use-formedible.tsx`
4. `src/components/formedible/form.tsx`
5. `src/components/formedible/field-renderer.tsx`
6. `src/components/formedible/fields/field-wrapper.tsx`
7. `src/components/formedible/fields/text-field.tsx`
8. `src/components/formedible/fields/field-registry.tsx`
9. `src/lib/formedible/types.ts`
10. `src/lib/formedible/normalize-field-config.ts`
11. `src/lib/utils.ts`

Requirements:

1. Authored source uses consumer-safe shadcn aliases.
2. `text-field.tsx` uses shadcn `Input`.
3. field wrapper uses shadcn field composition.
4. `useFormedible` uses TanStack Form.
5. `Form` renders with `<Form className="..." />` usage.
6. `registry.json` points to real `src/**` files.
7. shadcn build runs inside `packages/formedible`.
8. No mirror directory.
9. No source rewrite.

Validation:

1. `pnpm --filter ./packages/formedible check-types`
2. `pnpm --filter ./packages/formedible build`
3. shadcn build inside `packages/formedible`
4. temporary shadcn app `shadcn add` of the built core payload
5. temporary shadcn app renders a one-field text form

## Phase 4: Copy-Only Sync

Goal: implement local sync as a direct copy shortcut, matching the original script's model.

Create:

1. `scripts/quick-sync.js` or `scripts/quick-sync.ts`
2. `tests/sync/copy-only-sync.test.ts`

Requirements:

1. reads source-directory `registry.json` file lists
2. copies listed files from owning source directory to the exact local paths where `shadcn add` would install them
3. creates destination directories
4. warns on missing listed files
5. does not rewrite imports
6. does not edit contents
7. does not add headers
8. does not add `.js` suffixes
9. does not create Formedible import paths or copied directories containing `generated/formedible`
10. does not create registry mirrors
11. does not read shadcn-built registry payloads as sync source of truth

Validation:

1. sync test proves copied bytes equal source bytes
2. sync test proves no content transform occurs
3. scan rejects import rewrite functions in sync script
4. scan rejects `registry/default`
5. scan rejects Formedible import paths or copied directories containing `generated/formedible`
6. sync test proves source files are copied from owning source directories, not from shadcn-built registry payloads

## Phase 5: Core Types And Normalization

Goal: accept original public input shapes unchanged.

Create or update:

1. `packages/formedible/src/lib/formedible/types.ts` or split modules re-exported from that path
2. `packages/formedible/src/lib/formedible/normalize-field-config.ts`
3. `packages/formedible/src/lib/formedible/normalize-options.ts`
4. `tests/formedible/types/field-config.test-d.ts`
5. `tests/formedible/types/options.test-d.ts`
6. `tests/formedible/normalize-field-config.test.ts`

Requirements:

1. all compatibility examples typecheck against public types
2. aliases normalize centrally
3. raw input objects are never mutated
4. index signature remains where custom fields need arbitrary props
5. no scattered alias handling in field components

Validation:

1. type tests pass
2. normalization tests pass
3. compatibility examples compile

## Phase 6: Shadcn Basic Fields

Goal: implement basic fields as real shadcn components.

Create or update:

1. `text-field.tsx`
2. `textarea-field.tsx`
3. `number-field.tsx`
4. `select-field.tsx`
5. `checkbox-field.tsx`
6. `switch-field.tsx`
7. `radio-field.tsx`
8. `field-wrapper.tsx`
9. `field-registry.tsx`

Requirements:

1. text/email/password/url/tel/masked use shadcn `Input`
2. textarea uses shadcn `Textarea`
3. select uses shadcn `Select`
4. checkbox uses shadcn `Checkbox`
5. switch uses shadcn `Switch`
6. radio uses shadcn `RadioGroup`
7. wrapper uses shadcn field composition
8. errors use `aria-invalid` and `data-invalid`
9. no raw substitute for available shadcn primitive

Validation:

1. component source inspection for shadcn primitive imports
2. runtime render tests for contact, registration, checkout, job application basic portions
3. temporary shadcn app install and render test

## Phase 7: Validation Pipeline

Goal: replace old validation helper state with TanStack Form validation behavior.

Create:

1. `packages/formedible/src/lib/formedible/validation.ts`
2. `packages/formedible/src/lib/formedible/zod-errors.ts`
3. `tests/formedible/validation/*.test.ts`

Requirements:

1. built-in constraints work
2. field-level validation works
3. top-level schema validation works
4. cross-field validation works without returned `crossFieldErrors`
5. async validation works without returned `asyncValidationStates`
6. inline validation uses TanStack async validation/debounce
7. errors render beside fields
8. removed return helpers have replacement assertions through rendered errors and TanStack form state

Validation:

1. validation examples pass
2. old validation docs/API evidence is checked against keep/remove table
3. no custom validation state return exists for removed helpers

## Phase 8: Advanced Fields

Goal: implement fields required by original advanced examples.

Create or update:

1. `date-field.tsx`
2. `slider-field.tsx`
3. `rating-field.tsx`
4. `multi-select-field.tsx`
5. `combobox-field.tsx`
6. `multi-combobox-field.tsx`
7. `color-picker-field.tsx`
8. `phone-field.tsx`
9. `duration-picker-field.tsx`
10. `location-picker-field.tsx`
11. `file-upload-field.tsx`

Requirements:

1. use shadcn primitives wherever available
2. preserve behavior from advanced field compatibility examples
3. browser APIs guarded for SSR
4. no field owns form state

Validation:

1. advanced field compatibility examples pass
2. temporary shadcn app render test includes advanced field sample
3. SSR import test passes

## Phase 9: Nested Array And Object Fields

Goal: implement real TanStack nested paths and local conditionals.

Create or update:

1. `array-field.tsx`
2. `object-field.tsx`
3. `src/lib/formedible/field-path.ts`
4. nested render tests

Requirements:

1. no fake field APIs
2. no nested custom form store
3. object path `object.child`
4. array primitive path `array[0]`
5. array object path `array[0].child`
6. nested object path `array[0].object.child`
7. local nested conditionals work for `conditional-in-obj.tsx`
8. sorting preserves submitted values and identity

Validation:

1. nested compatibility examples pass
2. submitted value shape tests pass
3. nested Zod error tests pass

## Phase 10: Pages, Tabs, Layout, Persistence, Analytics

Goal: implement behavior used by original examples without taking ownership from TanStack Form.

Create or update:

1. `use-multi-page.ts`
2. `use-form-tabs.ts`
3. `use-form-persistence.ts`
4. `use-form-analytics.ts`
5. layout components
6. navigation/progress components

Requirements:

1. page helpers returned as planned
2. storage helpers returned as planned
3. validation/debug helper returns removed only according to approved table
4. conditional pages work
5. dynamic page text works
6. tabs work
7. persistence save/load/clear works
8. analytics callbacks match original behavior

Validation:

1. conditional pages example passes
2. persistence example passes
3. tabbed example passes
4. rental car flow example passes
5. analytics tracking example passes

## Phase 11: Parser

Goal: port parser behavior cleanly as shadcn installable source.

Create in `packages/formedible-parser/src`:

1. parser implementation modules
2. parser config modules
3. parser source root entrypoint
4. `registry.json`
5. `components.json`

Requirements:

1. behavior comes from original parser examples/docs
2. no old file copy
3. public `FormedibleParser` works
4. parser registry build runs inside parser directory
5. sync copies parser files only

Validation:

1. parser tests pass
2. parser shadcn build passes
3. temporary shadcn app install/import test passes

## Phase 12: Builder

Goal: port builder behavior cleanly as shadcn installable source.

Create in `packages/builder/src`:

1. `FormBuilder`
2. `FieldConfigurator`
3. `FormPreview`
4. field store
5. code generation
6. default tabs
7. `registry.json`
8. `components.json`

Requirements:

1. no placeholder public exports
2. no package-root duplicate runtime
3. builder uses core/parser files only from the exact local paths where copy-only sync or `shadcn add` installs them
4. builder registry build runs inside builder directory

Validation:

1. builder behavior tests pass
2. builder shadcn build passes
3. temporary shadcn app install/import/render test passes

## Phase 13: AI Builder

Goal: port AI builder behavior cleanly as shadcn installable source.

Create in `packages/ai-builder/src`:

1. `AIBuilder`
2. `AiFormRenderer`
3. `parseAiToFormedible`
4. provider selection
5. chat interface
6. parser integration
7. `registry.json`
8. `components.json`

Requirements:

1. no placeholder public exports
2. no duplicate builder runtime in AI source root entrypoint
3. AI builder uses lower-level files only from the exact local paths where copy-only sync or `shadcn add` installs them
4. AI builder registry build runs inside AI builder directory

Validation:

1. AI behavior tests pass
2. AI builder shadcn build passes
3. temporary shadcn app install/import/render test passes

## Phase 14: Docs App

Goal: build docs from real public consumer usage.

Create or update docs pages and examples in `apps/web/src`.

Requirements:

1. examples import `useFormedible` from the exact hook path created by copy-only sync or `shadcn add`
2. examples do not import old reference files
3. examples do not import test-only compatibility example data directly
4. examples do not document removed validation/debug helpers after table approval
5. examples cover the required compatibility examples
6. route tree generation is allowed only as app tooling output

Validation:

1. docs typecheck/build passes
2. docs regression tests pass
3. route tree check passes if applicable
4. scan rejects old reference imports in docs runtime code

## Phase 15: Final Consumer Validation

Goal: prove real shadcn install behavior.

Run:

1. core shadcn build in `packages/formedible`
2. parser shadcn build in `packages/formedible-parser`
3. builder shadcn build in `packages/builder`
4. AI builder shadcn build in `packages/ai-builder`
5. copy-only sync
6. `pnpm check-types`
7. `pnpm build`
8. temporary shadcn app install tests for each registry payload
9. temporary shadcn app render tests for representative compatibility examples

Reject if:

1. `registry/default/**` exists
2. a Formedible import path or copied directory containing `generated/formedible` exists
3. sync rewrites source
4. basic fields do not import shadcn primitives
5. source root entrypoints export placeholders
6. docs import Formedible from paths other than the exact paths created by copy-only sync or `shadcn add`
7. validation/debug helper removal lacks approved replacement evidence

## Final Output

The final repo should contain authored shadcn source directories, per-directory registry configs, shadcn-built payload outputs, copy-only sync, docs using the real consumer hook, and compatibility examples proving the original public behavior.
