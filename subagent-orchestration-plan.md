# Formedible Clean-Room Rewrite: Concrete Subagent Execution Plan

## Purpose

Build Formedible from scratch in a new Better-T-Stack pnpm monorepo.

This is not a refactor of the current repo. The current repo is used only to extract fixtures and expected behavior. No current-repo implementation files are copied into the new repo. In the new repo, generated copy-with-sync artifacts are required for shadcn registry delivery and must be produced only from new authoritative source directories.

Formedible is **not a form library** and this plan must not produce one.

Formedible is a **schema-to-shadcn renderer layer over TanStack Form**:
- TanStack Form owns form state.
- TanStack Form owns field APIs.
- TanStack Form owns subscriptions.
- TanStack Form owns validation lifecycle.
- TanStack Form owns submission.
- Formedible owns schema interpretation.
- Formedible owns schema normalization and compatibility aliases.
- Formedible owns field/component selection.
- Formedible owns shadcn wiring.
- Formedible owns layout, wrappers, labels, help, and error presentation.
- Formedible owns parser/builder/AI builder compatibility around Formedible schemas.

Every subagent must preserve this boundary. If an implementation starts building a competing form state engine, custom validation state system, custom FieldApi layer, or custom submission lifecycle, it is wrong.

The compatibility target is strict:
- existing `useFormedible(options)` schemas must render the same functional forms
- existing `FieldConfig` and `UseFormedibleOptions` input shapes must work unchanged
- parser, builder, and AI builder high-level public APIs remain available
- old internal exports, debug hook return state, copied renderers, and god files are discarded

## Preconditions

- The user scaffolds the new repo before orchestration begins.
- Repo scaffolding is not delegated to an implementer subagent.
- Orchestration starts only after the new workspace exists with pnpm workspaces, the expected package layout, and root `check-types` and `build` scripts.
- If scaffold validation fails, the orchestrator may dispatch a fixer only for the specific config files named by the validator.

## Orchestration Rules

- Orchestrator does not write code during execution.
- Each implementation phase is handled by an implementer subagent.
- Each validation phase is handled by a separate validator subagent.
- Validators must read the code and report concrete file/line issues, not only run commands.
- Fixers only fix validator findings.
- Max 3 fixer attempts per phase before halt.
- Parallel phases use disjoint write ownership.

## Maximum Subagent Work Unit

Every implementer assignment must fit in a single execution context.

Hard limits:
- target 3-7 production files per implementer
- target 1-3 focused test files per implementer
- one cohesive responsibility per implementer
- no implementer owns an entire source area
- no implementer owns both implementation and docs
- no implementer owns both parser logic and renderer logic
- no implementer owns both store/state logic and UI composition

If a phase exceeds these limits, the orchestrator must split it into subphases before dispatch.

Validator scope must match implementer scope:
- validators read every file modified by the implementer
- validators run targeted tests for that work unit
- phase-level integration validation happens only after all subphases pass

## No Placeholder Dispatch Rule

Before dispatching any implementer, the orchestrator must ensure the assignment has:
- exact files to create or modify
- exact test files to create or modify
- exact fixture files that prove compatibility
- exact validation commands
- no `tests` placeholder without filenames
- no `stub`, `placeholder`, or `TBD` implementation escape hatch

If the plan section still contains a generic phrase such as `all current`, `all observed`, or `matches fixtures`, the dispatch prompt must bind it to the specific fixture manifest entries created in Phase 1.

## Repository Target

Expected new repo shape:

```text
.
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── catalog or workspace dependency policy
├── packages/
│   ├── formedible/
│   ├── formedible-parser/
│   ├── builder/
│   └── ai-builder/
├── apps/
│   └── web/
├── scripts/
│   ├── sync-components.ts
│   ├── extract-fixtures.ts
│   └── verify-synced-artifacts.ts
├── registry/
│   └── default/
│       ├── formedible/
│       ├── formedible-parser/
│       ├── formedible-builder/
│       └── formedible-ai-builder/
├── registry.json
├── public/
│   └── r/
└── tests/
    ├── fixtures/
    ├── formedible/
    ├── parser/
    ├── builder/
    ├── ai-builder/
    ├── registry/
    ├── ssr/
    └── a11y/
```

Shared dependency policy:
- one version of `react`
- one version of `react-dom`
- one version of `@tanstack/react-form`
- one version of `zod`
- one version set for shadcn/Radix packages used by synced and registry-installed files
- one version set for shared utilities such as `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `date-fns`

shadcn registry policy:
- use the current `shadcn` CLI through pnpm with command form `pnpm dlx shadcn@latest <command>`
- root registry entrypoint is `registry.json`
- registry source files live under `registry/[STYLE]/[ITEM]/...`
- built registry JSON files are emitted to `public/r`
- registry items conform to `https://ui.shadcn.com/schema/registry-item.json`
- registry root conforms to `https://ui.shadcn.com/schema/registry.json`
- registry source imports use the registry source alias pattern required by shadcn registry builds, then the CLI rewrites imports for consumers
- install validation uses `shadcn add` against the built `public/r/*.json` payloads in a temporary consumer app
- registry components must follow current shadcn component conventions, including `Field`/`FieldGroup` composition where appropriate, `aria-invalid`, `data-invalid`, semantic Tailwind tokens, and consumer alias-safe imports

Workspace and install-surface policy:
- `packages/formedible` is the core schema-to-shadcn renderer source directory.
- `packages/formedible-parser` is the parser source directory.
- `packages/builder` is the visual builder source directory.
- `packages/ai-builder` is the AI builder source directory.
- These workspace directories organize source and tests inside the monorepo; users do not install them directly.
- The supported external install surface is the shadcn registry output under `public/r/*.json`.
- The supported core rendering API is `useFormedible(options)`.
- Parser, builder, and AI builder keep their high-level public entrypoints for their respective registry-installed surfaces.
- Old internal exports, copied renderers, debug helper modules, and source-internal paths are not supported install surfaces.
- Consumer validation installs built shadcn registry items into temporary apps and verifies those installed files typecheck/build there.
- Copy-with-sync is required because shadcn installs source files into consumer apps.
- `packages/formedible` stays authoritative for core renderer source.
- Dependent source areas receive generated synced copies of the core/parser/builder source they must ship in their registry items.
- Generated synced artifacts are never edited directly; changes start in the owning source directory and are propagated by sync.
- Verification fails on drift, missing synced files, or direct edits to generated synced artifacts.

## Global Validation Commands

Each validator uses the commands that exist in the new repo. The plan expects these scripts to exist by Phase 1:

```bash
pnpm check-types
pnpm build
```

Optional workspace path-filter commands:

```bash
pnpm --filter ./packages/formedible check-types
pnpm --filter ./packages/formedible build
pnpm --filter ./packages/formedible-parser check-types
pnpm --filter ./packages/formedible-parser build
pnpm --filter ./packages/builder check-types
pnpm --filter ./packages/builder build
pnpm --filter ./packages/ai-builder check-types
pnpm --filter ./packages/ai-builder build
pnpm --filter ./apps/web check-types
pnpm --filter ./apps/web build
```

---

## Phase 0: Validate User-Scaffolded Repo Foundation

**Type**: Sequential

### Fixer Task Only If Validator Fails

No planned implementer is dispatched for Phase 0. The user provides the scaffold. If validation fails, dispatch a fixer only for the specific repo-config files named in the validator report.

### Validator Task

