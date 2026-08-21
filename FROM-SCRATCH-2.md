# Formedible From-Scratch Rewrite Plan 2

## Purpose

This is the corrected from-scratch plan for Formedible.

It replaces the failed interpretation of the earlier plan. It must be read together with `REWRITE-CONSTRAINTS.md`; if anything here appears to conflict with that file, the stricter no-mirror, no-workaround, shadcn-install-surface rule wins.

## Product Identity

Formedible is a shadcn component system over TanStack Form.

Users install source files through shadcn. Users do not install Formedible as npm packages. The monorepo directories are authoring locations for shadcn components, hooks, libs, parser, builder, AI builder, and docs.

TanStack Form owns form state, field APIs, subscriptions, validation lifecycle, and submission.

Formedible owns schema interpretation, compatibility normalization, field selection, shadcn wiring, labels, help, errors, layout, pages, tabs, persistence helpers, analytics callbacks, parser, builder, and AI builder behavior around Formedible schemas.

## Non-Negotiable Corrections

1. No `registry/default/**` source tree.
2. No registry mirror.
3. No source rewrite sync.
4. No Formedible import path or copied directory containing `generated/formedible`; real shadcn-installed copies at the exact paths created by `shadcn add` are expected.
5. The only non-authored outputs are shadcn-built registry payloads and app/tooling outputs such as route tree files.
6. Sync is copy-only, modeled after the original `scripts/quick-sync.js`.
7. Each component source directory owns its registry config and runs shadcn build from that directory.
8. The built shadcn payload is the installable output.
9. Components are real shadcn TSX components using shadcn primitives, not raw HTML substitutes.
10. The docs app uses Formedible like any other app: by importing the installed/copied hook and components from the same paths a shadcn consumer gets.

## No-Guessing Rule

Do not invent configuration from memory or training data.

Before changing TypeScript, package, shadcn, registry, sync, or build configuration:

1. inspect the current scaffold-owned config files
2. inspect the original repo only for proven behavior and prior shadcn/sync shape
3. inspect current tool docs or CLI output when tool behavior matters
4. change only the minimum required settings
5. validate with real commands

For TypeScript specifically:

1. do not write a full config from scratch when a scaffold base config exists
2. preserve scaffold defaults unless a concrete failure requires an override
3. do not add `target`, `lib`, `module`, `type`, `verbatimModuleSyntax`, or similar defaults by guess
4. do not use `NodeNext` anywhere for authored shadcn source
5. do not add `.js` imports to `.ts` or `.tsx`
6. do not solve build/config problems with source import pollution
7. use `tsc --showConfig`, real typecheck, and shadcn build to prove the config
8. authored shadcn source uses browser/app-oriented TypeScript resolution, specifically `moduleResolution: "Bundler"` or the scaffold's proven equivalent

The expected TypeScript direction for shadcn source directories is minimal: extend the scaffold base config, typecheck `src/**/*.ts` and `src/**/*.tsx`, use extensionless imports, never use `NodeNext`, and set only the local alias needed for that source directory to match shadcn-installed consumer paths.

## Authoritative Source Directories

These are source directories, not npm package contracts:

1. `packages/formedible/src` owns the core shadcn Formedible renderer.
2. `packages/formedible-parser/src` owns the parser shadcn install surface.
3. `packages/builder/src` owns the visual builder shadcn install surface.
4. `packages/ai-builder/src` owns the AI builder shadcn install surface.
5. `apps/web/src` owns docs, examples, app routes, and local demonstration wiring only.

Each source directory must be authored in consumer-installable shadcn shape from the start. No later transform may make it installable.

## Registry Build Model

Each source directory has its own shadcn registry config, like the original repo:

1. `packages/formedible/registry.json`
2. `packages/formedible-parser/registry.json`
3. `packages/builder/registry.json`
4. `packages/ai-builder/registry.json`

Running shadcn build inside each directory produces only that directory's registry payload output, for example under that directory's `public/r` output location.

Registry files list real source files under that same source directory. They do not point at an intermediate tree.

The core registry item declares shadcn dependencies such as `button`, `input`, `textarea`, `select`, `checkbox`, `switch`, `label` or `field`, `calendar`, `popover`, `command`, `badge`, `slider`, `radio-group`, `progress`, `tabs`, `accordion`, `sonner`, and any other shadcn primitive actually imported by authored files.

External dependencies are separate from shadcn registry dependencies.

## Sync Model

