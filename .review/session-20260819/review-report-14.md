# Cluster 14 Review — Web landing/builder routes & example components

Reviewer scope: `apps/web/src/routes/ai-builder.tsx`, `apps/web/src/routes/builder.tsx`, `apps/web/src/components/examples/*` (contact, energy-rating, installation-prompt, registration, rental-car-flow, survey, system-prompt), `apps/web/src/components/demo/{demo-card,hero-examples}.tsx`.

Known issues excluded per instructions: date field submitting `YYYY-MM-DD` strings instead of `Date` objects; `help.tooltip` interpolation loss; missing `@tanstack/ai` deps breaking the build.

Verification method: every formedible API usage in the examples was cross-checked against the actual public contract in `packages/formedible/src/lib/formedible/types.ts`, `packages/formedible/src/components/formedible/fields/*`, `packages/formedible/src/hooks/*`, and `packages/formedible/src/lib/formedible/validation.ts` (which the web app consumes via the `@formedible/ui/*` → `packages/ui/src/*` alias).

## Findings

### [SEVERITY: HIGH] Finding 1: Contact form combobox offers option values that the zod enum rejects — 2 of 5 subjects can never be submitted
**File**: apps/web/src/components/examples/contact-form.tsx:9, 143-147 (live form), 59-64 (exported `contactFormCode` string)
**Problem**: The `subject` field is a non-creatable combobox with five options (`general`, `support`, `sales`, `billing`, `feature`), but the schema is `subject: z.enum(["general", "support", "sales"])`. Selecting "Billing Question" or "Feature Request" stores a value the schema validator immediately rejects.
**Evidence**: Schema at line 9: `subject: z.enum(["general", "support", "sales"])`; options at lines 143-147 include `{ value: "billing", ... }` and `{ value: "feature", ... }`. The combobox passes the raw string through (`packages/formedible/src/components/formedible/fields/combobox-field.tsx:29` `field.onChange(...)`) and field-level validation includes `schemaFieldMessage` against the whole zod schema (`packages/formedible/src/lib/formedible/validation.ts:328-342`), so the error surfaces as soon as the option is picked and again blocks submit.
**Impact**: This demo is rendered on the prerendered landing page (HeroExamples → "Contact" tab) and its `contactFormCode` export is shown in the Code tab. A user selecting Billing or Feature Request gets an immediate "Invalid enum value. Expected 'general' | 'support' | 'sales', received 'billing'" error on a value the UI itself offered, and can never submit — the flagship example looks broken. The exported code string teaches the same schema/options mismatch to library users.
**Suggestion**: Either extend the enum to `z.enum(["general", "support", "sales", "billing", "feature"])` or trim the combobox options to the three enum values — in both the live form and the `contactFormCode` string.

### [SEVERITY: MEDIUM] Finding 2: Rental car form uses unsupported `dateConfig.disablePastDates` — silently ignored, past pickup dates remain selectable
**File**: apps/web/src/components/examples/rental-car-flow-form.tsx:157-159 (live form), 770-772 (exported `RentalCarFlowCode` string)
**Problem**: The pickup date field passes `dateConfig: { disablePastDates: true }`, but `FormedibleDateConfig` (`packages/formedible/src/lib/formedible/types.ts:519-525`) only supports `minDate`, `maxDate`, `disableDate`, and `format`. `disablePastDates` is swallowed by the `[customProp: string]: unknown` index signature and never consumed — the date field renders a plain `<input type="date">` with no `min` attribute and no other handling.
**Evidence**: Repo-wide grep for `disablePastDates` matches only the example file itself (plus its docs copy); `packages/formedible/src/components/formedible/fields/date-field.tsx:27-49` reads only `minDate`/`maxDate`/`disableDate`. The field's own comment (`// Disable all past dates`) states the intended behavior.
**Impact**: The advertised constraint does not exist at runtime — users can pick a past pickup date in the flagship 19-page flow demo — and the exported code string teaches a config key that does nothing, with no type error to warn the author (index signature accepts it).
**Suggestion**: Replace with the supported equivalent, e.g. `minDate: new Date()` (or a `disableDate` that returns true for past dates), in both the live field and the code string. Separately, consider whether the package should reject or warn on unknown `dateConfig` keys.

### [SEVERITY: MEDIUM] Finding 3: Rental car return-date rule mixes UTC and local Date parsing — same-day returns wrongly allowed in negative UTC offsets (Americas)
**File**: apps/web/src/components/examples/rental-car-flow-form.tsx:170-180 (live form), 783-793 (code string)
**Problem**: The `disableDate` callback compares `new Date(formValues.pickupDate)` (a `"YYYY-MM-DD"` string, parsed as **UTC midnight**) against `new Date(date)` where `date` comes from the date field as `new Date(\`${value}T00:00:00\`)` (**local** midnight, per `date-field.tsx:42`). The two reference frames differ by the user's UTC offset, so the rule "disable return dates before or same as pickup" only holds in positive offsets.
**Evidence**: For a user in US Eastern (UTC-4) picking pickup 2026-08-25: `pickupDate` = 2026-08-25T00:00:00Z; candidate same-day return = 2026-08-25T04:00:00Z; `returnDate <= pickupDate` is false → same-day return is accepted, contradicting the comment "Disable return dates that are before or same as pickup date". In Paris (UTC+2) the same comparison correctly disables it, so behavior is region-dependent.
**Impact**: In all negative-offset timezones (the Americas) users can book a return date equal to the pickup date, which the field explicitly intends to forbid — a genuine logic error in the most heavily-shared dynamic example, and the same bug is baked into the exported code sample.
**Suggestion**: Normalize both sides to the same frame before comparing, e.g. `const pickupDate = new Date(\`${formValues.pickupDate}T00:00:00\`)` (local, matching the candidate), or compare the `yyyy-mm-dd` strings lexicographically.