Read:
- root `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `components.json`
- `registry.json`
- every workspace `package.json`
- `AGENTS.md`

Validate:
- pnpm is the only package manager.
- shared dependency versions are centralized.
- root `check-types` and `build` scripts exist.
- `registry.json` has the current shadcn registry schema URL.
- `components.json` aliases match the project layout.
- workspace manifests do not expose legacy internals.
- no generated code or old implementation files are present.
- `pnpm check-types` passes.
- `pnpm build` passes.

---

## Phase 0A: Create Workspace Package Surfaces

**Type**: Sequential

### Implementer Task

Create the workspace package surfaces that the rewrite will fill in after scaffold validation.

Files to create or modify:
- `packages/formedible/package.json`
- `packages/formedible/tsconfig.json`
- `packages/formedible/src/index.ts`
- `packages/formedible-parser/package.json`
- `packages/formedible-parser/tsconfig.json`
- `packages/formedible-parser/src/index.ts`
- `packages/builder/package.json`
- `packages/builder/tsconfig.json`
- `packages/builder/src/index.ts`
- `packages/ai-builder/package.json`
- `packages/ai-builder/tsconfig.json`
- `packages/ai-builder/src/index.ts`

Requirements:
- Create the four workspace package surfaces: `formedible`, `formedible-parser`, `builder`, and `ai-builder`.
- `apps/web` is scaffold-owned and must already exist as the docs/demo consumer app surface.
- Package manifests use centralized workspace dependency policy only.
- Package manifests expose only high-level entrypoints; no legacy internal paths or copied component internals.
- Source entrypoints are minimal but valid and buildable.
- The package surfaces created here are the authoritative locations used by later phases.
- This phase creates package structure only; no product behavior, fixture extraction, registry payloads, or sync logic yet.

Validation commands:
- `pnpm check-types`
- `pnpm build`

### Validator Task

Read:
- every workspace `package.json`
- every workspace `tsconfig.json`
- `packages/formedible/src/index.ts`
- `packages/formedible-parser/src/index.ts`
- `packages/builder/src/index.ts`
- `packages/ai-builder/src/index.ts`
- `apps/web/package.json`

Run:
- `pnpm check-types`
- `pnpm build`

Validate:
- all required package surfaces exist.
- `apps/web` exists from scaffold and remains intact.
- manifests use workspace dependency references and do not introduce version drift.
- only high-level package entrypoints are exposed.
- source entrypoints are minimal, valid, and buildable.
- no old implementation code is copied into the new package surfaces.

---

## Phase 1: Extract Golden Compatibility Fixtures

**Type**: Parallel, then integration

## Phase 1A: Fixture Extraction Harness

### Implementer Task

Files to create:
- `scripts/extract-fixtures.ts`
- `tests/fixtures/fixture-manifest.json`
- `tests/fixtures/README.md`

Requirements:
- Implement the script entrypoint and manifest format only.
- Do not extract every fixture in this subphase.
- Manifest records source file, fixture id, category, and expected test coverage.
- Fixture extraction entrypoint supports adding category extractors without changing the manifest schema.

### Validator Task

Read the script and manifest format.

Validate:
- harness has no old implementation code.
- manifest format can represent all planned fixture categories.
- script is runnable.

## Phase 1B: Core Form Schema Fixtures

### Implementer Task

Current repo files to inspect:
- `apps/web/src/app/docs/examples/**/*.tsx`
- `apps/web/src/data/code-examples.ts`
- `apps/web/src/app/docs/fields/page.tsx`
- `apps/web/src/app/docs/advanced-fields/page.tsx`

Files to create:
- `tests/fixtures/schema-fixtures/basic-fields.ts`
- `tests/fixtures/schema-fixtures/advanced-fields.ts`
- `tests/fixtures/schema-fixtures/array-object-fields.ts`
- `tests/fixtures/schema-fixtures/custom-components.ts`

Fixture categories:
- basic fields
- advanced fields
- array fields
- object fields
- nested object inside array
- custom field component
- `defaultComponents`
- per-field `wrapper`
- `globalWrapper`

### Validator Task

Read all core schema fixture files.

Validate:
- fixtures are schemas/examples only.
- all listed categories are present.
- no old renderer/component implementation code is copied.

## Phase 1C: Behavior Schema Fixtures

### Implementer Task

Current repo files to inspect:
- `apps/web/src/app/docs/examples/**/*.tsx`
- `apps/web/src/app/docs/validation/page.tsx`
- `apps/web/src/app/docs/persistence/page.tsx`
- `apps/web/src/app/docs/analytics/page.tsx`
- `apps/web/src/data/code-examples.ts`

Files to create:
- `tests/fixtures/schema-fixtures/conditionals.ts`
- `tests/fixtures/schema-fixtures/navigation.ts`
- `tests/fixtures/schema-fixtures/validation.ts`
- `tests/fixtures/schema-fixtures/persistence.ts`
- `tests/fixtures/schema-fixtures/analytics.ts`
- `tests/fixtures/schema-fixtures/personalization.ts`

Fixture categories:
- conditional field
- conditional section
- conditional page
- tabs
- multi-page forms
- persistence
- analytics
- auto-submit
- form personalization classes/buttons/labels
- HTML `<Form />` props
- top-level Zod `schema`
- field-level Zod `validation`
- `validationConfig`
- `crossFieldValidation`
- `asyncValidation`
- `inlineValidation`

### Validator Task

Read all behavior fixture files.

Validate:
- every listed behavior category is represented.
- old debug return helpers are not treated as required compatibility.
- docs/examples are represented as input schemas, not implementation code.

## Phase 1D: Alias And Nested Path Fixtures

### Implementer Task

Current repo files to inspect:
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts`
- `apps/web/src/app/docs/**/*.tsx`
- `apps/web/src/data/code-examples.ts`

Files to create:
- `tests/fixtures/observed-field-types.ts`
- `tests/fixtures/observed-config-aliases.ts`
- `tests/fixtures/schema-fixtures/nested-paths.ts`

Observed field type aliases must include every spelling found in current repo, including:
- `text`
- `email`
- `password`
- `url`
- `tel`
- `masked`
- `maskedInput`
- `textarea`
- `number`
- `select`
- `multiSelect`
- `multiselect`
- `combobox`
- `autocomplete`
- `multiCombobox`
- `multicombobox`
- `checkbox`
- `switch`
- `radio`
- `slider`
- `date`
- `rating`
- `phone`
- `color`
- `colorPicker`
- `file`
- `array`
- `object`
- `duration`
- `location`

Observed config aliases must include:
- `maskedInputConfig`
- `maskedConfig`
- `multiSelectConfig`
- `multiComboboxConfig`
- `colorConfig`
- config object names enumerated from `tests/fixtures/fixture-manifest.json` category `field-config-object`

Nested fixture assertions:
- `object.child` updates submit as `{ object: { child } }`
- `array[0]` updates submit as `{ array: [value] }`
- `array[0].child` updates submit as `{ array: [{ child }] }`
- `array[0].object.child` updates submit as `{ array: [{ object: { child } }] }`
- nested Zod errors attach to the nested field
- local nested conditionals receive local item/object values
- sorting array items preserves values and field identity

### Validator Task

Read alias and nested fixture files.

Validate:
- aliases are backed by current repo evidence.
- nested assertions are executable.
- fixtures cover every accepted alias.

## Phase 1E: Parser, Builder, And AI Fixtures

### Implementer Task

Current repo files to inspect:
- `packages/formedible-parser/src/index.ts`
- `packages/formedible-parser/src/lib/formedible/parser-config-schema.ts`
- `packages/formedible-parser/src/lib/formedible/formedible-parser.ts`
- `packages/builder/src/index.ts`
- `packages/ai-builder/src/index.ts`
- `apps/web/src/app/docs/formedible-parser/page.tsx`
- `apps/web/src/app/docs/ai-builder/page.tsx`

Files to create:
- `tests/fixtures/parser-fixtures.ts`
- `tests/fixtures/builder-fixtures.ts`
- `tests/fixtures/ai-builder-fixtures.ts`

Requirements:
- Parser fixtures cover JSON, object literal, Zod expression strings, sanitization, suggestions, and schema inference.
- Builder fixtures cover public exports and generated form code expectations.
- AI fixtures cover `parseAiToFormedible`, `AiFormRenderer`, `AIBuilder`, provider selection, and generated schema rendering.

### Validator Task

Read parser/builder/AI fixture files.

Validate:
- public API expectations are explicit.
- fixture files contain no implementation copies.
- generated schema expectations connect back to core schema-renderer fixtures.

### Phase-Level Validation

After 1A-1E pass:
- validator reads `tests/fixtures/fixture-manifest.json`
- every fixture file is referenced by the manifest
- every planned category has at least one fixture
- extraction script runs

---

## Phase 2: Core Source Public Types

**Type**: Sequential subphases

## Phase 2A: Core Public Type Entry And Form Options

### Implementer Task

Implement source entrypoint and top-level form option/return types.

Files to create:
- `packages/formedible/src/index.ts`
- `packages/formedible/src/types/index.ts`
- `packages/formedible/src/types/dynamic-text.ts`
- `packages/formedible/src/types/options.ts`
- `packages/formedible/src/types/form-config.ts`
- `tests/formedible/types/public-api-allowlist.ts`
- `tests/formedible/types/form-options.test-d.ts`

Concrete requirements:
- `UseFormedibleOptions<TFormValues>` accepts every option represented in `tests/fixtures/schema-fixtures/*.ts`.
- Preserve `FormProps` HTML/event props.
- Define the new `UseFormedibleReturn`:
  - `form`
  - `Form`
  - optional page helpers
  - optional tab helpers
  - optional storage helpers
- Do not include old debug helper return fields.
- Expose only intended high-level source API from `src/index.ts`.
- `tests/formedible/types/public-api-allowlist.ts` lists every allowed named export from `formedible`.
- Allowed core exports are limited to `useFormedible`, public schema authoring types, public option/return types, and documented compatibility helpers.
- Disallowed core exports include field renderers, internal hooks, internal normalization helpers, copied implementation artifacts, and debug helper returns.