Sync is a development shortcut for slow `shadcn add`.

Sync reads the owning source directory's `registry.json` file list and directly copies the listed source files from the owning source directory to the exact local paths where `shadcn add` would install them.

Sync never reads shadcn-built registry payloads as its source of truth. Built registry payloads are for shadcn installation tests and distribution output only.

Sync may:

1. read source-directory `registry.json` file lists
2. copy files
3. create destination directories
4. warn when a listed source file is missing

Sync must not:

1. rewrite imports
2. rewrite source content
3. inject headers
4. add `.js` suffixes
5. create replacement entry files that hide invalid source structure
6. create registry mirrors
7. create Formedible import paths or copied directories containing `generated/formedible`

Copy routes should follow the original intent. Each destination is a real local shadcn install path, not a special generated import path:

1. core Formedible files copy into docs app, parser source, builder source, and AI builder source at the exact paths where `shadcn add` would install them.
2. parser files copy into docs app, builder source, and AI builder source at the exact paths where `shadcn add` would install them.
3. builder files copy into docs app and AI builder source at the exact paths where `shadcn add` would install them.
4. AI builder files copy into docs app at the exact paths where `shadcn add` would install them.

These copied files are local shadcn installs, not authored source mirrors. Fixes start in the owning source directory and sync copies the updated install surface.

## Compatibility Evidence

The primary compatibility evidence is the original docs examples:

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

API and guide pages clarify public behavior only after examples are checked.

Use the phrase compatibility examples for extracted evidence. Do not invent other vague names in implementation prompts.

The old reference repo may be read only for public behavior, compatibility examples, registry config shape, copy-only sync behavior, shadcn dependency evidence, and domain logic evidence. Do not reproduce old source structure just because it exists.

## Core Public Usage

The docs examples use the hook directly:

```tsx
import { useFormedible } from "@/hooks/use-formedible";

const { Form } = useFormedible({
  fields,
  schema,
  formOptions,
});

return <Form className="..." />;
```

The rewrite must keep that usage model for shadcn-installed consumers.

The exact import path is determined by the shadcn install target, but the docs app must use the same hook path a consumer app uses after shadcn installation, such as `@/hooks/use-formedible` when that is the registry target.

## `useFormedible` Return Contract

The return shape should remain close where helpers are useful public behavior, while removing values that existed only because the old code duplicated TanStack Form responsibilities.

Keep:

1. `form`
2. `Form`
3. `currentPage`
4. `totalPages`
5. `visiblePages`
6. `goToNextPage`
7. `goToPreviousPage`
8. `setCurrentPage`
9. `isFirstPage`
10. `isLastPage`
11. `progressValue`
12. `saveToStorage`
13. `loadFromStorage`
14. `clearStorage`

Remove or replace through proper TanStack Form usage:

1. `crossFieldErrors`
2. `asyncValidationStates`
3. `validateCrossFields`
4. `validateFieldAsync`

Reason: these are symptoms of custom validation state and custom async validation state. The rewrite maps cross-field, async, and inline validation into TanStack Form validators and renders errors through the normal field error UI.

Before finalizing this return contract, create a compatibility table from original examples and API/docs pages with columns: name, old source evidence, keep/remove, reason, replacement if removed.

## Input Compatibility Contract

Existing public schemas must work unchanged.

Required input behavior includes:

1. `FieldConfig` names and option shapes used by compatibility examples
2. `UseFormedibleOptions` names and option shapes used by compatibility examples
3. top-level `schema`
4. `formOptions.defaultValues`
5. `formOptions.onSubmit`
6. `fields`
7. `pages`
8. `tabs`
9. `progress`
10. `layout`
11. `conditional`
12. conditional pages
13. nested conditionals inside array/object items
14. `persistence`
15. `analytics`
16. `crossFieldValidation`
17. `asyncValidation`
18. `inlineValidation`
19. `autoSubmitOnChange`
20. `section`
21. custom submit labels and button classes
22. custom components and wrappers when present in examples/docs

The old internal file structure, old renderer names, copied field exports, and debug state do not define the rewrite.

## Field Type Compatibility

Accepted field type strings must come from the original docs examples, API/docs pages, parser outputs, builder outputs, and AI builder outputs.

Known required field types include:

1. `text`
2. `email`
3. `password`
4. `url`
5. `tel`
6. `textarea`
7. `number`
8. `select`
9. `radio`
10. `checkbox`
11. `switch`
12. `date`
13. `slider`
14. `rating`
15. `phone`
16. `file`
17. `array`
18. `object`
19. `multiSelect`
20. `multiselect`
21. `combobox`
22. `autocomplete`
23. `multiCombobox`
24. `multicombobox`
25. `color`
26. `colorPicker`
27. `duration`
28. `location`
29. `masked`
30. `maskedInput`

Normalization resolves aliases before rendering. Raw user objects are never mutated.

## Shadcn Component Requirements

Core fields are shadcn components.

Basic mappings:

1. `text`, `email`, `password`, `url`, `tel`, `masked`, `maskedInput` use shadcn `Input` with the correct input behavior.
2. `textarea` uses shadcn `Textarea`.
3. `select` uses shadcn `Select`.
4. `checkbox` uses shadcn `Checkbox`.
5. `switch` uses shadcn `Switch`.
6. `radio` uses shadcn `RadioGroup`.
7. `slider` uses shadcn `Slider`.
8. `date` uses shadcn `Calendar` and `Popover` composition.
9. `combobox`, `autocomplete`, `multiCombobox` use shadcn `Command` and `Popover` composition.
10. `multiSelect` uses shadcn-compatible popover/command/badge/button composition.
11. `array` and `object` use shadcn `Card`, `Accordion`, `Button`, `Field`, and `FieldGroup` style composition as appropriate.
12. `file`, `location`, `duration`, `color`, `rating`, and `phone` use shadcn shell/wrapper primitives around their custom domain logic.

Form field presentation uses shadcn form composition:

1. `FieldGroup` for form field groups
2. `Field` for each field wrapper
3. `FieldLabel`
4. `FieldDescription`
5. `FieldError` or equivalent current shadcn error presentation
6. `aria-invalid` on controls
7. `data-invalid` on field wrappers

Raw HTML is not acceptable where shadcn provides the primitive.

## Core Architecture

Target source organization:

```text
packages/formedible/src/
├── hooks/
│   ├── use-formedible.tsx
│   ├── use-field-state.ts
│   ├── use-form-persistence.ts
│   ├── use-form-analytics.ts
│   ├── use-multi-page.ts
│   └── use-form-tabs.ts
├── components/
│   └── formedible/
│       ├── form.tsx
│       ├── field-renderer.tsx
│       ├── content-renderer.tsx
│       ├── section-renderer.tsx
│       ├── navigation.tsx
│       ├── progress.tsx
│       ├── fields/
│       └── layout/
├── lib/
│   ├── formedible/
│   │   ├── types.ts or split type modules
│   │   ├── normalize-field-config.ts
│   │   ├── normalize-options.ts
│   │   ├── template-interpolation.ts
│   │   ├── validation.ts
│   │   ├── field-path.ts
│   │   ├── colors.ts
│   │   └── date.ts
│   └── utils.ts
└── components/ui/
```

The exact split can change, but responsibilities must stay small and shadcn-installable.

Do not create files solely to satisfy a line-count target. Split only by responsibility.

## Validation Architecture

All validation uses TanStack Form's validation pipeline.

Required mapping:

1. built-in constraints map to field validators
2. field-level `validation` maps to field validators
3. top-level `schema` maps to form and field error resolution
4. `crossFieldValidation` maps to TanStack form or field validators without external error state
5. `asyncValidation` maps to TanStack async validators and debounce
6. `inlineValidation` maps to TanStack async validators and debounce

All validation errors render in the normal field error area.

No custom validation state return is required for behavior that TanStack Form already exposes correctly.

## Nested Field Requirements

Nested fields must use real TanStack paths.

Required behavior:

1. object subfield: `object.child`
2. array primitive item: `array[0]`
3. array object subfield: `array[0].child`
4. nested object in array: `array[0].object.child`
5. nested conditionals inside object/array receive the local item values where the original examples require that behavior
6. array sorting preserves submitted values and field identity
7. nested schema errors render beside the nested field where possible

The `conditional-in-obj.tsx` example is mandatory compatibility evidence for local nested conditional behavior.

## Advanced Field Logic To Preserve

Rewrite behavior, do not copy old files.

Behavior worth preserving from the original includes:

1. template interpolation with `{{fieldName}}`
2. dynamic labels, descriptions, placeholders, and page text
3. dynamic options based on form values
4. array object item add/remove/sort behavior
5. object field layout and collapsible behavior
6. date disabled-date behavior using current form values
7. color format handling
8. duration arithmetic and submitted value shape
9. location search/geolocation/manual behavior
10. phone formatting config
11. file upload config and callbacks
12. parser sanitization and Zod expression parsing behavior
13. builder field store behavior and code generation behavior
14. AI parser-to-Formedible schema behavior

