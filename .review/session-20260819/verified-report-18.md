# Verified Report — Cluster 18: Docs example forms

Verification agent: Report 18. Method: every claim checked against source at the cited
file:line, plus **empirical reproduction** in a jsdom + React 19 + tsx scratch environment
(outside the repo, deleted after) that rendered the **real** `useFormedible` from
`packages/formedible/src` with **verbatim configs copied from the docs examples**, drove
fields through real DOM input events, and dispatched real submit events. 29/29 assertions
passed for Findings 1-2, 6/6 output checks for Finding 4, plus targeted zod parses and an
SSR render for Findings 3/4/6.

Note on copies: `apps/web` resolves `@formedible/ui/*` to `packages/ui/src/*` (apps/web
tsconfig alias). The synced `packages/ui` copies differ from `packages/formedible/src` by
import paths only (verified: 0 non-import diff lines for `use-formedible.tsx`), so testing
against `packages/formedible/src` is equivalent to the docs-app runtime.

Zod version: **zod 4.3.6** (catalog `^4.1.13`); TanStack form-core **1.32.0**, react-form
`^1.27.1`. In zod 4, `.optional()` still only admits `undefined` — `""` runs the inner
schema and fails `min()` (verified empirically).

---

### Finding 1: Form-level zod validation ignores conditional visibility — conditional-pages-form and conditional-in-obj can never be submitted (silently) — CONFIRMED

**Original**: `buildFormValidators` parses the FULL form values against the whole zod schema on submit; conditionally hidden fields' `""` defaults fail `.min(N).optional()`; `getInvalidFieldEntries` skips hidden fields so no error is ever displayed; both examples are unsubmitatable in their default state with zero feedback.

**Verification**:

Source mechanism confirmed:
- `packages/formedible/src/lib/formedible/validation.ts:372-416` — `buildFormValidators` builds `validate` from `formApi.parseValuesWithSchema(standardSchema)` over the complete values; there is no conditional/visibility awareness anywhere in `validation.ts` (grep for `shouldRenderField`/`conditional` in that file: zero hits; `shouldRenderField` exists only in `use-formedible.tsx`, used for rendering and for skipping entries in `getInvalidFieldEntries`).
- `packages/formedible/src/hooks/use-formedible.tsx:593-605` — DOM `onSubmit` pre-check passes when visible fields are valid, then calls the unmodified `form.handleSubmit()`, which runs the form-level validator over full values.
- TanStack `standardSchemaValidator.js` (`prefixSchemaToErrors`) keys nested issues as `roomDetails[0].equipementListRoom`, so neither `getFieldErrorFromMeta('roomDetails')` (fieldMeta lookup) nor `schemaFieldMessage('roomDetails')` (exact-key lookup in the parsed fields map, `validation.ts:238-250`) surfaces the nested hidden-field error.
- zod core verified: `z.string().min(1).optional().safeParse('')` fails ("First name is required"); `z.string().min(10).optional().safeParse('')` fails ("Too small: expected >=10 characters").

Empirical reproduction (real `useFormedible`, verbatim example configs):
- **conditional-pages-form, individual branch (default state)**: filled every visible field validly through real input events (firstName/lastName/personalId, email, phone; dateOfBirth default `new Date()`; navigated pages 1→2→4→6) and submitted → **`onSubmit` called 0 times, no `[data-formedible-validation-summary]` node, and no error-like text anywhere in the DOM**. The submit button is completely dead — exactly as reported.
- **business branch (fresh mount, pristine `""` defaults)**: set `applicationType='business'`, filled companyName/taxId/email/phone validly → **submit blocked (0 calls), no summary, no error text**.
- **Positive controls**: making the hidden fields valid too (firstName/lastName/personalId filled) → submit succeeds (1 call). This isolates the block to the hidden fields' `""` values specifically.
- **conditional-in-obj (default state)**: `equipementRoom=false` hides the textarea; `roomDetails[0].equipementListRoom=""` fails `min(10)` at the form level → **submit blocked (0 calls), no summary, no error text** (body does not even contain "10"). Positive control: switching the equipment ON and entering a valid 10+ char description → **submit succeeds**. Perfect controlled proof that the block is the hidden-state schema failure.
- Also confirmed hidden fields are genuinely unmounted (no `input[name="companyName"]` in the individual-branch DOM), so nothing can ever display their errors.

Not a false positive: no guard exists that the reporter could have missed — `form.handleSubmit()` is called bare (`use-formedible.tsx:130,152,604`), values are never stripped/filtered before schema parse, and the only hidden-field awareness (`getInvalidFieldEntries`) *hides* the errors rather than exempting the fields from validation.

---

### Finding 2: array-fields-form nested field types don't match the schema — using the fields as their placeholders instructs breaks submission — CONFIRMED

**Original**: `skills`/`startDate`/`isPrimary` are declared as plain `text` inputs but the schema wants `z.array(z.string())`/`z.date()`/`z.boolean()`; TextField submits the raw string with no coercion, so intended use fails validation.

**Verification**:

Source confirmed in `apps/web/src/components/docs/examples/array-fields-form.tsx`:
- `skills: z.array(z.string())` (line 16) vs `{ type: "text", placeholder: "Enter skills (comma-separated)" }` (lines 325-330);
- `startDate: z.date()` (line 17) vs `{ type: "text", placeholder: "YYYY-MM-DD" }` (lines 331-336);
- `isPrimary: z.boolean()` (line 30) vs `{ type: "text", placeholder: "true/false" }` (lines 402-406).
- `packages/formedible/src/components/formedible/fields/text-field.tsx:55` submits `event.target.value` raw; line 38 renders any non-string value (the `new Date()` default) as `''`.

Empirical reproduction (real `useFormedible`, verbatim config, real input events):
- Typing `"react, ts"` into Skills shows the inline error **"Invalid input: expected array, received string"** under the nested input and blocks submit. (zod 4 wording; the report's "Expected array, received string" is the same failure.)
- **Isolated isPrimary test**: with everything else valid, adding an emergency contact and typing `true` into the `true/false` field shows an inline "expected boolean" error and **blocks submit by itself** (0 onSubmit calls).
- **Isolated startDate test**: with everything else valid, typing `2026-01-15` shows an inline "expected date" error and **blocks submit by itself**; control — resetting `startDate` back to a `Date` via the form API → submit succeeds.
- The `new Date()` default renders as an **empty input** (`value=""`), exactly as claimed (text-field.tsx:38).

The report's characterization is accurate: errors are visible inline (nested field paths are wired), but the advertised comma-separated-array, text-date, and text-boolean behaviors do not exist.

---

### Finding 3: Docs copy of contact-form has the combobox/zod enum mismatch — CONFIRMED

**Original**: `subject` combobox offers 5 options (`general`, `support`, `sales`, `billing`, `feature`) but the schema enum has only 3; selecting Billing/Feature fails validation.

**Verification**:

Source confirmed:
- `apps/web/src/components/docs/examples/contact-form.tsx:11` — `subject: z.enum(["general", "support", "sales"])`; options at lines 144-150 include `{ value: "billing" }` and `{ value: "feature" }`; default `subject: "general"` (valid, so the trap only springs on selection).
- `packages/formedible/src/components/formedible/fields/combobox-field.tsx:28-31` — `selectOption` calls `field.onChange(nextValue === value ? '' : nextValue)`, submitting the raw option value with no mapping.
- Empirical zod parse: `z.enum([...]).safeParse('billing')` and `.safeParse('feature')` both fail with "Invalid option: expected one of \"general\"|\"support\"|\"sales\"".
- The same mismatch is also present verbatim in the exported display string `contactFormCode` (lines 28, 61-67), so fixing only the runtime config would leave the docs copy inconsistent — the report's suggestion covers both.

Secondary claims spot-checked: `categories` is `z.array(z.string()).optional()` (multicombobox submits `string[]`) and `urgent` is `z.boolean().default(false)` (checkbox submits boolean) — no additional mismatch, matching the report.

---

### Finding 4: `z.date()` schemas in four more examples break as soon as the user picks a date — CONFIRMED

**Original**: Same root cause as the tracked advanced-field-types-form finding (date-field submits `'YYYY-MM-DD'` strings), but also affecting registration-form, job-application-form, conditional-pages-form, and array-fields-form.

**Verification**:

Scope confirmed at all four cited sites:
- `apps/web/src/components/docs/examples/registration-form.tsx:11` — `birthDate: z.date()`; field `{ name: "birthDate", type: "date" }` (line 54); default `new Date()` (line 108).
- `apps/web/src/components/docs/examples/job-application-form.tsx:13` — `startDate: z.date()`; field `type: "date"` (lines 77-82); default `new Date()` (line 120).
- `apps/web/src/components/docs/examples/conditional-pages-form.tsx:12` — `dateOfBirth: z.date().optional()`; field `type: "date"` (lines 315-321); default `new Date()` (line 479).
- `apps/web/src/components/docs/examples/array-fields-form.tsx:17` — `startDate: z.date()` with a text-field variant (covered under Finding 2, empirically confirmed there).
- Root cause: `packages/formedible/src/components/formedible/fields/date-field.tsx:40-48` — `onChange` calls `field.onChange(nextValue)` where `nextValue = event.target.value` is the raw `'YYYY-MM-DD'` string.

Empirical reproduction with a real `type: "date"` field (`DateField`, `z.date().optional()`, `new Date()` default — the conditional-pages dateOfBirth shape):
- Default is a `Date` (passes). Picking `1990-05-05` in the input replaces the value with the **string** `"1990-05-05"` (verified via form state), an inline "expected date" error appears, and **submit is blocked (0 onSubmit calls)**. Control: resetting the field to a `Date` → submit succeeds.
- zod parse: `z.date().safeParse('2026-01-15')` fails with "Invalid input: expected date, received string"; `z.date().safeParse(new Date())` passes.

The finding is scope-only by design (fix tracked elsewhere); the scope it records is accurate.

---

### Finding 5: Persistence key `demo-project-inquiry-form` shared by live demos, leaking drafts — CONFIRMED (with one counting caveat)

**Original**: The persistence example's storage key is identical to the key used by the compatibility persistence demo rendered on the docs index; drafts filled in one demo are restored into the other, and submitting one clears the key the other restores from. Header says "three live demos".

**Verification**:

Grep confirms the key in 4 places, which resolve to **2 live forms + 2 display strings**:
1. `apps/web/src/components/docs/examples/persistence-form.tsx:257` — **live runtime form** (`PersistenceFormExample`, rendered at `/docs/examples?example=persistence` via `examples/index.tsx:163`), `restoreOnMount: true`, `debounceMs: 1500`. (Line 140 is the same key inside the exported display-code string.)
2. `apps/web/src/features/docs/compatibility-examples.tsx:265` — **live runtime form**: `DocsExampleForm` calls `useFormedible(example.options)` (line 55), and `docs-layout.tsx:89` renders every `docsCompatibilityExamples` entry, so the docs layout mounts this persistence form with the same key and `restoreOnMount: true`.
3. `apps/web/src/routes/docs/persistence.tsx:54` — **not a live form**: the key appears inside a documentation code snippet, and the page links to demo #1 (`/docs/examples?example=persistence`).

Mechanics confirmed in `packages/formedible/src/hooks/use-form-persistence.ts`: `restoreOnMount` loads from storage on mount (lines 149-153); saves write `storage.setItem(key, ...)` (line 82); `clearStorage` removes the key (line 92), and `useFormedible`'s `onSubmit` calls `clearStorage()` after a successful submit (`use-formedible.tsx:92-96`). So a draft typed in one demo is restored into the other on its next mount, and submitting either demo destroys the other's restorable draft — exactly the described leak.

Caveat (does not change the verdict): the header's "three live demos" overcounts — only two live forms share the key; `routes/docs/persistence.tsx:54` is a code snippet. The finding's own evidence paragraph already describes the collision as between two forms ("Both forms mount at different times (docs index vs /docs/examples)"), and the report itself notes the route file "links to the same demo". The core collision claim and impact are real.

---

### Finding 6: `workDuration` default `{ hours: 8, minutes: 0 }` displays as zero (missing `seconds` key) — CONFIRMED

**Original**: `isDurationValue` only recognizes object values containing a `seconds` key, so the 8h default falls back to `{0,0,0}` and renders `00 / 00` selects, text `0`, "Total: 0 seconds". After interaction the emitted object passes the schema (unknown keys stripped) — display-only mismatch.

**Verification**:

Source confirmed:
- `apps/web/src/components/docs/examples/advanced-field-types-form.tsx:942` (runtime) and `:590` (display string) — `workDuration: { hours: 8, minutes: 0 }`, no `seconds`; field config `type: "duration"`, `durationConfig.format: "hm"` (lines 759-767).
- `packages/formedible/src/components/formedible/fields/duration-picker-field.tsx:91-93` — `isDurationValue` requires `'hours' in value && 'minutes' in value && 'seconds' in value`; without `seconds` it returns false and `parseDuration` (lines 79-89) falls back to `{ hours: 0, minutes: 0, seconds: 0 }`. Line 45 renders `Total: {h*3600+m*60+s} seconds`.

Empirical: SSR-rendered the real `DurationPickerField` with `value = { hours: 8, minutes: 0 }` and the example's `durationConfig` — output contains **"Total: 0 seconds"** and the text input shows **`value="0"`** instead of the 8h default ("Total: 0 seconds" mathematically implies the selects are 0/0 too).

After-interaction claim verified: `formatDurationOutput` emits `{ hours, minutes, seconds, totalSeconds }` for format `hm` (lines 124-139), and the example's `z.object({ hours: z.number().min(0), minutes: z.number().min(0) }).optional()` parses it successfully (zod strips unknown keys — verified empirically). So validation still passes; the mismatch is display-only, exactly as reported.

---

## Summary

| # | Finding | Severity | Verdict |
|---|---------|----------|---------|
| 1 | Form-level zod validation ignores conditional visibility (conditional-pages-form / conditional-in-obj unsubmitatable, silent) | CRITICAL | CONFIRMED (empirically, with positive controls) |
| 2 | array-fields-form nested text fields vs array/date/boolean schema | HIGH | CONFIRMED (empirically, each mismatch isolated) |
| 3 | contact-form combobox options vs 3-value enum (docs copy) | MEDIUM | CONFIRMED |
| 4 | `z.date()` scope: registration, job-application, conditional-pages, array-fields | MEDIUM | CONFIRMED (empirically via DateField) |
| 5 | Persistence key `demo-project-inquiry-form` shared across demos | MEDIUM | CONFIRMED (2 live forms share the key; "three live demos" counts a code snippet as the third) |
| 6 | `workDuration` default missing `seconds` displays as 0 | MEDIUM | CONFIRMED (empirically rendered) |

6 confirmed, 0 dismissed. No false positives found; the only inaccuracy is cosmetic (Finding 5's demo count in its header, contradicted by its own evidence paragraph).