### [SEVERITY: MEDIUM] Finding 4: Exported code samples call `useFormedible` at module scope — invalid React hooks usage shown as the official pattern
**File**: apps/web/src/components/examples/contact-form.tsx:40 (inside `contactFormCode`), apps/web/src/components/examples/registration-form.tsx:46 (inside `registrationFormCode`), apps/web/src/components/examples/survey-form.tsx:44 (inside `surveyFormCode`)
**Problem**: The `*Code` template strings exported for the DemoCard "Code" tab show `const contactForm = useFormedible({...})` executed at module top level with no component wrapper, while the live implementations correctly call the hook inside the exported component. A React hook called outside a component crashes with "Invalid hook call" as soon as any render occurs.
**Evidence**: e.g. `contactFormCode` (line 23-120) runs schema setup then `const contactForm = useFormedible({ ... })` and ends at `});` — there is no `export function ...()` wrapper (contrast with `installationPromptCode` and `RentalCarFlowCode`, which do wrap in a component).
**Impact**: These strings are the public-facing usage examples (rendered on the landing page Code tab and reused by docs). Copy-pasting them — the product's advertised workflow — produces code that throws at runtime; it also misrepresents the hook's contract (per AGENTS/docs, `useFormedible` must run inside a component).
**Suggestion**: Wrap the hook call in an `export function ContactFormExample()` (etc.) inside each code string, matching the live component structure.

### [SEVERITY: MEDIUM] Finding 5: Clipboard copy failures are silently swallowed — error state is captured then discarded, primary CTA gives zero feedback
**File**: apps/web/src/components/examples/installation-prompt-generator.tsx:36, 154-165; apps/web/src/components/examples/system-prompt-generator.tsx:88, 654-665; apps/web/src/components/demo/demo-card.tsx:25-39
**Problem**: Both generator widgets declare `const [, setCopyError] = useState<string | null>(null)` — the error value is written but never read or rendered. `handleCopyToClipboard` catches clipboard rejection and only resets `copied` to false. `DemoCard.handleCopy` additionally early-returns when `navigator.clipboard` is undefined and swallows rejections in `.catch(() => setCopied(false))`.
**Evidence**: installation-prompt-generator.tsx line 36 and system-prompt-generator.tsx line 88 both destructure the state value away (`[, setCopyError]`); no JSX in either file references a copy error. demo-card.tsx:26-28 returns silently when the Clipboard API is missing.
**Impact**: "Copy Installation Guide" / "Copy System Prompt" / the per-snippet "Copy" button are the primary actions of these widgets. In environments where clipboard writes are denied (sandboxed/cross-origin iframes, non-secure contexts, permission policies), the click does nothing visible — the user cannot tell whether anything was copied and has no way to learn why it failed, which reads as a broken feature rather than a denied permission.
**Suggestion**: Surface the failure — a small inline error message or a `toast.error(...)` (sonner is already a dependency and used in these files' siblings) in the catch path, and render the stored `copyError` state instead of discarding it.

## Files with no real issues found

- `apps/web/src/routes/ai-builder.tsx` — thin, correct wrapper: `/ai-builder` is a valid `PublicRoutePath` with dedicated SEO meta (WebApplication JSON-LD branch in `seo.ts:120`); the `h-full min-h-0` chain resolves against the root's `grid-rows-[auto_1fr]` container. AIBuilder is client-mode (browser-side provider calls), so no server chat route is involved from this route file.
- `apps/web/src/routes/builder.tsx` — same SEO/layout verification, no issues.
- `apps/web/src/components/examples/energy-rating-component.tsx` — pure presentational slider visualization (consumed via `visualizationComponent` in `docs/examples/advanced-field-types-form.tsx`); props and rating maps are consistent, no runtime paths can fail.
- `apps/web/src/components/examples/registration-form.tsx` (live component) and `survey-form.tsx` (live component) — verified against the package contract: function-form `options`, `conditional`, `ratingConfig`/`sliderConfig` numbers vs `z.number()`, optional strings for hidden conditional fields (defaults satisfy the schemas while hidden), page interpolation via `resolveDynamicText` all behave correctly. The `birthDate: z.date()` string mismatch is the known excluded issue.
- `apps/web/src/components/examples/installation-prompt-generator.tsx` / `system-prompt-generator.tsx` (form wiring) — enum values match options, conditional fields are schema-optional, submit-state swap (`isSubmitted`) unmounts only the `Form` render while `useForm` state lives in the parent component, so "Generate Another" restores prior values without state loss.
- `apps/web/src/components/demo/hero-examples.tsx` — correct typed selector state and conditional rendering; all imported exports exist.

## Summary

- CRITICAL: 0
- HIGH: 1 (Finding 1: contact form enum/options mismatch)
- MEDIUM: 4 (Findings 2-5)
