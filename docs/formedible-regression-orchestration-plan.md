# Formedible Regression Orchestration Plan

## Goal

Restore compatibility regressions between the old Formedible library and the current clean-room Formedible package without implementing fixes directly in consumer packages.

Canonical implementation scope is `packages/formedible/src/`. Synced copies in `apps/web/src`, `packages/builder/src`, `packages/ai-builder/src`, and `packages/formedible-parser/src` may change only through `node scripts/quick-sync.js` after the package build. Registry output may change only through `pnpm --dir packages/formedible run build:registry`.

## Non-Goals

- Do not fix unrelated web docs example type errors unless they block package compatibility verification.
- Do not implement package-specific behavior in `apps/web`, `packages/builder`, `packages/ai-builder`, or `packages/formedible-parser` by hand.
- Do not restore old packages that are not part of the current package workflow.
- Do not reintroduce removed debug/validation return helpers unless the product decision changes.

## Global Rules For Every Phase

- Source of truth is `packages/formedible/src/`.
- Follow the existing workflow: build package, sync, then run all relevant checks.
- No `any`, `as any`, or `: any` in new or modified package code.
- No placeholder code, no `TODO`, no `FIXME`.
- Use `import type` for type-only imports.
- Keep changes minimal and compatibility-focused.
- Every implementer/fixer must run gatekeeping commands before reporting complete.
- Every validator must read the modified code and verify behavior, not only run commands.

## Gatekeeping Commands

- Package build: `pnpm --dir packages/formedible run build`
- Registry build: `pnpm --dir packages/formedible run build:registry`
- Sync: `node scripts/quick-sync.js`
- Type tests: `pnpm run test:formedible:types`
- Normalization tests: `pnpm run test:formedible:normalization`
- Validation tests: `pnpm run test:formedible:validation`
- Basic fields: `pnpm run test:formedible:basic-fields`
- Advanced fields: `pnpm run test:formedible:advanced-fields`
- Nested fields: `pnpm run test:formedible:nested-fields`
- Phase 10 behavior: `pnpm run test:formedible:phase10`
- Final build: `pnpm run build`
- Final full type check: `pnpm run check-types`

Note: if `pnpm run check-types` is blocked by pre-existing unrelated web docs errors, record the exact blocker and prove all Formedible package-level checks pass.

## Phase 1: Section Rendering Compatibility

Type: Sequential single-sub-phase.

Problem:
Old Formedible rendered `field.section` metadata as grouped section headers and supported `title`, `description`, `collapsible`, and `defaultExpanded`. Current package types now accept `section?: string | { title, description }`, but current field rendering does not render sections at all.

Requirements:
- Add canonical support in `packages/formedible/src/` for rendering field sections.
- Support legacy object sections with at least `title` and `description`.
- Preserve current string section behavior by rendering a string as the section title.
- Decide explicitly whether to restore `collapsible` and `defaultExpanded`; if restored, type them and test them. If not restored, document that as intentionally unsupported.
- Do not duplicate section headers for consecutive fields in the same section on the same rendered page/tab.
- Preserve dynamic text interpolation for section title and description.
- Keep rendering compatible with pages, tabs, and nested/object/array fields.

Files to read:
- `packages/formedible/src/hooks/use-formedible.tsx`
- `packages/formedible/src/components/formedible/fields/field-wrapper.tsx`
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible/src/lib/formedible/dynamic-text.ts`
- `tests/formedible/normalize-field-config.test.ts`

Expected files to modify:
- `packages/formedible/src/hooks/use-formedible.tsx`
- `packages/formedible/src/lib/formedible/types.ts`
- Tests under `tests/formedible/`
- Synced copies only via `node scripts/quick-sync.js`
- `packages/formedible/public/r/formedible-core.json` via registry build if public registry content changes

Validation criteria:
- Tests prove string section and object section render correctly.
- Tests prove repeated adjacent section values do not create repeated headers.
- Tests prove dynamic section text interpolates form values.
- Package build and relevant Formedible tests pass.

## Phase 2: Field Config Object Compatibility

Type: Multi-sub-phase phase with phase-wide validation.

Problem:
Old Formedible supported field-specific config objects such as `textareaConfig`, `passwordConfig`, `numberConfig`, `emailConfig`, `datalist`, and `help`. Current package accepts unknown custom props but does not read several legacy config objects, so old configs can compile while silently losing behavior.

### Sub-Phase 2A: Textarea Config

Requirements:
- Add explicit `textareaConfig` typing in canonical package types.
- Preserve current top-level `rows` and `maxLength` behavior.
- Support legacy `textareaConfig.rows`, `textareaConfig.maxLength`, and `textareaConfig.showWordCount`.
- Decide explicitly whether to support `cols` and `resize`; if unsupported, document as intentionally unsupported.
- Ensure config precedence is deterministic when both top-level and nested config are present.

Expected files:
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible/src/components/formedible/fields/textarea-field.tsx`
- Tests under `tests/formedible/`

