# Formedible Documentation Rewrite Plan

## Overview

Rewrite all documentation pages in `apps/web/src/routes/docs/` from skeleton outlines to comprehensive, production-quality content. Create README files for the root repository and all 4 packages. Extend the DocsGuidePage component to support API property tables.

## Key Insight

The `/docs/examples` page already has **14 live interactive examples** with rendered forms, code viewers, filtering, and navigation. That page is the crown jewel. All other doc pages should **link to their related live examples** rather than trying to duplicate that experience with static code blocks.

The inline `codeExampleIds` (currently 5) serve a different purpose: focused, minimal setup patterns shown in the right column. They're fine as-is. Doc pages should lean on the live examples gallery for interactive demos and use inline blocks only for concise setup/import patterns.

## Global Requirements

- **NOT-AI-WRITER SKILL**: Every implementer subagent that produces prose content MUST load the `not-ai-writer` skill before writing. No "delve", "tapestry", "comprehensive", "holistic", "leverage", no formulaic transitions, varied sentence lengths, authentic voice.
- **Existing patterns**: All doc pages follow the `DocsGuidePage` component pattern in `apps/web/src/components/docs/guide-page.tsx`.
- **Live examples mapping**: Each doc page MUST include a `related` link to its corresponding live example(s) on `/docs/examples` where applicable:
  - advanced-features → "Multi-Step Registration", "Tabbed Form Layout", "Conditional Pages"
  - persistence → "Form Persistence & Auto-Save"
  - analytics → "Analytics & Tracking Form"
  - dynamic-text → "Vacation Car Rental Flow", "Rental Car Flow Form"
  - fields → "Advanced Field Types", "Dynamic Array Fields"
  - validation → "Dynamic Survey Form", "Job Application Form"
- **SEO**: Every route uses `createRouteSeoHead` from `@/features/docs/seo`.
- **Gatekeeping**: `pnpm run check-types` (all packages) after every phase.

## Prerequisites

- pnpm installed
- All existing code compiles (`pnpm run check-types` passes)
- DocsGuidePage component at `apps/web/src/components/docs/guide-page.tsx`
- code-examples.ts at `apps/web/src/features/docs/code-examples.ts`
- 14 live examples at `apps/web/src/components/docs/examples/`

---

## Phase 1: Infrastructure - Extend DocsGuidePage for API Property Tables

**Type**: Sequential

**Why**: DocsGuidePage only supports sections with title/body/bullets. API reference pages need property tables (name, type, default, description). This adds that capability.

**Requirements**:
- Create `ApiPropertyTable` component at `apps/web/src/components/docs/api-property-table.tsx`
- Accept rows of `{ name: string; type: string; defaultValue?: string; description: string; required?: boolean }`
- Responsive table with columns: Property (monospace), Type (monospace), Default, Description
- Required properties get a visual indicator
- Types that overflow get horizontal scroll on the cell
- Use existing design tokens (text-foreground, text-muted-foreground, bg-background, bg-border)
- Extend `DocsGuideSection` type with optional `table`:
  ```ts
  table?: {
    headers: readonly string[];
    rows: readonly { readonly cells: readonly string[] }[];
  };
  ```
- Update `DocsGuidePage` to render the table after bullets when `section.table` is present
- Same card styling (bg-background, p-6 md:p-8)

**Inputs**:
- Read: `apps/web/src/components/docs/guide-page.tsx`, `apps/web/src/features/docs/content.ts`

**Outputs**:
- Create: `apps/web/src/components/docs/api-property-table.tsx`
- Modify: `apps/web/src/components/docs/guide-page.tsx`
- Modify: `apps/web/src/features/docs/content.ts` (if DocsGuideSection type lives there)

**Validation**:
- `pnpm run check-types:web` passes
- `pnpm run build:web` passes
- Existing pages without tables still render correctly (backward-compatible)
- No `any` types

**Dependencies**: None

---

## Phase 2: Core Doc Pages Rewrite

**Type**: Parallel (4 sub-tasks)

