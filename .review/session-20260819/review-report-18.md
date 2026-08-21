# Review Report — Cluster 18: Docs example forms (14 canonical compatibility examples)

Reviewer verified every example against the current rewrite implementation in
`packages/formedible/src/` (validation wiring in `use-formedible.tsx` / `validation.ts`,
each field component, `use-multi-page.ts`, `use-form-persistence.ts`, `use-form-analytics.ts`).

Known/tracked findings (NOT re-reported): date-field submits `'YYYY-MM-DD'` strings vs `z.date()` in
advanced-field-types-form; `help.tooltip` dynamic interpolation lost; rental-car `disablePastDates`
unsupported; rental-car UTC/local date mixing; combobox/zod enum mismatch in
`src/components/examples/contact-form.tsx` (the OTHER copy — see Finding 3 for this copy).

Verified-working (no issues beyond known list): `flow-form.tsx` (string dates match implementation),
`tabbed-form.tsx`, `checkout-form.tsx` (hidden optional fields pass with `""`), `survey-form.tsx`
(all conditionally hidden fields are plain `.optional()` with no min constraints; rating/slider/number
submit real numbers; dynamic `options` function works), `analytics-tracking-form.tsx` (callback
signatures match `use-form-analytics.ts` exactly, including `onFormComplete(timeSpent, formData)`),
string-array `options` (e.g. timeline selects) are normalized correctly.

---

### [SEVERITY: CRITICAL] Finding 1: Form-level zod validation ignores conditional visibility — conditional-pages-form and conditional-in-obj can never be submitted (silently)

**File**: apps/web/src/components/docs/examples/conditional-pages-form.tsx:10-17, 474-491; apps/web/src/components/docs/examples/conditional-in-obj.tsx:13, 99-106

**Problem**: `buildFormValidators` (packages/formedible/src/lib/formedible/validation.ts:372-416) parses the FULL form values against the whole zod schema on `onSubmit` — conditionally hidden fields are not excluded and their values are not stripped/undefined'd. `getInvalidFieldEntries` (packages/formedible/src/hooks/use-formedible.tsx:248-264) skips hidden fields for the error summary/navigation, but the TanStack form-level validator still rejects the submit, and because the invalid fields are hidden, no error is ever displayed anywhere.

**Evidence**:
- conditional-pages-form: `firstName/lastName/personalId: z.string().min(1).optional()` default to `""` (lines 477-482) and `companyName/taxId: z.string().min(1).optional()` default to `""` (lines 483-486). In zod, `.optional()` only admits `undefined` — `""` still runs `min(1)` and fails. Submitting as "individual" fails on the hidden business fields (`companyName`, `taxId`); submitting as "business" fails on the hidden individual fields (`firstName`, `lastName`, `personalId`). Both branches are blocked from the default state.
- conditional-in-obj: `equipementListRoom: z.string().min(10).optional()` with default `""` (lines 99-106). With the equipment switch OFF (the default state), the textarea is hidden but `""` fails `min(10)` at the form level → submit is blocked. The nested error is keyed `roomDetails[0].equipementListRoom`, so neither `getFieldErrorFromMeta('roomDetails')` nor `schemaFieldMessage('roomDetails')` surfaces it (use-formedible.tsx:230-264).
- Submit flow: DOM `onSubmit` pre-check passes (hidden fields skipped, use-formedible.tsx:593-605) → `form.handleSubmit()` runs the form-level `onSubmit` validator → rejected → `onSubmitInvalid` fires → `getInvalidFieldEntries` returns 0 entries → no validation summary, no navigation, no message. The submit button appears completely dead.

**Impact**: Two of the 14 canonical compatibility examples — the primary evidence that old schemas still work — cannot be submitted at all in their default state, with zero user feedback. The old implementation evidently skipped or stripped conditionally hidden values; the rewrite does not.

**Suggestion**: Either (a) make the implementation strip/skip hidden conditional fields during form-level validation (e.g. run `shouldRenderField` filtering over the values before schema parse, matching the field-level behavior), or (b) fix the example schemas so hidden-state defaults are valid (`z.string().min(1).optional().or(z.literal(''))`, or `undefined` defaults). Option (a) matches the documented conditional behavior these examples were ported from.