Validation criteria:
- Type tests accept legacy `textareaConfig`.
- Runtime/render tests verify rows, maxLength, and word count behavior.

### Sub-Phase 2B: Password Config

Requirements:
- Add explicit `passwordConfig` typing in canonical package types.
- Add a package-level password field implementation instead of mapping password to plain `TextField` if restoring password features.
- Support legacy `showToggle`, `strengthMeter`, and `minStrength` or document unsupported options explicitly.
- Preserve basic password input behavior.

Expected files:
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible/src/components/formedible/fields/field-registry.tsx`
- Potential new `packages/formedible/src/components/formedible/fields/password-field.tsx`
- Tests under `tests/formedible/`

Validation criteria:
- Type tests accept legacy `passwordConfig`.
- Runtime/render tests verify password input type, toggle behavior if supported, and strength UI if supported.

### Sub-Phase 2C: Legacy Auxiliary Field Configs

Requirements:
- Audit `numberConfig`, `emailConfig`, `datalist`, and `help` from the old public API.
- Restore only behavior that belongs in the canonical package and has clear current users or compatibility examples.
- If a config is not restored, add compatibility documentation/tests showing it is intentionally unsupported rather than silently accepted.

Expected files:
- `packages/formedible/src/lib/formedible/types.ts`
- Relevant field components under `packages/formedible/src/components/formedible/fields/`
- Tests under `tests/formedible/`

Validation criteria:
- No silently accepted config in this group remains undocumented.
- Supported configs have type and behavior tests.

Phase-wide validation criteria:
- Config precedence is consistent across textarea/password/auxiliary configs.
- Public types, renderers, and tests agree.
- No broad custom-prop behavior hides known compatibility regressions without documentation.

## Phase 3: Validation API Compatibility

Type: Sequential single-sub-phase.

Problem:
Old `FieldConfig.validation` accepted a Zod schema directly. Current `validation` expects a function or `{ validator, message }`; passing a Zod schema can type-fail or runtime-fail if forced through.

Requirements:
- Decide whether to restore direct Zod schema field validation compatibility.
- If restored, update canonical types and `packages/formedible/src/lib/formedible/validation.ts` to safely recognize Standard Schema/Zod-like validators without `any`.
- If not restored, provide a clear migration test/documentation path that rejects direct schema validation with an actionable type-level error.
- Preserve current validation function/object behavior.

Files to read:
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible/src/lib/formedible/validation.ts`
- `packages/formedible/src/lib/formedible/zod-errors.ts`
- `tests/formedible/validation/validation-pipeline.test.tsx`