### Validator Task

Read source entrypoint and form option/return type files.

Validate:
- form option fixtures compile against types.
- no obsolete return helpers exist.
- source `index.ts` exposes exactly the entries listed in `tests/formedible/types/public-api-allowlist.ts`.

## Phase 2B: Field Config And Field Props Types

### Implementer Task

Files to create:
- `packages/formedible/src/types/field-config.ts`
- `packages/formedible/src/types/field-props.ts`
- `tests/formedible/types/field-config.test-d.ts`
- `tests/formedible/types/field-props.test-d.ts`

Concrete requirements:
- `FieldConfig` accepts every schema property represented in `tests/fixtures/schema-fixtures/*.ts`.
- Keep `[key: string]: unknown` on `FieldConfig`.
- Preserve `component`, `defaultComponents`, `wrapper`, and `globalWrapper` input shape.
- Define props for all field components needed by fixtures.
- Include field-specific config object types enumerated in `tests/fixtures/observed-config-aliases.ts`.

### Validator Task

Read field config and field prop type files.

Validate:
- field schema fixtures compile against types.
- every observed field-specific config object is represented.
- no old `types.ts` file shape was copied wholesale.

## Phase 2C: Feature Types

### Implementer Task

Files to create:
- `packages/formedible/src/types/layout.ts`
- `packages/formedible/src/types/validation.ts`
- `packages/formedible/src/types/analytics.ts`
- `packages/formedible/src/types/persistence.ts`
- `packages/formedible/src/types/parser-compat.ts`
- `tests/formedible/types/feature-types.test-d.ts`

Concrete requirements:
- Layout types cover current `layout`, section, grid, tabs, accordion, stepper, page, and progress configs.
- Validation types cover `validationConfig`, `crossFieldValidation`, `asyncValidation`, and `inlineValidation`.
- Analytics types cover callbacks represented in `tests/fixtures/schema-fixtures/analytics.ts`.
- Persistence types cover key, storage, debounce, exclude, restoreOnMount.
- Parser compatibility types expose only what high-level parser/builder/AI fixtures require.

### Validator Task

Read feature type files.

Validate:
- behavior fixtures compile against feature types.
- analytics/persistence/validation fixtures compile.
- `pnpm --filter ./packages/formedible check-types` passes.

### Phase-Level Validation

After 2A-2C pass:
- all type fixtures compile
- formedible source directory typecheck passes

---

## Phase 3: Normalization And Dynamic Utilities

**Type**: Sequential subphases

## Phase 3A: Field And Option Normalization

### Implementer Task

Implement raw-schema compatibility normalization.

Files to create:
- `packages/formedible/src/lib/normalize-field-config.ts`
- `packages/formedible/src/lib/normalize-options.ts`
- `packages/formedible/src/lib/utils.ts`
- `tests/formedible/normalize-field-config.test.ts`
- `tests/formedible/normalize-options.test.ts`

Concrete requirements:
- `normalizeFieldConfig(raw)` never mutates `raw`.
- Normalize field type aliases:
  - `maskedInput` -> internal masked/text implementation
  - `multiselect` -> `multiSelect`
  - `multicombobox` -> `multiCombobox`
  - `colorPicker` -> canonical color picker implementation
- Normalize config aliases:
  - `maskedConfig` and `maskedInputConfig`
  - other observed config aliases from fixtures
- Normalize option arrays and option callbacks.

### Validator Task

Read normalization code.

Validate:
- all alias fixtures pass.
- raw input objects are not mutated.
- no ad hoc alias handling outside this module.

## Phase 3B: Dynamic Text

### Implementer Task

Files to create:
- `packages/formedible/src/lib/resolve-dynamic-text.ts`
- `tests/formedible/resolve-dynamic-text.test.ts`

Concrete requirements:
- Dynamic text supports current `{{fieldName}}` behavior.
- Dynamic text supports nested/local values where current schemas depend on that.

### Validator Task

Read dynamic text code.

Validate:
- dynamic text fixtures pass.
- nested/local dynamic text fixtures pass.

## Phase 3C: Field Paths And Error Lookup

### Implementer Task

Files to create:
- `packages/formedible/src/lib/field-path.ts`
- `packages/formedible/src/lib/zod-errors.ts`
- `tests/formedible/field-path.test.ts`
- `tests/formedible/zod-errors.test.ts`

Concrete requirements:
- `field-path.ts` provides helpers for:
  - object child paths
  - array item paths
  - array object child paths
  - nested path error lookup
- `zod-errors.ts` maps top-level schema issues to field paths used by the renderer.

### Validator Task

Read path and error lookup code.

Validate:
- nested path helpers produce paths used by fixtures.
- nested Zod error fixtures pass.
- no ad hoc string parsing where a helper exists.

### Phase-Level Validation

After 3A-3C pass:
- utility tests pass
- formedible typecheck passes

---

## Phase 4: Formedible Schema Renderer Hook And Shell

**Type**: Sequential subphases

## Phase 4A: Hook Contract And Form Shell

### Implementer Task

Files to create:
- `packages/formedible/src/hooks/use-formedible.ts`
- `packages/formedible/src/components/form.tsx`
- `tests/formedible/use-formedible-return.test.tsx`
- `tests/formedible/form-shell.test.tsx`

Concrete requirements:
- `useFormedible(options)` accepts raw schemas.
- `useFormedible` normalizes configs before rendering.
- `useFormedible` delegates form state, field APIs, subscriptions, validation lifecycle, and submission to TanStack Form.
- `Form` behavior and return contract remain compatible with the current public API.
- Internal extraction of form rendering logic is allowed, but the hook must not change how consumers use `Form` unless fixture-backed compatibility proves equivalence.
- `Form` supports:
  - `className`
  - `action`
  - `method`
  - `encType`
  - `target`
  - `autoComplete`
  - `noValidate`
  - `acceptCharset`
  - `role`
  - aria props
  - keyboard/focus/input/reset/invalid handlers
- `UseFormedibleOptions` supports:
  - `submitLabel`
  - `nextLabel`
  - `previousLabel`
  - `collapseLabel`
  - `expandLabel`
  - `formClassName`
  - `fieldClassName`
  - `labelClassName`
  - `buttonClassName`
  - `submitButtonClassName`
  - `submitButton`
  - `disabled`
  - `loading`
  - `showSubmitButton`
  - `autoScroll`
  - form event callbacks
- `resetOnSubmitSuccess` resets only when explicitly true.
- The hook returns only the new stable return contract.
- No `crossFieldErrors` or `asyncValidationStates` returned.
- No custom form state engine, custom FieldApi layer, or custom submission lifecycle.
- `Form` renders the form element, props, submit controls, and a typed content slot.
- `Form` does not import `ContentRenderer` in Phase 4A.

### Validator Task

Read hook and form shell code.

Validate:
- TanStack Form owns state, field APIs, subscriptions, validation lifecycle, and submission.
- no competing form engine is introduced.
- `Form` usage remains compatible with the current public API.
- old debug helper returns do not exist.
- form personalization fixtures pass.
- HTML prop fixtures pass.
- submit/reset behavior fixtures pass.

## Phase 4B: Field And Content Rendering

### Implementer Task

Files to create or modify:
- `packages/formedible/src/hooks/use-formedible.ts`
- `packages/formedible/src/components/form.tsx`
- `packages/formedible/src/components/content-renderer.tsx`
- `packages/formedible/src/components/field-renderer.tsx`
- `packages/formedible/src/components/conditional-field.tsx`
- `tests/formedible/render-flat-form.test.tsx`
- `tests/formedible/conditional-field.test.tsx`

Concrete requirements:
- Wire `useFormedible` and `Form` from Phase 4A to render `ContentRenderer`.
- `content-renderer` chooses flat/page/tab rendering entrypoint but only implements flat rendering in this subphase.
- `field-renderer` normalizes raw configs before lookup.
- `field-renderer` renders TanStack `form.Field`; it does not create fake field APIs.
- `field-renderer` supports field-level `component` override.
- `field-renderer` passes normalized type-specific props to fields.
- `conditional-field` evaluates `conditional(values)` against current form values for top-level fields.
- Field renderer does not contain a giant if/else chain.

### Validator Task

Read content, field, and conditional renderer code.

Validate:
- normalized config is used before registry lookup.
- real TanStack field APIs are used.
- custom component fixture passes.
- flat render fixtures pass.
- conditional fixture passes.

## Phase 4C: Sections, Navigation, And Progress Shells

### Implementer Task

Files to create:
- `packages/formedible/src/components/section-renderer.tsx`
- `packages/formedible/src/components/navigation.tsx`
- `packages/formedible/src/components/progress.tsx`
- `tests/formedible/section-renderer.test.tsx`
- `tests/formedible/navigation-shell.test.tsx`
- `tests/formedible/progress-shell.test.tsx`