**Why**: These are the highest-traffic pages. API reference, field types, validation, and getting-started form the backbone of any form library's docs.

### 2.1: Getting Started

**Requirements**:
- Rewrite `apps/web/src/routes/docs/getting-started.tsx`
- Expand from 2 sections to 5-6:
  1. **Prerequisites** - Node.js 18+, pnpm, TanStack Start project, shadcn initialized
  2. **Install the surface** - shadcn add command, what gets copied, where files land
  3. **First form** - Define values type, create fields, render Form component
  4. **Add validation** - Quick Zod schema example, formOptions.validators
  5. **Customize field UI** - Edit copied components, override per-field with `component` prop
  6. **Next steps** - Links to fields, validation, examples with descriptions
- codeExampleIds: `['shadcn-install-surface', 'typed-hook-usage']` (already exist)
- related links: Fields, Validation, API, Examples (with link to `/docs/examples`)

**Outputs**: Modify `getting-started.tsx`

**Validation**: `pnpm run check-types:web` passes, 5+ sections, no AI prose

### 2.2: API Reference

**Requirements**:
- Rewrite `apps/web/src/routes/docs/api.tsx`
- The most important page. Complete API documentation.
- Use property tables from Phase 1.
- Sections:
  1. **useFormedible hook** - Function signature, generic param, what it returns
  2. **UseFormedibleOptions** - Full property table (~30 properties: fields, formOptions, schema, crossFieldValidation, asyncValidation, pages, tabs, progress, persistence, analytics, defaultComponents, globalWrapper, submitLabel, nextLabel, previousLabel, onPageChange, autoSubmitOnChange, autoSubmitDebounceMs, disabled, loading, showSubmitButton, collapseLabel, expandLabel, formClassName, form event handlers)
  3. **FormedibleFormOptions** - Property table (defaultValues, onSubmit, onChange, onBlur, onFocus, onReset)
  4. **Return value** - Property table (Form, form, currentPage, totalPages, visiblePages, goToNextPage, goToPreviousPage, setCurrentPage, isFirstPage, isLastPage, progressValue, saveToStorage, loadFromStorage, clearStorage)
  5. **Form component props** - Standard HTML form attributes
- codeExampleIds: `['shadcn-install-surface', 'typed-hook-usage']`
- related: Fields, Validation, Getting Started, Examples

**Outputs**: Modify `api.tsx`

**Validation**: `pnpm run check-types:web` passes, 3+ property tables, all UseFormedibleOptions properties documented

### 2.3: Fields

**Requirements**:
- Rewrite `apps/web/src/routes/docs/fields.tsx`
- Expand from 2 sections to 7-8:
  1. **Field configuration** - FormedibleFieldConfig overview, property table for common keys (name, type, label, description, placeholder, disabled, required, className, page, tab, section)
  2. **Text inputs** - text, email, password, url, tel, textarea. Config differences
  3. **Selection fields** - select, radio, checkbox, switch. Options patterns
  4. **Advanced inputs** - slider (sliderConfig), rating (ratingConfig), phone (phoneConfig), file (fileConfig), color (colorConfig), masked (maskedInputConfig), duration (durationConfig), location (locationConfig)
  5. **Multi-value fields** - multiSelect, combobox, autocomplete, multiCombobox. search, creatable, async options
  6. **Structural fields** - array (arrayConfig, nestedFields, sortable), object (objectConfig, layout, columns)
  7. **Dynamic behavior** - conditional (string path vs function), dynamic options, dynamicPlaceholder
  8. **Custom rendering** - component prop, wrapper prop, globalWrapper, defaultComponents
- codeExampleIds: `['field-registry-extension']` (already exists)
- related: API, Validation, Getting Started, Examples (link to "Advanced Field Types" and "Dynamic Array Fields" live examples)

**Outputs**: Modify `fields.tsx`

**Validation**: `pnpm run check-types:web` passes, 7+ sections, field type groups documented with config objects

### 2.4: Validation