## Parser, Builder, AI Builder

These are shadcn component source surfaces, not npm package APIs.

Parser preserves:

1. `FormedibleParser`
2. parser config exports
3. supported field type information
4. JSON/object literal/Zod expression input behavior
5. sanitization behavior
6. schema inference behavior

Builder preserves:

1. `FormBuilder`
2. `FieldConfigurator`
3. `FormPreview`
4. default tabs
5. field store behavior
6. code generation behavior

AI builder preserves:

1. `AIBuilder`
2. `AiFormRenderer`
3. `parseAiToFormedible`
4. provider selection behavior
5. conversation and AI-produced schema behavior present in original docs/examples

No placeholder exports. If a public component is exported, it must be the real component.

## Docs App Requirements

The docs app demonstrates real consumer usage.

Docs examples must:

1. import `useFormedible` from the same path a shadcn consumer uses
2. render real `<Form />` output
3. include compatibility examples based on original docs examples
4. avoid direct imports from old reference files
5. avoid test-only data imports in runtime app code
6. avoid documenting removed validation/debug return helpers after the new compatibility table approves their removal

The docs app route tree may be generated by its framework tooling. That is unrelated to Formedible source architecture.

## Required Compatibility Examples

Create named compatibility examples for:

1. contact form
2. registration form
3. checkout form
4. job application form
5. survey form with dynamic options
6. conditional pages form
7. persistence form
8. tabbed form
9. array fields form
10. nested conditional object-in-array form
11. flow form
12. rental car flow with dynamic text and conditional navigation
13. analytics tracking form
14. advanced field types form

Each compatibility example must state:

1. source file in the original reference
2. public behavior being preserved
3. fields used
4. options used
5. return helpers used, if any
6. assertions required

## Acceptance Gates

The rewrite is acceptable only when:

1. `pnpm check-types` passes.
2. `pnpm build` passes.
3. each source directory's shadcn build succeeds.
4. copy-only sync succeeds.
5. a temporary shadcn app can install each shadcn payload with `shadcn add`.
6. the temporary shadcn app can import the installed hook/components from the exact paths created by `shadcn add`.
7. the temporary shadcn app can render representative compatibility examples.
8. basic fields use shadcn primitives.
9. no registry mirror exists.
10. no source rewrite sync exists.
11. no Formedible import path or copied directory containing `generated/formedible` exists.
12. no placeholder public component exists.
13. no raw HTML substitute exists for available shadcn primitives.
14. removed validation/debug return helpers have approved replacements through TanStack Form behavior.

## Final Standard

The final architecture must be explainable as:

Formedible authors shadcn-installable source in each component source directory, builds registry payloads from those directories, uses copy-only sync as local `shadcn add`, and renders compatibility examples through TanStack Form and shadcn components.

## Intentional divergences (post-review)

Review of the rewrite against the old reference surfaced five large DEGRADED gaps plus a few small residuals. Decision D13 of the fix plan (`.review/session-20260819/fix-plan.md`, Phase 24.3) chose to document them as intentional divergences instead of adding implementation phases. Each item below states the divergence from the old reference, the rationale, and the rewrite's replacement where one exists. The compatibility fixtures mirror these dispositions: `tests/compatibility-examples/core-examples.ts` annotates the location map rows, and `tests/compatibility-examples/form-options-analytics-contract.ts` carries the `autoScroll` row.

### D6 — Location map rendering

Divergence: the old reference rendered an interactive tile map inside `location` fields, with `mapProvider` selection (Leaflet) and tile-provider configuration (`googleMaps`, `openStreetMap`, `bingMaps`). The rewrite ships no map UI. `FormedibleLocationConfig` keeps `showMap` typed so legacy schemas still compile, but the renderer ignores it; no `mapProvider` or tile-provider option exists.

Rationale: a tile map drags in a heavy external dependency (Leaflet, marker assets, provider SDKs) and per-provider API-key contracts that do not fit the shadcn-installable-source model, where consumers copy source files rather than install dependency bundles.

Replacement: the location value contract is fully preserved without a map. The `location` field renders address search (debounced `searchCallback` with `searchOptions`), a geolocation button (browser API with `reverseGeocodeCallback` address enrichment), manual lat/lng entry, and a coordinates/address summary card. Consumers that need a map render their own beside the field using the emitted `lat`/`lng` value.