Concrete requirements:
- `section-renderer` supports section title, description, collapsible, defaultExpanded, collapseLabel, expandLabel.
- `section-renderer` supports dynamic text in section title/description.
- `navigation` supports submit/next/previous labels, custom submit button, disabled/loading/submitting state.
- `progress` supports progress component override and default progress rendering.
- Page/tab state integration is limited to typed props in this phase; no fake page/tab behavior is allowed before Phase 7B.

### Validator Task

Read section, navigation, and progress code.

Validate:
- section fixtures pass.
- navigation shell fixtures pass.
- progress shell fixtures pass.
- no page/tab hook logic is mixed into these presentational components.

### Phase-Level Validation

After 4A-4C pass:
- run `tests/formedible/use-formedible-return.test.tsx`
- run `tests/formedible/form-shell.test.tsx`
- run `tests/formedible/render-flat-form.test.tsx`
- run `tests/formedible/conditional-field.test.tsx`
- run `tests/formedible/section-renderer.test.tsx`
- run `tests/formedible/navigation-shell.test.tsx`
- run `tests/formedible/progress-shell.test.tsx`
- run `pnpm --filter ./packages/formedible check-types`
- run `pnpm --filter ./packages/formedible build`

---

## Phase 5: Field Registry And Simple Fields

**Type**: Parallel

## Phase 5A: Registry And Field Wrapper

### Implementer Task

Files to create:
- `packages/formedible/src/components/fields/field-registry.ts`
- `packages/formedible/src/components/fields/field-wrapper.tsx`
- `packages/formedible/src/components/fields/field-help.tsx`
- `packages/formedible/src/components/fields/index.ts`
- `packages/formedible/src/hooks/use-field-state.ts`
- `tests/formedible/field-registry.test.ts`
- `tests/formedible/field-wrapper.test.tsx`
- `tests/formedible/use-field-state.test.ts`

Requirements:
- Registry maps every observed field type alias.
- Registry is a plain object or simple immutable map.
- User `defaultComponents` override registry entries.
- Per-field `component` overrides registry entry.
- `FieldWrapper` renders label, description, help, and errors.

### Validator Task

Read registry/wrapper code.

Validate:
- aliases listed in `tests/fixtures/observed-field-types.ts` are present.
- custom component fixtures pass.
- wrapper/global wrapper fixtures pass.

## Phase 5B: Basic Fields

### Implementer Task

Files to create:
- `packages/formedible/src/components/fields/text-field.tsx`
- `packages/formedible/src/components/fields/textarea-field.tsx`
- `packages/formedible/src/components/fields/number-field.tsx`
- `packages/formedible/src/components/fields/checkbox-field.tsx`
- `packages/formedible/src/components/fields/switch-field.tsx`
- `packages/formedible/src/components/fields/radio-field.tsx`
- `packages/formedible/src/components/fields/select-field.tsx`
- `tests/formedible/fields/text-field.test.tsx`
- `tests/formedible/fields/textarea-field.test.tsx`
- `tests/formedible/fields/number-field.test.tsx`
- `tests/formedible/fields/boolean-fields.test.tsx`
- `tests/formedible/fields/select-radio-fields.test.tsx`

Requirements:
- Use `useFieldState`.
- Support props/configs represented by `tests/fixtures/schema-fixtures/basic-fields.ts`.
- Support disabled/loading/submitting state.
- Render errors through `FieldWrapper`.
- No form-level side effects or form state ownership inside field components.

### Validator Task

Read every basic field file.

Validate:
- fixtures for basic fields pass.
- no duplicated field-state boilerplate beyond `useFieldState`.
- typecheck passes.

## Phase 5C: Choice And Search Fields

### Implementer Task

Files to create:
- `packages/formedible/src/components/fields/multi-select-field.tsx`
- `packages/formedible/src/components/fields/combobox-field.tsx`
- `packages/formedible/src/components/fields/multi-combobox-field.tsx`
- `tests/formedible/fields/multi-select-field.test.tsx`
- `tests/formedible/fields/combobox-field.test.tsx`
- `tests/formedible/fields/multi-combobox-field.test.tsx`

Requirements:
- `autocomplete` renders via combobox behavior.
- `multiSelect` and `multiselect` render same component.
- `multiCombobox` and `multicombobox` render same component.
- Static and dynamic options are supported.
- Search, empty, loading, creatable, max selection, and clear behavior match `tests/fixtures/schema-fixtures/advanced-fields.ts`.

### Validator Task

Read every choice/search field file.

Validate:
- alias fixtures pass.
- option/config fixtures pass.
- typecheck passes.

## Phase 5D: Specialized Scalar Fields

### Implementer Task

Files to create:
- `packages/formedible/src/components/fields/date-field.tsx`
- `packages/formedible/src/components/fields/slider-field.tsx`
- `packages/formedible/src/components/fields/rating-field.tsx`
- `packages/formedible/src/components/fields/color-picker-field.tsx`
- `tests/formedible/fields/date-field.test.tsx`
- `tests/formedible/fields/slider-field.test.tsx`
- `tests/formedible/fields/rating-field.test.tsx`
- `tests/formedible/fields/color-picker-field.test.tsx`

Requirements:
- `color` and `colorPicker` render same component.
- Date config behavior matches `tests/fixtures/schema-fixtures/advanced-fields.ts`.
- Slider config, value mapping, marks, tooltip/value display behavior match `tests/fixtures/schema-fixtures/advanced-fields.ts`.
- Rating max, half, clear, icon, size, and showValue behavior match `tests/fixtures/schema-fixtures/advanced-fields.ts`.
- Color format, alpha, preview, preset, and custom input behavior match `tests/fixtures/schema-fixtures/advanced-fields.ts`.

### Validator Task

Read every specialized scalar field file.

Validate:
- scalar advanced fixtures pass.
- alias/config fixtures pass.
- typecheck passes.

## Phase 5E: Nested Structure Fields

### Implementer Task

Files to create:
- `packages/formedible/src/components/fields/array-field.tsx`
- `packages/formedible/src/components/fields/object-field.tsx`
- `tests/formedible/fields/array-field.test.tsx`
- `tests/formedible/fields/object-field.test.tsx`
- `tests/formedible/fields/nested-path-rendering.test.tsx`

Requirements:
- Array/object fields use real TanStack field paths.
- No mock FieldApi objects.
- No custom nested form state store.
- Object child path: `object.child`.
- Array primitive path: `array[0]`.
- Array object child path: `array[0].child`.
- Nested object path: `array[0].object.child`.
- Nested conditionals receive local item/object values.
- Array sorting preserves values and field identity.

### Validator Task

Read array/object field files.

Validate:
- no mock FieldApi implementation exists.
- nested path fixtures pass.
- submitted value shape fixtures pass.
- typecheck passes.

## Phase 5F: File, Location, Phone, And Duration Fields

### Implementer Task

Files to create:
- `packages/formedible/src/components/fields/file-upload-field.tsx`
- `packages/formedible/src/components/fields/location-picker-field.tsx`
- `packages/formedible/src/components/fields/duration-picker-field.tsx`
- `packages/formedible/src/components/fields/phone-field.tsx`
- `tests/formedible/fields/file-upload-field.test.tsx`
- `tests/formedible/fields/location-picker-field.test.tsx`
- `tests/formedible/fields/duration-picker-field.test.tsx`
- `tests/formedible/fields/phone-field.test.tsx`

Requirements:
- File upload accept, multiple, max size, max files, allowed types, upload callback behavior match `tests/fixtures/schema-fixtures/advanced-fields.ts`.
- Location search, geolocation, manual entry, provider config, callbacks, and display behavior match `tests/fixtures/schema-fixtures/advanced-fields.ts`.
- Duration format, bounds, labels, negative handling, and submitted value shape match `tests/fixtures/schema-fixtures/advanced-fields.ts`.
- Phone country/format config behavior matches `tests/fixtures/schema-fixtures/advanced-fields.ts`.

### Validator Task

Read file/location/duration/phone field files.

Validate:
- field-specific fixtures pass.
- browser API usage is guarded for SSR/test environments.
- typecheck passes.

### Phase-Level Validation

After 5A-5F pass:
- run `tests/formedible/fields/*.test.tsx`
- run `tests/formedible/field-registry.test.ts`
- run `tests/formedible/field-wrapper.test.tsx`
- run `tests/formedible/use-field-state.test.ts`
- run `pnpm --filter ./packages/formedible check-types`
- run `pnpm --filter ./packages/formedible build`

---

## Phase 6: Validation Pipeline

**Type**: Sequential

### Implementer Task

