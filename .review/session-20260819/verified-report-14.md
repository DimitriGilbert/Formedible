# Verified Report 14 — Web landing/builder routes & example components

Verification of `review-report-14.md` against actual source on branch `re-codex`.
Method: read every referenced file:line in `apps/web/src/components/examples/*`, `apps/web/src/components/demo/*`, and the formedible package sources the web app actually resolves (`apps/web/tsconfig.json:24` aliases `@formedible/ui/*` → `packages/ui/src/*`, the quick-sync copy of `packages/formedible/src/*`; vite uses `tsconfigPaths: true`). Compared against `main` via `git show` where relevant.

## Verdicts

### Finding 1: Contact form combobox offers option values the zod enum rejects — 2 of 5 subjects can never be submitted — CONFIRMED
**Original**: `subject` combobox has 5 options but the schema enum allows only 3; "Billing Question" and "Feature Request" can be picked but always fail validation.
**Verification**:
- `apps/web/src/components/examples/contact-form.tsx:9` — `subject: z.enum(["general", "support", "sales"])` (exactly 3 values). Same enum in the exported `contactFormCode` string at line 26.
- Live form options at lines 143-147: `general`, `support`, `sales`, `billing`, `feature` — 5 values. Identical 5 options inside the code string at lines 60-64. The combobox is non-creatable (no `creatable` in `comboboxConfig`, unlike the categories multicombobox), so users can only pick offered values.
- Value flows through raw: `packages/formedible/src/components/formedible/fields/combobox-field.tsx:29` — `field.onChange(nextValue === value ? '' : nextValue)` passes the option string unchanged (same in the synced `packages/ui/src/.../combobox-field.tsx` the web app resolves).
- Validation rejects it: `packages/formedible/src/lib/formedible/validation.ts` — `buildFieldValidators` (lines 314-345) chains `schemaFieldMessage(...)` into `onChange`, `onBlur`, and `onSubmit` for every field; `schemaFieldMessage` (line 238) runs `formApi.parseValuesWithSchema(schema)` (the whole zod schema) and surfaces the per-field issue. So picking "billing" immediately shows "Invalid enum value..." and also blocks submit — 2 of the 5 offered subjects are permanently un-submittable.
- Impact confirmed: `apps/web/src/components/demo/hero-examples.tsx:92-93` renders `ContactFormExample` as the preview and `contactFormCode` in the Code tab on the landing page.
- No guard exists: no `validation` override, no enum widening, nothing filters the options list.