### D7 — Custom progress, page, and submit-button component slots

Divergence: the old reference accepted custom React components for the progress display (`progress.component`), page chrome (`page.component`), and the submit button (`submitButton`). The rewrite types none of these slots: `FormedibleProgressConfig` is declarative (`showSteps`, `showPercentage`), `FormediblePageConfig` carries only title/description/conditional, and the submit button is a fixed shadcn `Button`.

Rationale: chrome-level component slots re-create a second renderer API inside the renderer; every slot multiplies the shadcn composition surface that must stay installable and typed.

Replacement: styling hooks and native controls. `submitLabel`, `showSubmitButton`, `buttonClassName`, `submitButtonClassName`, `formClassName`, `fieldClassName`, and `labelClassName` (the className set was restored in Phase 22) style the built-in shadcn controls. Field-level component customization is not affected by this divergence: `field.component`, `defaultComponents` registry entries, and `globalWrapper` remain supported.

### D8 — Core layout system

Divergence: the old reference had a top-level `layout` option driving grid/flex arrangement of all fields, plus `conditionalSections`, `group`, and the per-field grid placement props (`gridColumn`, `gridRow`, `gridColumnSpan`, `gridRowSpan`, `gridArea`). The rewrite has no top-level `layout` option and none of those keys.

Rationale: a general layout engine duplicates CSS grid/flex through a config schema and complicates the shadcn composition the rewrite standardizes on.

Replacement: field-level `section` (title, description, `collapsible`, `defaultExpanded`) groups consecutive fields, and object/array-object configs expose `layout: 'stack' | 'grid'` (legacy `vertical`/`horizontal` normalize to `stack`) with `columns` for nested-field arrangement. Page-level arrangement is the consumer's own markup around `<Form />`.

### D11 — `currentPage` visible-index semantics

Divergence: in the old reference, `currentPage` was an index into the visible-page list, so its numeric value shifted when conditional pages hid entries. In the rewrite, `currentPage` is the actual page number from the field/page configs; `totalPages` is the count of currently visible pages and `visiblePages` lists their numbers. `goToNextPage`/`goToPreviousPage` still step across hidden pages by walking the visible list.

Rationale: page-number semantics match what `pages[].page`, `fields[].page`, and analytics callbacks already exchange, removing a hidden index indirection that only existed to keep the pointer stable across visibility changes.

Replacement for the clamping case: when a conditional page hides the current page, an effect resets `currentPage` to the first visible page rather than re-indexing, and the internal `changePage` helper only moves between currently visible pages (`goToNextPage`/`goToPreviousPage` both route through it).

### D12 — Page-validation-gated navigation

Divergence: the old reference blocked the Next button until the current page was valid. The rewrite navigates freely between visible pages and tabs.

Rationale: gating navigation on per-page validity duplicates TanStack Form's validation lifecycle in navigation state and fights users who want to review later pages first.

Replacement: submit-time enforcement plus guidance. Submit runs configured validation for every visible field, including fields on inactive pages/tabs that have no mounted instance, so an unseen invalid field still blocks submit. `onSubmitInvalid` then feeds a validation summary (default on) listing each invalid field with its page, and `validationSummary.autoNavigate` (default true) switches to the first invalid field's page or tab and smooth-scrolls to it. `formOptions.canSubmitWhenInvalid` and `formOptions.onSubmitInvalid` remain the escape hatches.

### Small residuals

1. `autoScroll`: the legacy option does not exist in the rewrite. Legacy `autoScroll` only toggled scroll-to-top during navigation; the rewrite instead smooth-scrolls to and focuses the first invalid field on invalid submit (default behavior of `validationSummary.autoNavigate`, also fired when a summary entry is clicked).
2. Async form-validation slots are probed, not unconditional: form-level async validator slots are only registered when `isFormedibleSchemaAsync` probes the schema as genuinely async against the default values. A merely-registered async validator would schedule a debounced pass whose timer a stale change pass can clear mid-submit, leaving `handleSubmit` unsettled.
3. Collapsed-section fields still validate on submit: a collapsed `section.collapsible` unmounts its fields, but the unmounted-visible-field submit pass still runs their configured validation, so an invalid collapsed section blocks submit. `autoNavigate` can switch page or tab for such an error, but cannot expand a collapsed section, so its scroll/focus step finds no element and is skipped.
