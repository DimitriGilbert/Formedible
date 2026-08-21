# Formedible Test Expansion Plan

## Goals

- Add meaningful e2e coverage for the web app, especially `/docs/examples` live Formedible examples.
- Fail on browser console errors, uncaught runtime errors, failed page loads, and hydration/runtime regressions.
- Add a consumer smoke test that proves the built Formedible shadcn registry item installs into a fresh Better-T-Stack app from a local registry file.
- Reuse existing Formedible examples as the basis for the large smoke-test form instead of inventing a new schema from scratch.
- Keep heavyweight consumer smoke coverage separate from normal fast checks unless CI explicitly opts into it.

## Current Context

- Current e2e is Node's built-in test runner plus `agent-browser`, not Playwright.
- Existing e2e files live under `tests/e2e`.
- Current e2e utility is `tests/e2e/utils/agent-browser.ts`.
- Current smoke test is `tests/e2e/web-smoke.test.ts`, but it only verifies basic landing page text.
- `/docs/examples` is implemented by `apps/web/src/routes/docs/examples.tsx`.
- Live `/docs/examples` examples are exported from `apps/web/src/components/docs/examples/index.tsx`, with individual components under `apps/web/src/components/docs/examples/`.
- `apps/web/src/features/docs/compatibility-examples.tsx` still exists for other docs/showcase/regression coverage, but it is not the current source for `/docs/examples`.
- The current `/docs/examples` page heading is `Interactive Examples`.
- The current `/docs/examples` category buttons are `All (14)`, `Basic examples (6)`, and `Advanced examples (8)`.
- The current `/docs/examples` page has no `Quick starts` category, no `Profile Form`, and no `Code-only reference` fallback.
- The Formedible shadcn registry item is built to `packages/formedible/public/r/formedible-core.json`.
- The smoke test must install with the local registry file path, for example `pnpm dlx shadcn@latest add /absolute/path/to/packages/formedible/public/r/formedible-core.json --yes --overwrite`.
- `agent-browser --help` confirms available commands for `console`, `errors`, `network requests`, `storage session`, `find label`, `find role`, `fill`, `click`, `check`, and `select`.
- `bts.jsonc` contains this repo's generated reproducible Better-T-Stack command and is the grounded source for the smoke-test scaffold command.
- `old_version_for_knowledge_purpose/tests/run-integration-test.sh` confirms the historical integration test installed a local shadcn registry file from inside the generated app's `apps/web` directory. The old registry filename in that script is stale; the current built item is `packages/formedible/public/r/formedible-core.json`.

## Grounding Rules

- Do not add implementation steps based on memory or expectation when the repo can be inspected.
- If a step depends on generated Better-T-Stack output, the implementation must inspect the generated project before choosing exact file paths, scripts, and route locations.
- If a step depends on CLI behavior, the implementation must either use behavior already verified in this repo or run the CLI help/command in the temp project before coding around it.
- Test selectors for `/docs/examples` must come from the actual route/components/forms, not from assumed shadcn or docs conventions.
- The plan must distinguish verified facts from decisions to verify during implementation.
- Do not use framework default ports for dev, preview, static registry, or generated smoke-app servers. Allocate an available localhost port at runtime to avoid collisions with other running projects.

## Files To Read First

- `package.json`
- `tests/e2e/web-smoke.test.ts`
- `tests/e2e/utils/agent-browser.ts`
- `tests/e2e/tsconfig.json`
- `apps/web/src/routes/docs/examples.tsx`
- `apps/web/src/routes/docs/route.tsx`
- `apps/web/src/components/demo/demo-card.tsx`
- `apps/web/src/components/docs/examples/index.tsx`
- `apps/web/src/components/docs/examples/contact-form.tsx`
- `apps/web/src/components/docs/examples/registration-form.tsx`
- `apps/web/src/components/docs/examples/checkout-form.tsx`
- `apps/web/src/components/docs/examples/array-fields-form.tsx`
- `apps/web/src/components/docs/examples/advanced-field-types-form.tsx`
- `apps/web/src/components/docs/examples/conditional-in-obj.tsx`
- `apps/web/src/components/docs/examples/conditional-pages-form.tsx`
- `apps/web/src/components/docs/examples/rental-car-flow-form.tsx`
- `apps/web/src/components/docs/examples/tabbed-form.tsx`
- `apps/web/src/components/docs/examples/persistence-form.tsx`
- `apps/web/src/components/docs/examples/analytics-tracking-form.tsx`
- `apps/web/src/features/docs/compatibility-examples.tsx`
- `tests/compatibility-examples/example-manifest.ts`
- `tests/compatibility-examples/core-examples.ts`
- `tests/compatibility-examples/behavior-examples.ts`
- `tests/compatibility-examples/advanced-field-examples.ts`
- `tests/compatibility-examples/nested-examples.ts`
- `packages/formedible/registry.json`
- `packages/formedible/package.json`
- `packages/formedible/public/r/formedible-core.json`
- `bts.jsonc`

