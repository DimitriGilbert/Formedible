# Formedible v0.5.0

Formedible 0.5 is a ground-up rebuild of Formedible on TanStack Form, released as shadcn registry items and a new documentation site at [formedible.dev](https://formedible.dev).

## Installing

```bash
pnpm dlx shadcn@latest add https://formedible.dev/r/formedible-core.json
```

```tsx
import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';
```

## Breaking changes from 0.4.x

- **New install URL.** The registry item is now `formedible-core` at `https://formedible.dev/r/formedible-core.json`. The old `https://formedible.dev/r/use-formedible.json` URL is no longer served.
- **New import path.** Files install under your shadcn `@ui` alias; with the default Vite base preset that resolves to `@/components/ui/formedible/...`. Existing form schemas and field configs do not need to change — only the hook import path (see the migration note in the README).
- **`onSubmitInvalid` form option removed.** Superseded by TanStack Form validation state and rendered field errors.
- `emailConfig` is removed; use schema-level validation or field-level `validation` for email rules.
- Analytics callbacks that duplicated TanStack/Formedible internals (page completion/abandon metrics, render/validation/submission performance callbacks) are rejected by types; runtime-supported analytics callbacks remain.

## What's new

- **New documentation site** at formedible.dev: getting started, API reference, field catalog, validation guide, and a live examples browser (contact, registration, survey, checkout, job application, tabbed, multi-page flows, persistence, analytics, arrays, conditional object/array fields, advanced fields).
- **Visual form builder** (`form-builder` registry item) with live preview and code generation.
- **AI form builder** (`ai-builder` registry item) built on TanStack AI providers: streaming chat, parser integration, and live form rendering.
- **Config parser package** (`formedible-parser` registry item) with a JSON fast path — roughly 6–8x faster parsing than the previous text pipeline, with exact behavior parity (44-parser test suite).
- **Full field catalog**: text, email, password, textarea, number, select, multiselect, combobox/autocomplete, checkbox, switch, radio group, slider, rating, date, phone, color, file, tags, plus object/array fields, sections, multi-page and tabbed flows.
- **Multi-page, tabbed flows, draft persistence, and analytics hooks** built into `useFormedible`.
- **Performance work across the core**: validator deduplication, persistence/visibility memoization, O(n) stream accumulation, and dead-code removal sweeps — all behavior-preserving with parity proofs.
- Verified against `@tanstack/react-form` 1.33.5 (see `docs/formedible-compatibility-matrix.md`).

## Legacy API compatibility

Most of the 0.4 API surface is preserved and test-covered: `section` metadata (string and object forms), `textareaConfig`, `passwordConfig` (toggle, strength meter), direct per-field validation schemas, `autocomplete`/`autocompleteConfig`, masked input (`masked`/`maskedInput`), custom field `component`/`wrapper` overrides, form-level `defaultComponents`/`globalWrapper`, and form options including `onPageChange`, `autoSubmitOnChange`, `autoSubmitDebounceMs`, `disabled`, `loading`, and `showSubmitButton`. The full matrix with per-surface test references lives in `docs/formedible-compatibility-matrix.md`.

## Registry items

| Item | URL | Dependencies |
| --- | --- | --- |
| `formedible-core` | https://formedible.dev/r/formedible-core.json | shadcn primitives + `@tanstack/react-form`, `zod`, `clsx`, `tailwind-merge`, `lucide-react` |
| `formedible-parser` | https://formedible.dev/r/formedible-parser.json | `formedible-core` |
| `form-builder` | https://formedible.dev/r/form-builder.json | `formedible-core` |
| `ai-builder` | https://formedible.dev/r/ai-builder.json | `formedible-core`, `formedible-parser` |

All dependent items resolve their Formedible dependencies automatically via `registryDependencies`; installing any single item into a fresh app is sufficient.