**Requirements**:
- Rewrite `apps/web/src/routes/docs/validation.tsx`
- Expand from 2 sections to 6-7:
  1. **Validation overview** - Three levels: built-in, field-level, form-level. Execution order
  2. **Built-in constraints** - required, email format, URL format, maxLength, min/max. Automatic, no config
  3. **Form-level schema** - Standard Schema v1 (Zod, Valibot, ArkType). `schema` prop on UseFormedibleOptions
  4. **Field-level validation** - `validation` prop on FormedibleFieldConfig. Function signature, return type (string | null | false)
  5. **Async validation** - `asyncValidation` config, AbortSignal, debounceMs, loadingMessage
  6. **Cross-field validation** - FormedibleCrossFieldValidation array, fields list, validator function
  7. **Inline validation** - `inlineValidation` on field config, real-time, showSuccess
- codeExampleIds: `['typed-hook-usage']` (already exists)
- related: API, Fields, Getting Started, Examples (link to "Dynamic Survey Form" and "Job Application Form")

**Outputs**: Modify `validation.tsx`

**Validation**: `pnpm run check-types:web` passes, 6+ sections, all validation levels documented

**Phase-level Validation**:
- All 4 sub-tasks pass
- Consistent tone and style
- Cross-references accurate
- `pnpm run check-types` passes (all packages)
- No AI prose

**Dependencies**: Phase 1 must complete (for API table support in api.tsx and fields.tsx)

---

## Phase 3: Feature Doc Pages Rewrite

**Type**: Parallel (4 sub-tasks)

### 3.1: Advanced Features

**Requirements**:
- Rewrite `apps/web/src/routes/docs/advanced-features.tsx`
- Expand from 2 sections to 5-6:
  1. **Multi-page forms** - FormediblePageConfig, `page` on fields, conditional pages, navigation controls
  2. **Tabbed forms** - String tabs vs FormedibleTabConfig, `tab` on fields, conditional tabs
  3. **Progress indicators** - FormedibleProgressConfig, showSteps, showPercentage, progressValue calculation
  4. **Conditional UI** - conditional property (string path vs function), page-level, tab-level
  5. **Dynamic options** - Function-based options reacting to form values, dependent selects
  6. **Auto-submit** - autoSubmitOnChange, autoSubmitDebounceMs, use cases
- No inline codeExampleIds (the existing 5 don't cover these features - that's fine, link to live examples instead)
- related: API, Fields, Examples (link to "Multi-Step Registration", "Tabbed Form Layout", "Conditional Pages")

**Outputs**: Modify `advanced-features.tsx`

**Validation**: `pnpm run check-types:web` passes, 5+ sections, multi-page/tabs/conditional documented, live example links included

### 3.2: Persistence

**Requirements**:
- Rewrite `apps/web/src/routes/docs/persistence.tsx`
- Expand from 2 sections to 4-5:
  1. **Configuration** - FormediblePersistenceConfig property table: key (required), storage, debounceMs (500), exclude, restoreOnMount
  2. **Auto-save behavior** - Debounced save on change, saved payload (values + currentPage + timestamp), exclude behavior
  3. **Manual controls** - saveToStorage(), loadFromStorage(), clearStorage(). Auto-clear on submit
  4. **Payload structure** - FormediblePersistedPayload: values, timestamp, currentPage
  5. **UX patterns** - Long forms, draft restoration, clearing on completion, key versioning
- related: API, Examples (link to "Form Persistence & Auto-Save")

**Outputs**: Modify `persistence.tsx`

**Validation**: `pnpm run check-types:web` passes, 4+ sections, property table, live example link

### 3.3: Analytics

**Requirements**:
- Rewrite `apps/web/src/routes/docs/analytics.tsx`
- Expand from 2 sections to 4-5:
  1. **Configuration** - FormedibleAnalyticsConfig overview, property table for all callbacks
  2. **Field events** - onFieldFocus, onFieldBlur, onFieldChange, onFieldComplete, onFieldError. Signatures and timing
  3. **Page and form events** - onPageChange (timeSpent, validationState), onFormStart, onFormComplete, onFormReset
  4. **Abandonment tracking** - onFormAbandon, completionPercentage, context (currentPage, currentTab, lastActiveField), automatic on unmount
  5. **Standalone factory** - createFormAnalyticsTracker for non-React usage