## Phase 1: E2E Utility Hardening

Add reusable e2e support for browser/runtime failure detection.

Requirements:

- Keep using the existing Node test plus `agent-browser` setup unless a concrete blocker is found.
- Add a helper that opens a page and checks `agent-browser console`, `agent-browser errors`, and `agent-browser network requests` output after interactions.
- Treat console errors, page errors, and failed network requests as failures unless the test explicitly documents an allowed known non-app failure.
- Make assertions fail with useful diagnostics when console/runtime errors occur.
- Preserve existing `E2E_BASE_URL` behavior.
- Ensure preview/dev server processes are cleaned up.
- Keep the existing free-port behavior for local web preview; do not fall back to default Vite/TanStack ports.
- Do not start a long-running dev server outside the test lifecycle.

Validation:

- Read the helper implementation line by line.
- Run `pnpm run test:e2e:existing`.
- Confirm no helper suppresses real console errors.

## Phase 2: `/docs/examples` Interaction E2E Tests

Add interaction-focused coverage for the docs examples route. This must not be a passive “page rendered” test.

Route:

- `/docs/examples`

Stable route-level assertions:

- Heading `Interactive Examples` is visible.
- Category buttons are visible: `All (14)`, `Basic examples (6)`, `Advanced examples (8)`.
- Tabs/buttons `Preview` and `Code` are visible.
- At least one current live example is visible, for example `Contact Form`.

Required interaction scenarios:

1. Category filtering and selected example rendering
- Click `Basic examples (6)` or `Advanced examples (8)`.
- Select a current example such as `Contact Form`, `Multi-Step Registration`, `Dynamic Array Fields`, or `Advanced Field Types`.
- Assert the selected title and description are visible.
- Click `Code`.
- Assert source/code content for the selected example is visible.

2. Contact form submit
- Select `Contact Form`.
- Fill `Full Name`, `Email`, and `Message`.
- Optionally toggle `This is urgent`.
- Click `Send Message`.
- Assert the browser reports no page/runtime errors after submit.
- Do not assert `sessionStorage["formedible-docs-last-interaction"]`; current `/docs/examples` examples do not write that key.

3. Multi-page registration flow
- Select `Multi-Step Registration`.
- Fill page 1 fields: `First Name`, `Last Name`, `Birth Date`.
- Click `Next`.
- Assert `Contact Details` is visible.
- Assert dynamic text resolves with the entered first name. Current text renders as `How can we reach you Ada ?`.
- Fill `Email`, `Phone`, and `Address`.
- Click `Next`.
- Assert `Preferences` is visible.
- Select or confirm a `Choose Plan` option such as `Basic - Free`, `Pro - $9/month`, or `Enterprise - $29/month`.
- Submit.
- Assert the browser reports no page/runtime errors after submit.

4. Checkout conditional fields
- Select `E-commerce Checkout`.
- Navigate to `Payment`.
- Assert `Payment Method` is visible.
- With default `Credit/Debit Card` payment, assert `Card Number` and `Expiry Date` are visible.
- Select `PayPal` or `Apple Pay`.
- Assert `Card Number` and `Expiry Date` disappear.

5. Array field behavior
- Select `Dynamic Array Fields`.
- Assert `data-formedible-array-field="teamMembers"` exists.
- Assert `data-formedible-array-item="teamMembers[0]"` exists.
- Click `Add Team Member`.
- Assert `teamMembers[1]` exists.
- Remove or reorder an item if stable controls are available.