---

### [SEVERITY: HIGH] Finding 2: array-fields-form nested field types don't match the schema — using the fields as their placeholders instructs breaks submission

**File**: apps/web/src/components/docs/examples/array-fields-form.tsx:16-17, 30 (schema); 325-337, 402-406 (field configs)

**Problem**: Three nested fields inside `arrayConfig.objectConfig.fields` are declared as plain `text` inputs but the schema expects transformed types. The rewrite's `TextField` submits the raw string (packages/formedible/src/components/formedible/fields/text-field.tsx:55) with no coercion, so any input the placeholders invite fails validation.

**Evidence**:
- `skills`: schema `z.array(z.string())` (line 16) but field `{ type: "text", placeholder: "Enter skills (comma-separated)" }` (lines 325-330). Typing `"react, ts"` submits the string → `Expected array, received string`. (Untouched `[]` default passes, so the form only breaks once the field is used as designed.)
- `startDate` (teamMembers): schema `z.date()` (line 17) but field `{ type: "text", placeholder: "YYYY-MM-DD" }` (lines 331-336). A typed `"2026-01-15"` string fails `z.date()`. Additionally the `new Date()` default renders as an empty input because `TextField` only displays string values (text-field.tsx:38).
- `isPrimary` (emergencyContacts): schema `z.boolean()` (line 30) but field `{ type: "text", placeholder: "true/false" }` (lines 402-406). Typing `"true"` fails `Expected boolean, received string`.

**Impact**: The array-fields showcase cannot be submitted after normal intended use. Inline errors do appear under the nested inputs (nested field paths like `teamMembers[0].skills` are wired correctly), so this is visible rather than silent, but the promised comma-separated/array, text-date, and "true/false" boolean behaviors do not exist in the rewrite.

**Suggestion**: Align the example with the implementation: use `type: "multiSelect"` for skills (submits `string[]`), `type: "date"` + a `z.string()` (or keep `z.date()` only if dates become Date objects), and `type: "switch"`/`"checkbox"` for isPrimary (both submit booleans).

---

### [SEVERITY: MEDIUM] Finding 3: This docs copy of contact-form has the SAME combobox/zod enum mismatch tracked for the other copy

**File**: apps/web/src/components/docs/examples/contact-form.tsx:11, 144-150

**Problem**: The `subject` combobox offers five options (`general`, `support`, `sales`, `billing`, `feature` — lines 144-150) but `contactSchema.subject` is `z.enum(["general", "support", "sales"])` (line 11).

**Evidence**: `ComboboxField.selectOption` submits the raw option value (combobox-field.tsx:28-31). Selecting "Billing Question" or "Feature Request" makes both the field-level and form-level schema validation fail with an enum error, so the form cannot be submitted until the user picks one of the three valid subjects.

**Impact**: Identical to the tracked issue in `src/components/examples/contact-form.tsx`, but present in this docs copy too (it renders live at `/docs/examples`). The mission asked to check this copy specifically: same issue, no additional ones (multicombobox categories submit `string[]` matching `z.array(z.string()).optional()`, `urgent` checkbox submits boolean matching `z.boolean().default(false)`).

**Suggestion**: Add `billing` and `feature` to the enum, or remove them from the options — in this file and in the display code string (`contactFormCode`).

---

### [SEVERITY: MEDIUM] Finding 4: `z.date()` schemas in four more examples break as soon as the user picks a date (known root cause, wider scope than tracked)

**File**: apps/web/src/components/docs/examples/registration-form.tsx:11; apps/web/src/components/docs/examples/job-application-form.tsx:13; apps/web/src/components/docs/examples/conditional-pages-form.tsx:12; apps/web/src/components/docs/examples/array-fields-form.tsx:17

**Problem**: The tracked finding covers `advanced-field-types-form.tsx` (`birthDate: z.date()`). The same root cause — `DateField.onChange` submits the raw `'YYYY-MM-DD'` string (packages/formedible/src/components/formedible/fields/date-field.tsx:48) — also affects `birthDate`/`startDate`/`dateOfBirth` in registration-form, job-application-form, and conditional-pages-form (plus the text-field variant in array-fields-form, Finding 2).