Files to create:
- `packages/formedible/src/validation/build-validators.ts`
- `packages/formedible/src/validation/field-validators.ts`
- `packages/formedible/src/validation/form-validators.ts`
- `packages/formedible/src/validation/async-validators.ts`
- `packages/formedible/src/validation/error-mapping.ts`
- `tests/formedible/validation/field-validators.test.ts`
- `tests/formedible/validation/form-validators.test.ts`
- `tests/formedible/validation/async-validators.test.ts`
- `tests/formedible/validation/error-mapping.test.ts`
- `tests/formedible/validation/validation-pipeline.test.tsx`

Concrete requirements:
- Build one validator mapping layer for TanStack Form.
- Do not build an independent validation lifecycle.
- Validation precedence:
  1. built-in constraints from field config
  2. field-level `validation` Zod schema
  3. top-level `schema` Zod schema
  4. `crossFieldValidation`
  5. `asyncValidation` and `inlineValidation`
- Cross-field validation attaches errors to configured fields.
- Async/inline validation uses TanStack async validators/debounce, not custom exposed state.
- Nested Zod errors map to nested field paths.
- All errors render through normal field error UI.

### Validator Task

Read validation modules.

Validate:
- no separate exposed validation state.
- no independent validation lifecycle is implemented.
- precedence is implemented.
- validation fixtures pass.
- nested error fixtures pass.
- typecheck/build pass.

---

## Phase 7: Layout, Pages, Tabs, Persistence, Analytics

**Type**: Parallel

## Phase 7A: Layout And Sections

### Implementer Task

Files to create:
- `packages/formedible/src/components/layout/form-grid.tsx`
- `packages/formedible/src/components/layout/form-tabs.tsx`
- `packages/formedible/src/components/layout/form-accordion.tsx`
- `packages/formedible/src/components/layout/form-stepper.tsx`
- `tests/formedible/layout/form-grid.test.tsx`
- `tests/formedible/layout/form-tabs.test.tsx`
- `tests/formedible/layout/form-accordion.test.tsx`
- `tests/formedible/layout/form-stepper.test.tsx`
- `tests/formedible/layout/conditional-sections.test.tsx`

Requirements:
- Support `layout` config.
- Support field grid positioning props.
- Support section title/description/collapsible/defaultExpanded.
- Support conditional sections.

### Validator Task

Read layout and section files.

Validate:
- layout fixtures pass.
- grid positioning fixtures pass.
- conditional section fixtures pass.
- typecheck passes.

## Phase 7B: Pages And Tabs

### Implementer Task

Files to create:
- `packages/formedible/src/hooks/use-multi-page.ts`
- `packages/formedible/src/hooks/use-form-tabs.ts`
- `tests/formedible/navigation/use-multi-page.test.tsx`
- `tests/formedible/navigation/use-form-tabs.test.tsx`
- `tests/formedible/navigation/page-validation.test.tsx`
- `tests/formedible/navigation/conditional-pages.test.tsx`

Requirements:
- Page grouping by `field.page`.
- Tab grouping by `field.tab`.
- Conditional pages.
- Page validation before forward navigation.
- `onPageChange` behavior.
- Progress config/component support.

### Validator Task

Read page and tab hook files.

Validate:
- page fixtures pass.
- tab fixtures pass.
- page validation fixtures pass.
- conditional page fixtures pass.
- typecheck passes.

## Phase 7C: Persistence

### Implementer Task

Files to create:
- `packages/formedible/src/hooks/use-form-persistence.ts`
- `tests/formedible/persistence/use-form-persistence.test.tsx`

Requirements:
- localStorage/sessionStorage.
- debounce.
- exclude fields.
- restoreOnMount.
- save/load/clear helpers.
- storage errors are caught and logged descriptively.

### Validator Task

Read persistence hook and tests.

Validate:
- persistence fixtures pass.
- localStorage/sessionStorage behavior is guarded for SSR.
- storage error tests pass.
- typecheck passes.

## Phase 7D: Analytics

### Implementer Task

Files to create:
- `packages/formedible/src/hooks/use-form-analytics.ts`
- `tests/formedible/analytics/use-form-analytics.test.tsx`
- `tests/formedible/analytics/analytics-callbacks.test.tsx`

Requirements:
- Support analytics callbacks represented in `tests/fixtures/schema-fixtures/analytics.ts`.
- Track field, form, page, tab, and performance callbacks where configured.
- No analytics internals returned from the hook.
- No-op when analytics omitted.

### Validator Task

Read analytics hook and tests.

Validate:
- analytics fixtures pass.
- analytics omitted no-op tests pass.
- no analytics internals are exposed from `useFormedible`.
- typecheck passes.

### Phase-Level Validation

Validators read their assigned files and run targeted tests.

After 7A-7D:
- run `tests/formedible/layout/*.test.tsx`
- run `tests/formedible/navigation/*.test.tsx`
- run `tests/formedible/persistence/*.test.tsx`
- run `tests/formedible/analytics/*.test.tsx`
- run golden fixtures for pages, tabs, layout, persistence, analytics from `tests/fixtures/schema-fixtures/`
- run `pnpm --filter ./packages/formedible check-types`
- run `pnpm --filter ./packages/formedible build`

---

## Phase 8: shadcn Registry And Sync System

**Type**: Sequential subphases

## Phase 8A: Registry Root Item Definitions

### Implementer Task

Files to create:
- `registry.json`
- `tests/registry/registry-json.test.ts`
- `tests/registry/built-registry-item-json.test.ts`

Requirements:
- Root `registry.json` uses `$schema: "https://ui.shadcn.com/schema/registry.json"`.
- Root `registry.json` is the only source of truth for registry items.
- Do not invent directory-local per-item source manifests.
- Built item payloads under `public/r/*.json` are validated against `https://ui.shadcn.com/schema/registry-item.json`.
- Root registry item names:
  - `formedible`
  - `formedible-parser`
  - `formedible-builder`
  - `formedible-ai-builder`
- Registry item type is `registry:block` for all Formedible items because each item installs a coordinated set of source files.
- Each item declares:
  - `name`
  - `type`
  - `title`
  - `description`
  - `registryDependencies`
  - `dependencies`
  - `files`
- File entries use current shadcn file types:
  - `registry:component`
  - `registry:hook`
  - `registry:lib`
  - `registry:file`
  - `registry:ui` only for shadcn UI primitives
- Omit `target` for files that install to the default alias destination.
- Use `target` only for files whose installed path differs from the default destination derived from the temporary app `components.json`; tests enumerate every `target` entry.
- `registryDependencies` equals the set of shadcn primitives imported by installable source.
- `dependencies` list every external dependency imported by installable source, with versions supplied by the pnpm dependency policy.

Registry item ownership matrix:
- `formedible`:
  - files: core renderer source required for `useFormedible(options)`
  - registryDependencies: shadcn primitives imported by core renderer source
- `formedible-parser`:
  - files: parser source
  - registryDependencies: shadcn primitives imported by parser source, plus `formedible` only if installed parser source imports core renderer source
- `formedible-builder`:
  - files: builder source only
  - registryDependencies: `formedible`, `formedible-parser`, and shadcn primitives imported by builder source
- `formedible-ai-builder`:
  - files: AI builder source only
  - registryDependencies: `formedible`, `formedible-parser`, `formedible-builder`, and shadcn primitives imported by AI builder source
- Higher-level registry items do not include duplicate lower-level files in their own `files` list.
- Installing `formedible-builder` installs Formedible and parser through `registryDependencies`.
- Installing `formedible-ai-builder` installs Formedible, parser, and builder through `registryDependencies`.
- No two registry items install the same target path.

### Validator Task

Read:
- root `registry.json`

Validate:
- root JSON conforms to the official shadcn registry schema.
- root registry items contain the intended item definitions and file lists.
- registry items match the ownership matrix.
- file types are correct.
- registry dependencies are separated from external dependencies.
- no shadcn UI primitive is incorrectly owned by a Formedible registry item.

## Phase 8B: Copy-With-Sync Ownership And Drift Verification

### Implementer Task

Files to create:
- `scripts/sync-components.ts`
- `scripts/verify-synced-artifacts.ts`
- `tests/sync/sync-components.test.ts`
- `tests/sync/verify-synced-artifacts.test.ts`

Requirements:
- Define source ownership:
  - schema renderer and fields owned by `packages/formedible`
  - parser logic owned by `packages/formedible-parser`
  - builder logic owned by `packages/builder`
  - AI builder logic owned by `packages/ai-builder`
  - docs app owns docs only