6. Code tab behavior
- On any live example, click `Code`.
- Assert the selected example source is visible.
- Assert `Copy` is visible.
- If clipboard permissions are reliable in the runner, click `Copy` and assert it changes to `Copied`.

Validation:

- Tests must interact with fields and navigation, not just assert static text.
- Tests must fail on console/runtime errors.
- Run `pnpm run test:e2e`.

## Phase 3: Consumer Smoke Harness

Add a heavyweight smoke test that creates a temporary consumer app, installs Formedible from the local shadcn registry file, builds it, runs a simple browser test, and cleans up.

Requirements:

- Add a root script such as `test:consumer-smoke` or `test:smoke:consumer`; choose the exact name by inspecting existing root script naming in `package.json`.
- Use `mkdtemp` under the OS temp directory for the generated project.
- Always clean up the temporary project in `finally`.
- Add an opt-in debug escape hatch such as `KEEP_FORMEDIBLE_SMOKE_APP=1` to preserve the generated app on failure.
- Build the Formedible registry before installation with `pnpm --dir packages/formedible build:registry`.
- Install from inside the generated app's web package directory, expected to be `apps/web` for the current Better-T-Stack TanStack Start plus turborepo scaffold. Verify this path after scaffolding before running shadcn.
- Install using the local registry file path, not an HTTP server:
  - `pnpm dlx shadcn@latest add /absolute/path/to/packages/formedible/public/r/formedible-core.json --yes --overwrite`
- Assert important installed files exist in the generated app, including `hooks/use-formedible.tsx`, `components/formedible`, `components/ui`, and `lib/formedible`.
- Do not use `packages/formedible/src` or `scripts/quick-sync.js` as the consumer install path. This test must validate the built local registry file.

Validation:

- Read the smoke harness for cleanup and process handling.
- Confirm it cannot accidentally pass by using workspace-synced files.
- Confirm failures include the temp directory path when `KEEP_FORMEDIBLE_SMOKE_APP=1` is set.

## Phase 4: Better-T-Stack Bootstrap

Bootstrap the temporary consumer app with Better-T-Stack in non-interactive mode.

Grounded command source:

- `bts.jsonc` line 16 contains this repo's reproducible Better-T-Stack command.
- The smoke test should use the same stack shape unless implementation discovers a specific incompatibility.

Preferred command shape, copied from `bts.jsonc` and adjusted only for the temp project name:

```bash
pnpm create better-t-stack@3.38.2 formedible-smoke \
  --frontend tanstack-start \
  --backend none \
  --runtime none \
  --database none \
  --orm none \
  --api none \
  --auth none \
  --payments none \
  --addons turborepo \
  --examples none \
  --db-setup none \
  --web-deploy none \
  --server-deploy none \
  --git \
  --package-manager pnpm \
  --install
```

Requirements:

- Verify the exact CLI flags during implementation by comparing against `bts.jsonc` and the current Better-T-Stack CLI output if needed.
- Keep the command non-interactive.
- Do not replace the grounded `bts.jsonc` stack with a shorter guessed command.
- Inspect the generated app's `package.json` files before choosing typecheck/build/preview commands.
- Do not add Formedible as an npm package. The install path is the local shadcn registry file.

Validation:

- Generated app installs dependencies successfully.
- Generated app remains outside the repo workspace.
- Generated app commands are selected only after reading the generated `package.json` files.

## Phase 5: Large Consumer Form Page

Create a test route/page in the generated Better-T-Stack app that renders a large Formedible form.

Implementation basis:

- Reuse field/config ideas from current `/docs/examples` components under `apps/web/src/components/docs/examples/`.
- Do not blindly copy docs example code into the consumer smoke app. Some docs examples/snippets can include `any`, `console.log`, `console.error`, or `alert`, which are not allowed in the generated smoke page.
- Use the compatibility manifest/tests as the coverage checklist:
  - `tests/compatibility-examples/example-manifest.ts`
  - `tests/compatibility-examples/core-examples.ts`
  - `tests/compatibility-examples/behavior-examples.ts`
  - `tests/compatibility-examples/advanced-field-examples.ts`
  - `tests/compatibility-examples/nested-examples.ts`