Expected files to modify:
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible/src/lib/formedible/validation.ts`
- Validation tests under `tests/formedible/validation/`

Validation criteria:
- Existing validation tests continue passing.
- New tests cover direct schema validation if restored.
- No runtime path calls `.validator` on an arbitrary object that might be a schema.

## Phase 4: Field Type Alias And Degraded Behavior Audit

Type: Multi-sub-phase phase with phase-wide validation.

Problem:
Current types accept legacy field types such as `autocomplete`, `maskedInput`, and `colorPicker`, but some degrade to plain text behavior or only normalize names without restoring old config semantics.

### Sub-Phase 4A: Autocomplete Compatibility

Requirements:
- Audit old `autocompleteConfig` behavior.
- Decide whether current `combobox` can cover it or whether a compatibility adapter is required.
- Ensure `type: 'autocomplete'` does not silently degrade to plain text without tests and documentation.

### Sub-Phase 4B: Masked Input Compatibility

Requirements:
- Audit old `maskedInputConfig` and `mask` behavior.
- Decide whether to restore masking or explicitly document `masked`/`maskedInput` as plain text compatibility aliases.
- Ensure tests reflect the decision.

### Sub-Phase 4C: Color Picker Alias Compatibility

Requirements:
- Verify `colorPicker` normalization to `color` keeps old `colorConfig` behavior.
- Add tests for alias plus config behavior if missing.

Validation criteria:
- Type aliases and runtime field registry behavior match documented compatibility decisions.
- Alias tests cover both type acceptance and rendered behavior.

## Phase 5: Customization Extension Points

Type: Sequential single-sub-phase.

Problem:
Old fields supported `component`, `wrapper`, `defaultComponents`, and `globalWrapper`. Current rendering always uses the internal registry and does not expose those extension points.

Requirements:
- Decide whether these extension points are in-scope for Formedible package compatibility.
- If restored, implement minimal canonical support with type-safe component contracts.
- If not restored, add explicit type/test documentation preventing silent assumptions.
- Do not introduce broad unsafe component types.

Files to read:
- `packages/formedible/src/hooks/use-formedible.tsx`
- `packages/formedible/src/components/formedible/field-renderer.tsx`
- `packages/formedible/src/lib/formedible/types.ts`

Validation criteria:
- Extension-point decision is enforced by tests.
- Current registry behavior remains stable.

## Phase 6: Form Options And Analytics Compatibility Audit

Type: Sequential single-sub-phase.

Problem:
Old options included `onPageChange`, direct form event handlers, `disabled`, `loading`, `showSubmitButton`, `autoSubmitOnChange`, and a larger analytics surface. Current package supports a smaller set.

Requirements:
- Classify each old option as restore, intentionally removed, or superseded.
- Restore only package-level behavior that is needed for current compatibility examples or existing public ergonomics.
- Add type tests/documentation for intentional removals so regressions are explicit.
- Do not restore removed debug/validation return helpers unless product direction changes.

Files to read:
- `packages/formedible/src/hooks/use-formedible.tsx`
- `packages/formedible/src/lib/formedible/types.ts`
- `packages/formedible/src/hooks/use-form-analytics.ts`
- `tests/compatibility-examples/use-formedible-return-contract.ts`

Validation criteria:
- Compatibility status for every audited option is recorded in tests or docs.
- Analytics tests prove preserved callbacks still fire with expected arguments.

## Phase 7: Parser/Storage Preservation For Canonical Configs

Type: Sequential single-sub-phase.

Problem:
AI/import storage currently parses only a subset of field config properties. If canonical package compatibility restores or documents field config objects, parser/storage should not silently drop supported canonical configs.

Requirements:
- Only preserve configs that are supported by the canonical Formedible package after Phases 1-6.
- Update parser/storage in the package that owns that parser behavior only if it is part of active Formedible usage.
- Do not add support for unrelated packages or unused surfaces.
- Add parser tests for preserved config objects.

Files to read:
- `packages/ai-builder/src/lib/formedible/ai-storage.ts`
- `apps/web/src/lib/formedible/ai-storage.ts`
- `packages/formedible/src/lib/formedible/types.ts`

Expected files to modify:
- Prefer owner package source only if this parser remains an active supported surface.
- Synced copies only via `node scripts/quick-sync.js`.

Validation criteria:
- Supported canonical configs round-trip through active storage/import paths.
- Unsupported configs are deliberately ignored with tests or documented behavior.

## Phase 8: Final Compatibility Matrix And Verification

Type: Sequential single-sub-phase.

Requirements:
- Create or update a compatibility matrix documenting old API surface status: supported, restored, intentionally removed, or superseded.
- Ensure tests align with the matrix.
- Run full package and repo verification.
- Record unrelated blockers separately from Formedible package regressions.

Expected files:
- A docs file under `docs/` for the matrix, or an existing compatibility test manifest if preferred.
- Tests under `tests/formedible/` as needed.

Validation criteria:
- Matrix covers section, textareaConfig, passwordConfig, validation schema, autocomplete, masked, custom components/wrappers, form options, analytics, and parser/storage preservation.
- `pnpm --dir packages/formedible run build` passes.
- `pnpm run test:formedible:types` passes.
- All relevant Formedible behavior tests pass.
- `pnpm run build` passes.
- `pnpm run check-types` passes or reports only unrelated pre-existing blockers with exact file/line output.

## Orchestration Execution Instructions

After user approval, execute phases in order using separate implementer, validator, and fixer subagents.

For every implementer dispatch:
- Paste the full phase or sub-phase requirements.
- List files to read and expected files to modify.
- Include the global no-slop rules.
- Require package build and relevant tests before completion.

For every validator dispatch:
- Require manual code review of every modified file.
- Require verification against the full phase requirements.
- Require relevant command execution.
- Enforce no-slop rules strictly.

For every fixer dispatch:
- Provide the full validator report.
- Require all validator findings to be fixed in one pass.
- Require package build and relevant tests before completion.

Stop only if a phase still fails after three fix attempts or if a blocker requires a product decision.