- Sync core renderer source from `packages/formedible` into dependent source areas that must ship functional Formedible source in their shadcn registry items.
- Sync parser source from `packages/formedible-parser` into builder, AI builder, and web/docs areas that need parser behavior in registry-installed output.
- Sync builder source from `packages/builder` into AI builder and web/docs areas that need builder behavior in registry-installed output.
- Sync AI builder source from `packages/ai-builder` into web/docs areas that need AI builder demos or registry-installed output.
- Sync owned source into `registry/default/**` so each registry item contains the source files needed by a consumer after `shadcn add`.
- Generated synced artifacts are marked with a generated-file header naming their owning source directory.
- Verification script detects drift between owning source directories and all generated synced artifacts.
- Verification script fails if a generated synced artifact is edited directly instead of regenerated from the owning source directory.
- Sync routes are explicit; no directory glob may copy files into an unlisted destination.

### Validator Task

Read sync scripts and artifact verification tests.

Validate:
- ownership rules are encoded.
- sync routes match this phase exactly.
- generated synced artifacts are marked.
- verification catches modified synced artifacts.
- registry source receives the copied source required by every root `registry.json` item.
- web/docs receives only the synced source required for docs/examples and registry previews.
- sync dry run or test run passes.

## Phase 8C: Registry Source Files And Import Boundaries

### Implementer Task

Files/directories to create or verify:
- `registry/default/formedible/components/**`
- `registry/default/formedible/hooks/**`
- `registry/default/formedible/lib/**`
- `registry/default/formedible/types/**`
- `registry/default/formedible-parser/**`
- `registry/default/formedible-builder/**`
- `registry/default/formedible-ai-builder/**`
- `tests/registry/registry-source-imports.test.ts`

Requirements:
- Registry source files are produced by `sync-components`; manual implementation edits in `registry/default/**` are forbidden.
- Registry source files mirror synced monorepo source outputs without copying old current-repo implementation.
- Registry source imports follow the current shadcn registry source import pattern and are transformable by `shadcn build`.
- Registry source files do not import from monorepo source internals that will not exist in consumer projects.
- Registry source files import shadcn primitives through the alias pattern that the current shadcn CLI rewrites from the consumer `components.json`.
- Registry source files import other Formedible registry source files through `@/registry/default/...`, matching the current shadcn registry guidance.
- Every file listed in a root `registry.json` item exists.
- Every Formedible-owned source file intended for installation is listed in exactly one root `registry.json` item.

### Validator Task

Read registry source files and root `registry.json`.

Run:
- `pnpm sync-components`
- `pnpm registry:validate`

Validate:
- imports are consumer-safe.
- no source-internal path leaks into registry payloads.
- all root registry file paths exist.
- no installable file is omitted.
- generated-file headers are present on synced registry source.

## Phase 8D: Registry Build And Schema Validation Scripts

### Implementer Task

Files to create:
- `scripts/registry-build.ts`
- `scripts/registry-validate.ts`
- `tests/registry/registry-build.test.ts`
- `tests/registry/registry-validate.test.ts`

Requirements:
- `registry:build` runs the current shadcn CLI build command through pnpm.
- Build output goes to `public/r`.
- Expected built files:
  - `public/r/formedible.json`
  - `public/r/formedible-parser.json`
  - `public/r/formedible-builder.json`
  - `public/r/formedible-ai-builder.json`
- `registry:validate` validates root `registry.json` and built payloads against shadcn schemas.
- Validation fails on missing file paths, wrong file types, missing dependencies, malformed JSON, or stale build output.

### Validator Task

Read scripts and tests.

Run:
- `pnpm sync-components`
- `pnpm registry:build`
- `pnpm registry:validate`

Validate:
- built files are emitted to `public/r`.
- built payloads match root `registry.json` item definitions.
- schema validation catches bad registry items.

## Phase 8E: Registry Install Test In Temporary Consumer App

### Implementer Task

Files to create:
- `scripts/test-registry-install.ts`
- `tests/registry/registry-install.test.ts`

Requirements:
- Create a temporary consumer app during the test.
- Initialize shadcn in the temporary app using pnpm and the current CLI.
- Install each built registry item with `pnpm dlx shadcn@latest add <path-or-url-to-public-r-json>`.
- Verify installed files land in consumer paths based on that app's `components.json`.
- Verify installed imports compile in the consumer app.
- Verify installing `formedible-builder` alone installs the parser and core registry dependencies declared by root `registry.json`.
- Verify installing `formedible-ai-builder` alone installs AI, builder, parser, and core registry dependencies declared by root `registry.json`.

### Validator Task

Read install test script.

Run:
- `pnpm sync-components`
- `pnpm registry:build`
- `pnpm registry:test-install`

Validate:
- each registry item installs through shadcn CLI.
- installed consumer app typechecks.
- dependency and registryDependency behavior matches root `registry.json` definitions and built payloads.

## Phase 8F: shadcn Component Pattern, Styling, And Accessibility Compliance

### Implementer Task

Files to create:
- `tests/registry/shadcn-component-compliance.test.ts`
- `tests/a11y/formedible-field-a11y.test.tsx`
- `tests/a11y/registry-installed-field-a11y.test.tsx`

Write ownership for fixes needed by this phase:
- `packages/formedible/src/components/**`
- `packages/formedible/src/hooks/**`
- `packages/formedible/src/lib/**`
- `registry/default/formedible/**`

Requirements:
- Field wrappers and grouped field layouts use the current shadcn `Field`, `FieldGroup`, label, description, and error composition.
- Invalid fields expose `aria-invalid` and `data-invalid` consistently.
- Labels, descriptions, and errors are connected with stable ids.
- Required/disabled/read-only states are reflected in DOM attributes where the underlying control supports them.
- Tailwind classes use semantic tokens such as `bg-background`, `text-foreground`, `border-input`, `text-muted-foreground`, and `text-destructive`.
- Do not introduce raw hex colors, arbitrary one-off color palettes, manual dark-mode overrides, or `space-y-*` layout shortcuts inside registry/source components.
- Icon buttons use `lucide-react` icons and include accessible names.
- `alert` and `confirm` are forbidden.

### Validator Task

Read:
- component source files touched by the implementer
- registry source files touched by the implementer
- a11y and compliance tests

Run:
- `pnpm test:a11y`
- `pnpm sync-components`
- `pnpm registry:build`
- `pnpm registry:test-install`

Validate:
- compliance tests fail on missing `aria-invalid`, missing label/error wiring, raw color classes, `space-y-*`, or forbidden browser dialogs.
- installed registry components preserve the same a11y attributes after shadcn CLI installation.
- source components and registry-installed components do not drift.

## Phase 8G: Registry Client/SSR Boundary

### Implementer Task

Files to create:
- `tests/registry/registry-client-boundary.test.ts`
- `tests/ssr/formedible-ssr-import.test.tsx`
- `tests/ssr/registry-installed-ssr-import.test.tsx`

Write ownership for fixes needed by this phase:
- `packages/formedible/src/**`
- `registry/default/formedible/**`
- `apps/web/src/**`

Requirements:
- Files using React hooks, browser APIs, or interactive client behavior include `"use client"` where the target framework requires it.
- No browser globals are read at module scope.
- Persistence, analytics, file input, location, and AI/browser-only behavior are guarded for SSR import.
- Source-module imports and registry-installed imports can be evaluated in an SSR test environment.
- Docs app build does not depend on browser-only module initialization.

### Validator Task

Read touched source, registry, and web files.

Run:
- `pnpm test:ssr`
- `pnpm --filter ./apps/web build`
- `pnpm sync-components`
- `pnpm registry:build`
- `pnpm registry:test-install`

Validate:
- SSR import tests fail if browser globals are touched during module import.
- client-only files are marked consistently.
- registry-installed output keeps the same boundary behavior.

### Phase-Level Validation

After 8A-8G pass:
- run `pnpm registry:build`
- run `pnpm registry:validate`
- run `pnpm registry:test-install`
- run `tests/registry/*.test.ts`
- run `tests/sync/*.test.ts`
- run `pnpm test:ssr`
- run `pnpm test:a11y`

---

## Phase 9: Parser Source Area

**Type**: Sequential subphases

## Phase 9A: Parser Public API And Types

### Implementer Task

Files to create:
- `packages/formedible-parser/src/index.ts`
- `packages/formedible-parser/src/types.ts`
- `packages/formedible-parser/src/parser/supported-field-types.ts`
- `tests/parser/public-api.test.ts`
- `tests/parser/supported-field-types.test.ts`

Requirements:
- Preserve public exports:
  - `FormedibleParser`
  - parser config exports
  - supported field type info
  - public parser types
- Supported field types derive from observed aliases.
- Public types are compatible with parser fixtures.

### Validator Task

Read parser public API/type files.

Validate:
- public exports match required API.
- supported field types match observed aliases.
- typecheck passes.

## Phase 9B: Parser Sanitization And Input Detection

### Implementer Task