- related: API, Examples (link to "Analytics & Tracking Form")

**Outputs**: Modify `analytics.tsx`

**Validation**: `pnpm run check-types:web` passes, 4+ sections, all callbacks documented, live example link

### 3.4: Dynamic Text

**Requirements**:
- Rewrite `apps/web/src/routes/docs/dynamic-text.tsx`
- Expand from 2 sections to 4:
  1. **Token syntax** - `{{fieldName}}`, whitespace handling, nested paths `{{address.city}}`
  2. **Where tokens work** - label, description, placeholder, section.title, section.description. dynamicPlaceholder flag
  3. **Resolution behavior** - null/undefined → empty string, non-string ReactNodes pass through unchanged
  4. **Practical patterns** - Personalized labels, conditional descriptions, dynamic hints
- related: API, Fields, Examples (link to "Vacation Car Rental Flow", "Rental Car Flow Form")

**Outputs**: Modify `dynamic-text.tsx`

**Validation**: `pnpm run check-types:web` passes, 4 sections, token syntax documented, live example links

**Phase-level Validation**:
- All 4 pass
- `pnpm run check-types` passes (all packages)
- All pages link to their related live examples
- No AI prose

**Dependencies**: Phase 2 recommended (consistent cross-references)

---

## Phase 4: Tool Doc Pages Rewrite

**Type**: Parallel (3 sub-tasks)

### 4.1: Builder

**Requirements**:
- Rewrite `apps/web/src/routes/docs/builder.tsx`
- Expand from 2 sections to 5:
  1. **Overview** - Visual field authoring, live preview, code generation. FormBuilder component
  2. **Getting started** - Import FormBuilder, mount in app, default tabs (Builder, Preview, Code)
  3. **Tab system** - getBuilderOnlyTabs, getBuilderAndPreviewTabs, getBuilderAndCodeTabs, createTabsWithOrder, createTabsWithDisabled
  4. **Field store** - FieldStore class, useSyncExternalStore, addField, updateField, deleteField, duplicateField, reorder, importFields
  5. **Code generation** - generateFormCode, output format (fullCode, formConfig, schemaCode)
- codeExampleIds: `['builder-imports']` (already exists)
- related: API, AI Builder, Getting Started

**Outputs**: Modify `builder.tsx`

**Validation**: `pnpm run check-types:web` passes, 5 sections, tab system and code generation documented

### 4.2: Parser

**Requirements**:
- Rewrite `apps/web/src/routes/docs/parser.tsx`
- Expand from 2 sections to 6:
  1. **Overview** - What it does, security model, use with AI output
  2. **Main API** - FormedibleParser static methods: parse, parseStructured, parseAiOutput, parseWithSchemaInference, mergeSchemas, validateWithSuggestions
  3. **Extraction** - extractFormedibleCode, fenced block format (lowercase `formedible` only)
  4. **Security** - Executable syntax rejection, code sanitization, Zod expression handling, key allowlisting, field type validation
  5. **Parser configuration** - ParserConfig: strictValidation, enableSchemaInference, mergeStrategy, maxCodeLength, enableZodParsing. defaultParserConfig
  6. **Schema inference** - parseWithSchemaInference, inferredSchema, confidence, mergeSchemas strategies (extend, override, intersect)
- related: AI Builder, API, Getting Started

**Outputs**: Modify `parser.tsx`

**Validation**: `pnpm run check-types:web` passes, 6 sections, all API methods documented, security model explained

### 4.3: AI Builder

