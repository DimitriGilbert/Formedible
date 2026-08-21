# Formedible (`re-codex` branch) — Exploration Map (session 20260819)

## 1. Project structure overview

Monorepo (pnpm + turbo); product is a shadcn component system over TanStack Form. Five "owner" packages author shadcn-installable source; `packages/ui` is the in-repo consumer receiving copies at the exact paths `shadcn add` would install; `apps/web` is the docs/demo site (Vite + TanStack Router) consuming `@formedible/ui`.

Owning sources (review targets):
- `packages/formedible/src` — core engine: hooks, lib, field components, layout
- `packages/formedible-parser/src` — safe parser (JSON / object literal / Zod expressions)
- `packages/builder/src` — visual form builder
- `packages/ai-builder/src` — AI-assisted builder (chat, providers, streaming)
- `packages/ai-picker/src` — AI provider/model picker

Synced destinations (EXCLUDED from review — alias-rewritten copies):
- `packages/ui/src/components/formedible/**` — all copies of the five owner packages
- `packages/*/src/components/ui/**`, `apps/web/src/components/ui/**`, `packages/ui/src/components/*.tsx` — vendored shadcn primitives
- Generated: `packages/*/public/r/*.json`, `apps/web/dist/`, `**/.compiled/`, `**/routeTree.gen.ts`, `.turbo/`

Sync routes (scripts/quick-sync.js): formedible(48 files)→ui, parser(3)→ui, builder(13)→ui, ai-builder(21)→ui, ai-picker(8)→ui, all under `packages/ui/src/components/formedible/...` with `@ui/...` alias rewriting.

Known stale/aspirational: `packages/formedible-parser/sync.config.json` declares parser→builder/ai-builder route but no parser files exist in those destinations. AGENTS.md describes an older broader sync topology that doesn't match re-codex quick-sync.js.

## 2. Reviewable clusters (27 clusters, 235 files)

C1 Core form engine (6): packages/formedible/src/{hooks/use-formedible.tsx, components/formedible/form.tsx, components/formedible/field-renderer.tsx, lib/formedible/types.ts, lib/formedible/normalize-field-config.ts, lib/formedible/field-path.ts} — hook, Form component, recursive renderer, types, normalization, field paths. Focus: React state, API contracts, SSR, data flow.

C2 Validation & text interpolation (5): packages/formedible/src/lib/formedible/{validation.ts, zod-errors.ts, normalize-options.ts, dynamic-text.ts, utils.ts}. Focus: logic, edge cases.

C3 Input primitives & registry (8): packages/formedible/src/components/formedible/fields/{field-wrapper, field-registry, text-field, textarea-field, number-field, password-field, masked-field, phone-field}.tsx. Focus: state, binding, a11y.

C4 Choice & value widgets (7): fields/{checkbox-field, switch-field, radio-field, select-field, slider-field, rating-field, date-field}.tsx. Focus: value coercion.

C5 Multi-value pickers (6): fields/{multi-select-field, combobox-field, multi-combobox-field, autocomplete-field, color-picker-field, duration-picker-field}.tsx. Focus: async options, SSR safety.

C6 Structural/upload/advanced (5): fields/{object-field, array-field, file-upload-field, location-picker-field}.tsx + advanced-field-utils.ts. Focus: recursion, SSR, file handling, leaks.

C7 Chrome & cross-cutting hooks (8): components/formedible/layout/{form-layout, form-navigation, form-progress, form-tabs}.tsx + hooks/{use-multi-page, use-form-tabs, use-form-persistence, use-form-analytics}.ts. Focus: step/tab logic, localStorage SSR, persistence errors, callback contracts.

C8 Parser (5): packages/formedible-parser/src/lib/formedible/{formedible-parser.ts, parser-config-schema.ts, parser-types.ts} + src/index.ts + registry-dependencies.d.ts. Focus: security (injection, prototype pollution, DoS), validation.

C9 Builder UI (7): packages/builder/src/components/formedible/builder/{form-builder, field-configurator, field-configuration-form, form-preview, code-generator, default-tabs}.tsx + field-store.ts. Focus: state, store↔forms data flow.

C10 Builder libs (8): packages/builder/src/lib/formedible/{builder-types, builder-config-types, builder-config-registry, builder-config-transforms, code-generation}.ts + src/index.ts + registry-dependencies.d.ts (+ builder.test.tsx context). Focus: API contracts, code-gen escaping.

C11 AI builder UI shell/chat (6): packages/ai-builder/src/components/formedible/ai/{ai-builder, ai-form-renderer, chat-interface, chat-messages, markdown-message, conversation-history}.tsx. Focus: streaming state, XSS via markdown.