Files to create:
- `packages/formedible-parser/src/parser/sanitize.ts`
- `packages/formedible-parser/src/parser/input-format.ts`
- `tests/parser/sanitize.test.ts`
- `tests/parser/input-format.test.ts`

Requirements:
- Support JSON input.
- Support JS object literal input.
- Preserve safe sanitization behavior.
- Detect and reject/remove dangerous patterns covered by fixtures.
- Do not execute user-provided code.

### Validator Task

Read sanitization and input detection code.

Validate:
- sanitization fixtures pass.
- JSON/object-literal fixtures pass.
- implementation does not use `eval` or `Function`.

## Phase 9C: Zod Expression Parser

### Implementer Task

Files to create:
- `packages/formedible-parser/src/parser/zod-expression-parser.ts`
- `tests/parser/zod-expression-parser.test.ts`

Requirements:
- Support Zod expression strings.
- Support current chained expressions from fixtures.
- Support nested parentheses cases from fixtures.
- Return parser-safe schema representation expected by parser fixtures.

### Validator Task

Read Zod expression parser code.

Validate:
- Zod expression tests pass.
- nested/chained parser cases pass.
- no code execution is used.

## Phase 9D: Schema Inference And Parser Class

### Implementer Task

Files to create:
- `packages/formedible-parser/src/parser/schema-inference.ts`
- `packages/formedible-parser/src/parser/parser-config-schema.ts`
- `packages/formedible-parser/src/parser/formedible-parser.ts`
- `tests/parser/formedible-parser.test.ts`
- `tests/parser/schema-inference.test.ts`
- `tests/parser/parser-config-schema.test.ts`

Requirements:
- Compose public parser class from Phase 9A-9C modules.
- Preserve parser output shape for fixtures.
- Preserve validation/suggestion behavior where public.
- Implement schema inference behavior covered by fixtures.
- Do not copy old parser file wholesale.

### Validator Task

Read parser class, config schema, and inference code.

Validate:
- parser fixture outputs are equivalent.
- validation/suggestion fixtures pass.
- schema inference fixtures pass.
- typecheck/build pass.

### Phase-Level Validation

After 9A-9D pass:
- run `tests/parser/*.test.ts`
- run `pnpm --filter ./packages/formedible-parser check-types`
- run `pnpm --filter ./packages/formedible-parser build`

---

## Phase 10: Builder Source Area

**Type**: Sequential subphases

## Phase 10A: Builder Public API, Types, Store, Context

### Implementer Task

Files to create:
- `packages/builder/src/index.ts`
- `packages/builder/src/types.ts`
- `packages/builder/src/store/field-store.ts`
- `packages/builder/src/context/builder-context.tsx`
- `tests/builder/public-api.test.ts`
- `tests/builder/field-store.test.ts`
- `tests/builder/builder-context.test.tsx`

Requirements:
- Preserve public exports:
  - `FormBuilder`
  - `FieldConfigurator`
  - `FormPreview`
  - `builderTab`
  - `previewTab`
  - `codeTab`
  - `defaultTabs`
  - public prop types
- Use new `FieldConfig` types.
- Implement builder store CRUD/subscription behavior covered by fixtures.
- Implement context/provider state contract.
- Do not edit synced artifacts directly.

### Validator Task

Read builder public API, types, store, and context code.

Validate:
- public exports match required API.
- store/context fixtures pass.
- typecheck passes.

## Phase 10B: Form Builder Shell And Default Tabs

### Implementer Task

Files to create:
- `packages/builder/src/components/form-builder.tsx`
- `packages/builder/src/components/default-tabs.tsx`
- `tests/builder/form-builder.test.tsx`
- `tests/builder/default-tabs.test.tsx`

Requirements:
- `FormBuilder` composes provider/context from Phase 10A.
- Default tabs preserve public names and behavior.
- Shell supports current public props from builder fixtures.
- Field configurator and preview are injected/omitted through typed extension points until Phase 10C/10D; do not create fake implementations.

### Validator Task

Read form builder shell and default tabs code.

Validate:
- builder fixtures pass.
- default tab fixtures pass.
- typecheck passes.

## Phase 10C: Field Configurator

### Implementer Task

Files to create:
- `packages/builder/src/components/field-configurator.tsx`
- `tests/builder/field-configurator.test.tsx`

Requirements:
- Supports configurable `FieldConfig` properties represented in `tests/fixtures/builder-fixtures.ts`.
- Uses new core types.
- Preserves current public component props.
- Emits schema-compatible field configs.
- Does not use `alert` or `confirm`.

### Validator Task

Read field configurator code.

Validate:
- configurator fixtures pass.
- emitted configs pass core normalization fixtures.
- typecheck passes.

## Phase 10D: Preview And Code Generation

### Implementer Task

Files to create:
- `packages/builder/src/components/form-preview.tsx`
- `packages/builder/src/codegen/generate-form-code.ts`
- `tests/builder/form-preview.test.tsx`
- `tests/builder/generate-form-code.test.ts`

Requirements:
- Preview uses new core schema renderer.
- Generated code uses compatible `useFormedible` schemas.
- Generated code preserves parser/builder fixture expectations.
- Codegen handles field aliases and config objects from fixtures.

### Validator Task

Read preview and codegen code.

Validate:
- generated code fixtures pass.
- preview fixtures pass.
- typecheck/build pass.

### Phase-Level Validation

After 10A-10D pass:
- run `tests/builder/*.test.ts`
- run `tests/builder/*.test.tsx`
- run `pnpm --filter ./packages/builder check-types`
- run `pnpm --filter ./packages/builder build`

---

## Phase 11: AI Builder Source Area

**Type**: Sequential subphases

## Phase 11A: AI Builder Public API And Types

### Implementer Task

Files to create:
- `packages/ai-builder/src/index.ts`
- `packages/ai-builder/src/types.ts`
- `tests/ai-builder/public-api.test.ts`
- `tests/ai-builder/types.test-d.ts`

Requirements:
- Preserve public exports:
  - `AIBuilder`
  - `AiFormRenderer`
  - `parseAiToFormedible`
  - `ProviderSelection`
  - public prop/result/provider types
- Public types match fixtures.

### Validator Task

Read AI public API and type code.

Validate:
- public exports match required API.
- type fixtures pass.
- typecheck passes.

## Phase 11B: AI Parser And Form Renderer

### Implementer Task

Files to create:
- `packages/ai-builder/src/parser/parse-ai-to-formedible.ts`
- `packages/ai-builder/src/components/ai-form-renderer.tsx`
- `tests/ai-builder/parse-ai-to-formedible.test.ts`
- `tests/ai-builder/ai-form-renderer.test.tsx`

Requirements:
- `parseAiToFormedible` preserves public result shape.
- Generated AI schemas must pass core schema-renderer fixture validation.
- `AiFormRenderer` uses parser/core schema-renderer outputs.
- Do not copy old AI builder files wholesale.

### Validator Task

Read AI parser and form renderer code.

Validate:
- AI parser fixtures pass.
- AI generated schemas render through core fixtures.
- renderer fixtures pass.
- typecheck passes.

## Phase 11C: Provider Selection And Chat Builder Shell

### Implementer Task

Files to create:
- `packages/ai-builder/src/components/provider-selection.tsx`
- `packages/ai-builder/src/components/chat-interface.tsx`
- `packages/ai-builder/src/components/ai-builder.tsx`
- `tests/ai-builder/provider-selection.test.tsx`
- `tests/ai-builder/chat-interface.test.tsx`
- `tests/ai-builder/ai-builder.test.tsx`

Requirements:
- `ProviderSelection` preserves public props and provider config behavior.
- `ChatInterface` supports direct/backend mode contracts from fixtures.
- `AIBuilder` composes provider, chat, parser, renderer, and generated form callback behavior.
- Rebuild internals cleanly.

### Validator Task

Read provider, chat, and AI builder shell code.

Validate:
- provider fixtures pass.
- `AIBuilder` fixtures pass.
- typecheck/build pass.

### Phase-Level Validation

After 11A-11C pass:
- run `tests/ai-builder/*.test.ts`
- run `tests/ai-builder/*.test.tsx`
- run `tests/ai-builder/*.test-d.ts`
- run `pnpm --filter ./packages/ai-builder check-types`
- run `pnpm --filter ./packages/ai-builder build`

---

## Phase 12: Web Docs/Demo App

**Type**: Sequential subphases

## Phase 12A: Docs App Shell And Shared Components

### Implementer Task

Files/directories to create or port:
- `apps/web/src/components/doc-card.tsx`
- `apps/web/src/components/code-block.tsx`
- `apps/web/src/components/example-shell.tsx`
- `apps/web/src/components/navigation-sidebar.tsx`
- `apps/web/src/components/theme-provider.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/docs/layout.tsx`
- `tests/web/docs-shell.test.tsx`
- `tests/web/docs-shared-components.test.tsx`