**Requirements**:
- Rewrite `apps/web/src/routes/docs/ai-builder.tsx`
- Expand from 2 sections to 6:
  1. **Overview** - Chat with LLM to generate forms, live preview, provider management
  2. **Setup** - AIBuilder component, AIBuilderProps, controlled vs uncontrolled modes
  3. **Provider support** - OpenAI, Anthropic, OpenRouter. Models per provider. Feature matrix
  4. **Chat interface** - Streaming lifecycle, message handling, form code extraction
  5. **Parser integration** - Generated code → FormedibleParser → parseAiToFormedible → live form
  6. **Storage** - Provider secrets (memory/session/local), conversation history, export, secret redaction
- codeExampleIds: `['ai-builder-imports']` (already exists)
- related: Builder, Parser, Getting Started

**Outputs**: Modify `ai-builder.tsx`

**Validation**: `pnpm run check-types:web` passes, 6 sections, all providers documented, parser integration explained

**Phase-level Validation**:
- All 3 pass
- `pnpm run check-types` passes (all packages)
- No AI prose

**Dependencies**: None (can run in parallel with Phase 3)

---

## Phase 5: README Files

**Type**: Parallel (5 sub-tasks)

**Why**: Root README is a generic Better-T-Stack template. All 4 package READMEs are missing. These are the first thing developers see.

### 5.1: Root README

**Requirements**:
- Rewrite `README.md`
- Structure:
  1. Title + tagline
  2. Badges (TypeScript, TanStack Form, React)
  3. What it does - 3-4 sentences. Source-owned React form library on TanStack Form. 22+ field types, multi-page, tabs, analytics, persistence, builder, AI generation
  4. Quick start - Install + minimal example
  5. Features - Bulleted list
  6. Packages table (formedible, builder, ai-builder, formedible-parser)
  7. Documentation link
  8. Monorepo structure tree
  9. Development commands (pnpm install, dev, build, check-types)

**Outputs**: Modify `README.md`

**Validation**: Valid markdown, accurate, no AI prose, concise

### 5.2: packages/formedible/README.md

**Requirements**:
- Structure: Title, what it is (core hook + field rendering), installation (shadcn add), useFormedible signature, field types list (25+ grouped), key features, link to docs/api

**Outputs**: Create `packages/formedible/README.md`

**Validation**: Valid markdown, accurate field types, no AI prose

### 5.3: packages/builder/README.md

**Requirements**:
- Structure: Title, what it is (visual builder), getting started (FormBuilder mount), features (18 field types, live preview, code generation, tabs), API (FormBuilderProps, TabConfig), tab helpers, code generation

**Outputs**: Create `packages/builder/README.md`

**Validation**: Valid markdown, accurate component names, no AI prose

### 5.4: packages/ai-builder/README.md

**Requirements**:
- Structure: Title, what it is (AI form generation), getting started (AIBuilder + providers), providers (OpenAI/Anthropic/OpenRouter + models), features (streaming, preview, parser, history), architecture, security

**Outputs**: Create `packages/ai-builder/README.md`

**Validation**: Valid markdown, accurate providers/models, no AI prose

### 5.5: packages/formedible-parser/README.md

**Requirements**:
- Structure: Title, what it is (secure parser for AI config), quick start (parseAiOutput), main API methods, security model, parser config, extraction

**Outputs**: Create `packages/formedible-parser/README.md`

**Validation**: Valid markdown, accurate API methods, security model clear, no AI prose

**Phase-level Validation**:
- All 5 pass
- Consistent tone across READMEs
- No contradictions
- Cross-references accurate

**Dependencies**: None

---

## Success Criteria

- All 5 phases complete and validate
- `pnpm run check-types` passes (all packages)
- `pnpm run build` passes
- 10 doc pages rewritten with substantive content
- 5 READMEs created/rewritten
- API property tables working
- All doc pages link to their related live examples on `/docs/examples`
- No AI-sounding prose anywhere

## Statistics

- Files created: ~6 (1 component + 5 READMEs)
- Files modified: ~12 (11 doc pages + guide-page component + content.ts)
- Total new content: ~2000-3000 lines
- Fix iterations estimate: 3-5