C12 AI builder UI settings (7): ai/{provider-selection, agent-settings, parser-settings, raw-output-panel, sidebar-content, sidebar-icons}.tsx + src/index.ts. Focus: state, settings schema contracts.

C13 AI libs generation/streaming (6): packages/ai-builder/src/lib/formedible/{ai-generation, ai-stream-scheduler, ai-messages, ai-adapters, ai-types, ai-model-catalog}.ts (+ tests context). Focus: async/streaming, cancellation.

C14 AI libs storage/errors (5): packages/ai-builder/src/lib/formedible/{ai-storage, ai-safe-persistence, ai-parser, ai-errors}.ts + registry-dependencies.d.ts. Focus: API keys in storage, SSR, error handling.

C15 AI picker (9): packages/ai-picker/src/{index.ts, components/ai-picker/{ai-picker, ai-picker-panel, ai-picker-popover, model-autocomplete-field}.tsx, lib/{ai-picker-types, ai-picker-utils, default-picker-schema}.ts} (+ test context). Focus: API key handling, state, schema.

C16 Sync engine & manifests (13): scripts/{quick-sync.js, validate-sync-boundaries.js, build-registries.js, validate-public-registries.js}, tests/sync/copy-only-sync.test.ts, packages/{formedible, formedible-parser, builder, ai-builder, ai-picker}/registry.json, packages/{formedible-parser, builder, ai-builder}/sync.config.json. Focus: path resolution, alias rewriting, contract coverage.

C17 Release/deploy/alias scripts (7): scripts/{build-release.js, create-release-assets.js, deploy-gh-pages.js, prepare-registry-host.js, prepare-web-deploy.js, package-alias-loader.mjs, register-package-alias-loader.mjs}. Focus: child_process/shell usage, path handling.

C18 Workspace orchestration & env (8): package.json, pnpm-workspace.yaml, turbo.json, packages/config/{package.json, tsconfig.base.json}, packages/env/{package.json, tsconfig.json, src/web.ts}. Focus: orchestration, env validation.

C19 Consumer surface & manifests (15): packages/ui/{package.json, components.json, tsconfig.json, postcss.config.mjs, src/lib/utils.ts, src/styles/globals.css}, packages/formedible/{package.json, components.json, tsconfig.json}, packages/{formedible-parser, builder, ai-builder, ai-picker}/package.json (+ components.json). Focus: exports map, alias resolution, package boundaries.

C20 Web shell/routing (13): apps/web/src/{router.tsx, index.css, routes/{__root, index, 404}.tsx, components/{header, loader, theme-provider, theme-switcher}.tsx}, vite.config.ts, components.json, package.json, tsconfig.json. Focus: SSR, routing, build config.

C21 Web landing/builder/examples (11): apps/web/src/routes/{ai-builder, builder}.tsx, src/components/examples/{contact-form, energy-rating-component, installation-prompt-generator, registration-form, rental-car-flow-form, survey-form, system-prompt-generator}.tsx, src/components/demo/{demo-card, hero-examples}.tsx. Focus: formedible API usage.

C22 Docs routes core (8): apps/web/src/routes/docs/{route, index, getting-started, fields, validation, dynamic-text, persistence, analytics}.tsx. Focus: wiring, content/code consistency.

C23 Docs routes advanced & data (13): apps/web/src/routes/docs/{advanced-features, ai-builder, builder, api, parser, examples}.tsx + src/features/docs/{code-examples.ts, compatibility-examples.tsx, content.ts, navigation.ts, seo.ts, site-meta.ts} + src/data/code-examples.ts. Focus: metadata correctness, content accuracy.

C24 Docs shared components (13): apps/web/src/components/docs/{api-property-table, code-block, docs-card, docs-home, docs-layout, guide-page, home-landing, page-header, rendered-example-showcase}.tsx + components/layout/{install-command, page-container, section-divider, site-footer}.tsx. Focus: components, clipboard/install correctness.

C25 Docs example forms (15): apps/web/src/components/docs/examples/*.tsx (14 forms + index.tsx). Focus: API usage, schema correctness.

C26 Compat contracts (7): tests/compatibility-examples/{core-examples, nested-examples, advanced-field-examples, behavior-examples, example-manifest, form-options-analytics-contract, use-formedible-return-contract}.ts. Focus: these define the public compat surface.

C27 Architecture scan tests (10): tests/architecture/utils.ts + {copy-only-sync-contract, generated-output-allowlist, no-fake-formedible-import-surface, no-placeholder-public-exports, no-registry-mirror, no-source-rewrite-sync, package-root-real-exports, public-doc-imports, shadcn-primitive-usage}.test.ts. Focus: scan logic, allowlist gaps.

## 3. Totals
27 clusters, 235 reviewable owning-source files.