Requirements:
- Create docs/demo shell only.
- No full docs content in this subphase.
- Components support docs pages for getting started, fields, advanced fields, validation, persistence, analytics, pages, tabs, parser, builder, and AI builder.
- Shell imports synced copies during monorepo development and verifies registry-installed output through Phase 8 tests.
- Docs app can serve `public/r/*.json` registry payloads.
- Root-site content negotiation is not part of this rewrite plan.

### Validator Task

Read docs shell and shared component files.

Validate:
- shell builds.
- shared components are not copied old app implementation wholesale.
- no `alert` or `confirm`.

## Phase 12B: Core Formedible Docs And Examples

### Implementer Task

Files/directories to create or port:
- `apps/web/src/app/docs/getting-started/**`
- `apps/web/src/app/docs/fields/**`
- `apps/web/src/app/docs/advanced-fields/**`
- `apps/web/src/app/examples/core/**`
- `tests/web/core-docs.test.tsx`
- `tests/web/core-examples.test.tsx`

Requirements:
- Docs use schemas from golden fixtures.
- Examples cover basic, advanced, array, object, nested, custom component, wrapper, and personalization schemas.
- Examples avoid old internal exports.
- Examples avoid `alert` and `confirm`.

### Validator Task

Read core docs/example files.

Validate:
- examples compile.
- examples correspond to golden fixtures.
- no stale old internal API docs.

## Phase 12C: Validation, Persistence, Analytics, Pages, Tabs Docs

### Implementer Task

Files/directories to create or port:
- `apps/web/src/app/docs/validation/**`
- `apps/web/src/app/docs/persistence/**`
- `apps/web/src/app/docs/analytics/**`
- `apps/web/src/app/docs/multi-page-or-navigation/**`
- `apps/web/src/app/docs/tabs/**`
- `apps/web/src/app/examples/behavior/**`
- `tests/web/behavior-docs.test.tsx`
- `tests/web/behavior-examples.test.tsx`

Requirements:
- Remove docs for old debug return helpers:
  - `crossFieldErrors`
  - `asyncValidationStates`
  - `validateAsync`
  - `triggerAsyncValidation`
- Docs must teach validation through rendered field errors.
- Examples must avoid `alert` and `confirm`.
- Examples use compatible schemas from fixtures.

### Validator Task

Read behavior docs/example files.

Validate:
- no stale debug helper docs.
- examples compile.
- no `alert` or `confirm`.
- docs examples correspond to golden fixtures.

## Phase 12D: Parser, Builder, AI Builder Docs

### Implementer Task

Files/directories to create or port:
- `apps/web/src/app/docs/formedible-parser/**`
- `apps/web/src/app/docs/builder/**`
- `apps/web/src/app/docs/ai-builder/**`
- `apps/web/src/app/examples/parser-builder-ai/**`
- `tests/web/parser-docs.test.tsx`
- `tests/web/builder-docs.test.tsx`
- `tests/web/ai-builder-docs.test.tsx`

Requirements:
- Docs preserve high-level parser, builder, and AI builder public APIs.
- Parser examples use parser fixtures.
- Builder examples use builder fixtures.
- AI examples use AI builder fixtures.
- No docs for copied internal renderer/field exports.
- Examples avoid `alert` and `confirm`.

### Validator Task

Read parser/builder/AI docs/example files.

Validate:
- public API docs match the high-level parser/builder/AI entrypoints.
- examples compile.
- docs examples correspond to fixtures.
- no `alert` or `confirm`.

### Phase-Level Validation

After 12A-12D pass:
- run `pnpm --filter ./apps/web check-types`
- run `pnpm --filter ./apps/web build`
- run `tests/web/*.test.tsx`

---

## Phase 12E: CI Workflow Gate

**Type**: Sequential

### Implementer Task

Files to create:
- `.github/workflows/ci.yml`
- `tests/ci/workflow-commands.test.ts`

Requirements:
- CI uses pnpm and the repo's pinned package manager configuration.
- CI installs dependencies from the lockfile.
- CI runs:
  - `pnpm check-types`
  - `pnpm build`
- Workflow test checks the CI command list so local scripts and CI cannot drift silently.

### Validator Task

Read:
- `.github/workflows/ci.yml`
- root `package.json`
- `tests/ci/workflow-commands.test.ts`

Validate:
- CI has no npm/npx commands.
- CI does not skip `check-types` or `build`.
- CI command names exist in root scripts.
- workflow command drift test would fail if a required command is removed.

---

## Phase 13: Final Integration Gate

**Type**: Sequential

### Fixer Task Only If Validator Fails

No planned implementer is dispatched for Phase 13. If the validator finds integration failures, dispatch fixers only for the specific files named in the validator report.

Expected commands:

```bash
pnpm check-types
pnpm build
```

### Validator Task

Read:
- root workspace scripts
- registry source files under `registry/default/**`
- root registry definitions in `registry.json`
- `tests/fixtures/fixture-manifest.json`
- fixture-backed test files under `tests/formedible`, `tests/parser`, `tests/builder`, `tests/ai-builder`, and `tests/web`
- high-level source entrypoints
- changed docs
- root `registry.json`
- CI workflow

Run:
- `pnpm check-types`
- `pnpm build`

Validate final success criteria:
- no old god files copied
- no old renderer internals copied
- dependency versions centralized
- all golden fixtures pass
- nested path fixtures pass
- schema compatibility passes
- CI workflow runs the same required gates as the final integration validator
- high-level parser/builder/AI exports preserved
- docs do not mention removed debug helper returns

---

## Subagent Dispatch Matrix

Use these write ownership boundaries:

- Phase 0 validator: scaffold validation only
- Phase 0A implementer: workspace package/app surfaces only
- Phase 1A implementer: fixture extraction harness only
- Phase 1B implementer: core form schema fixtures only
- Phase 1C implementer: behavior schema fixtures only
- Phase 1D implementer: alias and nested path fixtures only
- Phase 1E implementer: parser/builder/AI fixtures only
- Phase 2A implementer: public entry/form option/return types only
- Phase 2B implementer: field config/field prop types only
- Phase 2C implementer: layout/validation/analytics/persistence/parser compatibility types only
- Phase 3A implementer: field/option normalization only
- Phase 3B implementer: dynamic text only
- Phase 3C implementer: field paths/Zod error lookup only
- Phase 4A implementer: hook contract and form shell only
- Phase 4B implementer: field/content/conditional rendering only
- Phase 4C implementer: sections/navigation/progress shells only
- Phase 5A implementer: registry/wrapper only
- Phase 5B implementer: basic fields only
- Phase 5C implementer: choice/search fields only
- Phase 5D implementer: specialized scalar fields only
- Phase 5E implementer: array/object nested structure fields only
- Phase 5F implementer: file/location/duration/phone fields only
- Phase 6 implementer: validation modules only
- Phase 7A implementer: layout/sections only
- Phase 7B implementer: pages/tabs only
- Phase 7C implementer: persistence only
- Phase 7D implementer: analytics only
- Phase 8A implementer: registry root item definitions only
- Phase 8B implementer: copy-with-sync ownership and drift verification only
- Phase 8C implementer: registry source files/import boundaries only
- Phase 8D implementer: registry build/schema validation scripts only
- Phase 8E implementer: registry temporary consumer install test only
- Phase 8F implementer: shadcn component compliance and a11y tests only
- Phase 8G implementer: registry/source SSR client-boundary tests only
- Phase 9A implementer: parser public API/types only
- Phase 9B implementer: parser sanitization/input detection only
- Phase 9C implementer: Zod expression parser only
- Phase 9D implementer: parser class/schema inference/config only
- Phase 10A implementer: builder API/types/store/context only
- Phase 10B implementer: builder shell/default tabs only
- Phase 10C implementer: field configurator only
- Phase 10D implementer: preview/code generation only
- Phase 11A implementer: AI public API/types only
- Phase 11B implementer: AI parser/form renderer only
- Phase 11C implementer: provider/chat/AI builder shell only
- Phase 12A implementer: docs app shell/shared docs components only
- Phase 12B implementer: core Formedible docs/examples only
- Phase 12C implementer: validation/persistence/analytics/pages/tabs docs only
- Phase 12D implementer: parser/builder/AI docs only
- Phase 12E implementer: CI workflow gate only
- Phase 13 validator: final integration only

Validators must never modify files. Fixers modify only files named in validator reports.

## Halt Conditions

Halt execution if:
- a phase still fails after 3 fixer attempts
- dependency installation is impossible
- fixtures cannot be extracted from the current repo
- a required public compatibility behavior contradicts another accepted requirement
- generated schemas cannot be made to render without changing the accepted schema contract