### Finding 2: Rental car form uses unsupported `dateConfig.disablePastDates` — silently ignored — CONFIRMED (and it is a rewrite REGRESSION, not a faithful port of an old gap)
**Original**: `dateConfig: { disablePastDates: true }` is passed but never consumed; past pickup dates remain selectable.
**Verification**:
- Passed at `apps/web/src/components/examples/rental-car-flow-form.tsx:157-159` (live) and 770-772 (exported `RentalCarFlowCode` string), with the comment `// Disable all past dates` documenting intent.
- `FormedibleDateConfig` (`packages/formedible/src/lib/formedible/types.ts:519-525`) declares only `minDate`, `maxDate`, `disableDate`, `format`, plus `readonly [customProp: string]: unknown` — the index signature swallows `disablePastDates` with no type error.
- `packages/formedible/src/components/formedible/fields/date-field.tsx` reads only `minDate` (line 32 → `min` attr), `maxDate` (line 33), `disableDate` (line 44). Repo-wide grep: `disablePastDates` appears only in the two example copies (`apps/web/src/components/examples/` and `apps/web/src/components/docs/examples/rental-car-flow-form.tsx`) and a declarative inventory (`tests/compatibility-examples/behavior-examples.ts:254` — string labels, no behavioral assertion, so no guard). The synced copy `packages/ui/src/components/formedible/fields/date-field.tsx` (what the web app actually imports) is identical — only `minDate`/`disableDate` referenced.
- **main comparison (corrects the verification brief's premise)**: on `main`, `disablePastDates` was NOT ignored — it was a supported key. `git show main:packages/formedible/src/lib/formedible/types.ts` line 255 declares `disablePastDates?: boolean`, and `git show main:packages/formedible/src/lib/formedible/date.ts` (`buildDisabledMatchers`) implements it: `if (dateConfig.disablePastDates) { matchers.push({ before: new Date() }); }`, consumed by main's Calendar-based DateField via `disabledMatchers`. The `re-codex` rewrite replaced that Calendar field with a plain `<input type="date">` and dropped both the type key and the implementation.
- Weighing regression vs faithful port: the example file does not exist on `main` (`git show main:apps/web/.../rental-car-flow-form.tsx` → "exists on disk, but not in 'main'"); it was authored on this branch (first at commit `be35a6e`) using the old API contract the rewrite had already removed. Either way the runtime fact stands — the advertised constraint does nothing, `tests/compatibility-examples/behavior-examples.ts` still lists it as expected config surface, and the exported code string teaches a dead key. Verdict: real issue; the git evidence makes it a package contract regression compounded by stale example code, which is arguably worse than the original MEDIUM framing.

### Finding 3: Rental car return-date rule mixes UTC and local Date parsing — same-day returns wrongly allowed in negative UTC offsets — CONFIRMED
**Original**: `disableDate` compares UTC-midnight pickup vs local-midnight candidate; the "return must be after pickup" rule only holds in positive offsets.
**Verification** (re-derived from source):
- Storage side: `date-field.tsx:48` stores the raw input value; schema is `pickupDate: z.string()` (`rental-car-flow-form.tsx:38`), so `formValues.pickupDate` is `"YYYY-MM-DD"`.
- Candidate side: `date-field.tsx:42-44` — `const nextDate = new Date(\`${nextValue}T00:00:00\`)`. Date-time strings without a zone designator parse as **local** midnight (ES2020+ spec), and that local-midnight Date is what `disableDate` receives.
- Comparison side: `rental-car-flow-form.tsx:174` — `new Date(formValues.pickupDate)` where the string is date-only ISO, which parses as **UTC** midnight. Then line 178: `return returnDate <= pickupDate`.
- Concrete derivation, pickup = `2026-08-25`:
  - pickupDate instant = 2026-08-25T00:00:00Z (always, any timezone).
  - US Eastern (UTC-4, EDT), candidate same-day return: `new Date("2026-08-25T00:00:00")` = 2026-08-25T00:00:00-04:00 = 2026-08-25T**04:00:00Z**. `04:00Z <= 00:00Z` → false → **same-day return accepted**, contradicting the line-177 comment "Disable return dates that are before or same as pickup date".
  - Paris (UTC+2): candidate = 2026-08-24T22:00:00Z. `22:00Z(Aug 24) <= 00:00Z(Aug 25)` → true → disabled (correct).
  - UTC: instants equal → `<=` → disabled (correct).
- Cross-check of other dates: next-day candidates are never wrongly disabled in any offset (e.g. UTC-4: 2026-08-26T04:00:00Z > pickup; UTC+14: 2026-08-26 local = 2026-08-25T10:00:00Z > pickup), and day-before candidates are always disabled — so the sole failure mode is exactly what the finding claims: same-day returns allowed everywhere west of UTC (all of the Americas), forbidden elsewhere. Same bug is in the exported code string at lines 783-793.

### Finding 4: Exported code samples call `useFormedible` at module scope — invalid React hooks usage shown as the official pattern — CONFIRMED
**Original**: The `*Code` template strings show `useFormedible` called at module top level with no component wrapper.
**Verification**:
- `contact-form.tsx`: `contactFormCode` spans lines 23-120; `const contactForm = useFormedible({` at line 40; string ends at line 120 with ``});`;`` — no `export function` wrapper, no return.
- `registration-form.tsx`: `registrationFormCode` spans lines 26-121; `useFormedible` at line 46; ends ``});`;`` at line 121, no wrapper.
- `survey-form.tsx`: `surveyFormCode` spans lines 25-171; `useFormedible` at line 44; ends ``});`;`` at line 171, no wrapper.
  (Initially-ambiguous `return <x.Form/>` text sits in the live components at lines 122+/123+/172+ — outside the strings; the strings genuinely end after the bare hook call.)
- `useFormedible` is a true React hook: `packages/formedible/src/hooks/use-formedible.tsx:1-2` imports `useEffect, useId, useRef, useState` and `useForm` from `@tanstack/react-form`, and uses them unconditionally (lines 75-78). Calling it at module scope throws "Invalid hook call" before any render — copy-pasting these samples produces crashing code.
- The samples are public-facing: consumed by `hero-examples.tsx` (landing page Code tab) and `docs/rendered-example-showcase.tsx`. Contrast confirmed: `RentalCarFlowCode` (line 718 inside the string) and `installationPromptCode` do wrap the hook in `export function ...()`, so the inconsistency is not a deliberate "snippet style".

### Finding 5: Clipboard copy failures are silently swallowed — error state captured then discarded, primary CTA gives zero feedback — CONFIRMED
**Original**: `[, setCopyError]` state is written but never read; `DemoCard.handleCopy` silently no-ops without the Clipboard API and swallows rejections.
**Verification**:
- `apps/web/src/components/examples/installation-prompt-generator.tsx:36` — `const [, setCopyError] = useState<string | null>(null);`; `handleCopyToClipboard` at 154-165 catches, builds `message`, calls `setCopyError(message)` (line 162).
- `apps/web/src/components/examples/system-prompt-generator.tsx:88` and handler at 654-665 — identical pattern (`setCopyError(message)` at line 662).
- Case-insensitive grep for `copyerror` across both files returns only the declarations and the two `setCopyError` writes per file (installation: 36, 158, 162; system: 88, 658, 662) — zero reads, zero renders. The destructured state value is discarded by design of `[, setCopyError]`.
- `apps/web/src/components/demo/demo-card.tsx:25-39` — `handleCopy` early-returns silently when `navigator.clipboard` is undefined (lines 26-28) and `.catch(() => { setCopied(false); })` (lines 36-38) discards the rejection reason.
- No toast/error UI anywhere on these paths. AGENTS.md explicitly bans silent failure patterns in spirit (`try/catch` with descriptive handling), and sibling code already uses `sonner` toasts, so the suggested fix is idiomatic here. No intentional-design signal found.

## False-positive check summary

- Guards searched and absent: no option filtering, enum widening, or per-field `validation` override for the contact subject (F1); no `disablePastDates` handling anywhere in `packages/formedible` or `packages/ui` (F2); no timezone normalization before the date comparison (F3); no component wrapper hidden inside the code strings (F4); no rendered copy-error UI or toast in either generator or DemoCard (F5).
- The compatibility inventory (`tests/compatibility-examples/behavior-examples.ts`) lists `disablePastDates` and `disableDate:afterPickupDate` as expected config for this exact example — confirming the behaviors are intended features that the implementation no longer delivers, i.e. the opposite of a false-positive signal.
- One correction to the review report and the verification brief: `disablePastDates` worked on `main` (declared `types.ts:255`, implemented in `lib/formedible/date.ts` `buildDisabledMatchers`); it was dropped by the rewrite on this branch. The finding stands, with a stronger (regression) framing.

## Final tally

5 confirmed, 0 dismissed.

Confirmed: (1) Contact form combobox/zod enum mismatch — 2 of 5 subjects un-submittable; (2) `disablePastDates` unsupported/ignored — rewrite regression vs main; (3) UTC/local Date mixing — same-day returns allowed in the Americas; (4) module-scope `useFormedible` in exported code samples; (5) clipboard failures silently swallowed.