Recommended examples to combine:

- `advanced-field-types-form` for broad field coverage.
- `array-fields-form` for scalar and object arrays.
- `conditional-in-obj` for nested paths and nested conditionals.
- `conditional-pages-form` or `rental-car-flow-form` for conditional navigation and dynamic text.
- `tabbed-form` for tab grouping.
- `persistence-form` for persistence config.
- `analytics-tracking-form` for callback config.

Field/config coverage target:

- `text`
- `email`
- `password`
- `textarea`
- `number`
- `date`
- `select`
- `radio`
- `checkbox`
- `switch`
- `rating`
- `phone`
- `multiSelect`
- `combobox`
- `multiCombobox`
- `slider`
- `colorPicker`
- `location`
- `duration`
- `file`
- `array` with scalar items
- `array` with object items
- sections
- pages or tabs
- conditional fields
- dynamic options
- dynamic text interpolation
- analytics callbacks
- persistence, using the existing docs examples as the basis and browser storage assertions where stable

Requirements:

- Use a Zod schema and matching `useFormedible` config.
- Use inferred schema types rather than `any`.
- Do not use `alert` or `confirm`.
- Avoid noisy `console.log` in the generated page.
- Submit should render a deterministic success state in the page, such as `Smoke form submitted`.
- Keep the page large enough to catch missing deps/imports, but not so large that it becomes impossible to maintain.

Validation:

- Typecheck the generated app.
- Build the generated app.
- Read generated page code to confirm it reuses existing examples as basis and avoids stale docs snippets with `any`, `alert`, or old config shapes.

## Phase 6: Consumer Smoke Browser Test

Run a browser-level smoke test against the generated app's large Formedible page.

Requirements:

- Serve the generated app using the preview/start command found by reading the generated app's `package.json` files.
- Pass a dynamically allocated free localhost port to the generated app preview/start command. Do not use the generated framework's default port.
- Open the test route.
- Fail on console/runtime errors.
- Assert the large form renders.
- Fill a representative subset of fields.
- Exercise at least one conditional field.
- Exercise at least one dynamic option.
- Exercise at least one page/tab navigation path.
- Exercise at least one array add/remove path.
- Submit the form.
- Assert the success state appears.

Validation:

- Run the full consumer smoke script.
- Confirm cleanup runs after success and failure.
- Confirm the browser test would fail if the Formedible page does not render.

## Phase 7: Final Verification

Run the project-level gates after implementation.

Commands:

- `pnpm run check-types`
- `pnpm run test:e2e`
- New consumer smoke script, for example `pnpm run test:consumer-smoke`

If implementation uncovers Formedible component or hook bugs, follow the required repo workflow:

1. Fix in `packages/formedible/src/`.
2. Run `pnpm run build:pkg`.
3. Run `node scripts/quick-sync.js`.
4. Fix package-specific errors in their own packages only when needed.
5. Run `pnpm run check-types`.

## Orchestration Strategy

Use the `subagent-orchestration` workflow after this plan is approved.

Phase execution rules:

- One implementer per phase or sub-phase.
- One validator immediately after each implementer.
- Validators must read modified code, not just run commands.
- Fixers receive all validator issues at once.
- Maximum three fix attempts per phase.
- Do not batch validation for unrelated phases.

Suggested sub-phases:

- Phase 1: e2e helper hardening.
- Phase 2A: `/docs/examples` route/category/code-tab interactions.
- Phase 2B: `/docs/examples` live Formedible form interactions.
- Phase 3: consumer smoke temp-project harness and cleanup.
- Phase 4: Better-T-Stack bootstrap and local-file shadcn install.
- Phase 5: generated large Formedible page based on existing examples.
- Phase 6: generated app typecheck/build/e2e smoke.
- Phase 7: final repo verification.

## No-Slop Policy

- No `any`, `as any`, or `: any`.
- No placeholder tests.
- No `TODO` or `FIXME` comments.
- No unused imports or unused variables.
- No `alert` or `confirm`.
- No console hacks to hide failures.
- Use `import type` for type-only imports where applicable.
- External imports first, blank line, then local imports.
- Tests must assert behavior, not just implementation details.