**Evidence**: Untouched `new Date()` defaults pass `z.date()`, but any user interaction with the date input replaces the Date with a string and the form-level + field-level schema validation rejects the submit (`Expected date, received string`).

**Impact**: Three more of the 14 canonical examples become unsubmittable the moment the user touches the date field. Reported only to record scope — the fix (schema or field behavior) is the same as for the tracked finding.

**Suggestion**: When fixing the tracked issue, also change these schemas to `z.string()` (matching the implementation) or convert/coerce date strings to `Date` before validation.

---

### [SEVERITY: MEDIUM] Finding 5: Persistence key `demo-project-inquiry-form` is shared by three live demos, leaking drafts between them

**File**: apps/web/src/components/docs/examples/persistence-form.tsx:257; also apps/web/src/features/docs/compatibility-examples.tsx:265 and apps/web/src/routes/docs/persistence.tsx:54 (which links to the same demo)

**Problem**: The review focus asked about persistence key collisions between examples. This example's key is identical to the key used by the compatibility persistence demo rendered on the docs index (`docs-layout.tsx` renders `docsCompatibilityExamples` including a persistence form with `restoreOnMount: true` and the same 1500 ms autosave).

**Evidence**: Both forms mount at different times (docs index vs `/docs/examples`), both restore on mount and autosave to `localStorage['demo-project-inquiry-form']`. A draft partially filled in one demo is restored into the other demo on the next visit; submitting one demo clears the key the other demo would restore from.

**Impact**: Confusing demo behavior rather than data corruption (the field shapes are identical across the three usages, so restored values are shape-compatible). Still, the persistence demo's "try refreshing the page" promise can show values typed into a different demo, and drafts can be lost by the interleaved writes of whichever demo mounted last.

**Suggestion**: Give each demo a distinct key (e.g. `docs-examples:project-inquiry:v1` vs `docs-index:project-inquiry:v1`).

---

### [SEVERITY: MEDIUM] Finding 6: `workDuration` default value shape doesn't match what the duration field reads — shows 0h instead of the 8h default

**File**: apps/web/src/components/docs/examples/advanced-field-types-form.tsx:942 (runtime default; same in display code at line 590)

**Problem**: `defaultValues.workDuration` is `{ hours: 8, minutes: 0 }`, but `DurationPickerField.parseDuration` only recognizes object values that contain a `seconds` key (`isDurationValue`, packages/formedible/src/components/formedible/fields/duration-picker-field.tsx:91-93). Without `seconds`, the value falls back to `{ hours: 0, minutes: 0, seconds: 0 }`.

**Evidence**: On mount the "Daily Work Hours" field displays `00 / 00` selects and text `0` ("Total: 0 seconds") instead of 8h, until the user interacts. After interaction the field submits `{ hours, minutes, seconds, totalSeconds }`, which the `z.object({ hours, minutes })` schema strips unknown keys from, so validation still passes — display-only mismatch.

**Impact**: The default value silently displays as zero; a defaultValues/field-shape mismatch of the kind the review focus called out. No validation failure.

**Suggestion**: Use `workDuration: { hours: 8, minutes: 0, seconds: 0 }` in the default values (both the runtime config and the exported code string).

---

## Considered and rejected (not flagged)

- `objectConfig.collapsible/defaultExpanded/title/showCard` in conditional-in-obj and array-fields-form are silently ignored by `array-field.tsx` — cosmetic degradation, no runtime breakage.
- `localStorage.removeItem("real-estate-form-draft")` in conditional-in-obj targets a key nothing writes — dead code, harmless.
- `setFormattedSubmission` in a sonner toast action (array-fields) and `setIsSubmitted` after a 2 s await (rental-car) may fire after unmount — no-op in React 18+/19, benign.
- Location picker manual-entry draft values transiently fail the strict `workLocation` object schema while typing coordinates — implementation draft design, edge case; final submitted shape is correct.
- Double toast on analytics submit (`onFormComplete` + `onSubmit`) — cosmetic.
- Rental-car `placeholder: "{{firstName}}.doe@email.com"` resolves to `.doe@email.com` when empty — cosmetic; `help.tooltip` interpolation loss is already tracked.
