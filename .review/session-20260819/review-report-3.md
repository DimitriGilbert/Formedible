# Code Review Report — Cluster 3: Choice/value fields + multi-value pickers

Reviewer scope: `packages/formedible/src/components/formedible/fields/{checkbox,switch,radio,select,slider,rating,date,multi-select,combobox,multi-combobox,autocomplete,color-picker,duration-picker}-field.tsx`

Files under `packages/ui/src` are synced copies and were not reviewed.

Clean files (no real issues found): `checkbox-field.tsx`, `switch-field.tsx`, `radio-field.tsx`, `select-field.tsx`, `slider-field.tsx`, `combobox-field.tsx`, `multi-combobox-field.tsx`.

---

### [SEVERITY: HIGH] Finding 1: Duration picker text input is destroyed by a parse/format round-trip on every keystroke
**File**: packages/formedible/src/components/formedible/fields/duration-picker-field.tsx:37-44 (with 101-122)
**Problem**: The free-text input is a controlled input whose `value` is recomputed as `formatDurationText(parseDurationText(value))` on every render, and its `onChange` commits to the form on every keystroke. `field.onChange` → `field.handleChange` (use-formedible.tsx:417-427) re-renders the field synchronously, so any intermediate text that does not yet contain a unit suffix is parsed to `{0,0,0}` and immediately rewritten to `'0'`.
**Evidence**:
```tsx
<Input
  value={formatDurationText(parts, format)}
  onChange={(event) => update(parseDurationText(event.target.value, maxHours, maxMinutes, maxSeconds))}
/>
```
Typing "1" → `parseDurationText('1')` → `{hours:0, minutes:0, seconds:0}` → `formatDurationText` → `'0'`. The typed digit disappears before the user can type "h". Every keystroke collapses back to "0" (or "1h" collapses to "0" while "1" alone cannot survive), so the value can never accumulate. Only pasting a complete "1h 30m" string works.
**Impact**: The "Enter duration (e.g., 1h 30m 45s)" input advertised by the placeholder is effectively unusable for typing. Each keystroke also fires `field.onChange`, analytics, `formOptions.onChange`, and schedules auto-submit with a collapsed value.
**Suggestion**: Keep a local draft string state while the input is focused; parse on blur (or only re-format on blur/commit), i.e. commit `parseDurationText(draft)` via `field.onChange` but render the user's raw draft while editing, mirroring how `masked-field`/`number-field` handle in-progress input.

---

### [SEVERITY: HIGH] Finding 2: Duration picker mis-parses stored numbers for `hours`/`minutes` formats (unit mismatch corrupts values)
**File**: packages/formedible/src/components/formedible/fields/duration-picker-field.tsx:79-99 vs 124-140
**Problem**: `formatDurationOutput` emits a plain number in the field's unit for single-unit formats (`'hours'` emits hours, `'minutes'` emits minutes, `'seconds'` emits total seconds). But `parseDuration` interprets *any* number as **total seconds**. For `'hours'` and `'minutes'` formats the emitted value is re-parsed in the wrong unit, so the selects reset immediately after each interaction and subsequent edits corrupt the stored value.
**Evidence**:
```ts
function parseDuration(value: unknown): DurationParts {
  if (typeof value === 'number') {
    return parseTotalSeconds(value);   // assumes seconds
  }
  ...
}
...
if (format === 'hours') {
  return parts.hours + parts.minutes / 60 + parts.seconds / 3600;  // emits hours
}
if (format === 'minutes') {
  return parts.hours * 60 + parts.minutes + parts.seconds / 60;    // emits minutes
}
```
Trace with `format: 'hours'`: user selects Hours=2 → `onChange(2)` (2 hours) → re-render → `parseDuration(2)` → `parseTotalSeconds(2)` → `{hours:0, minutes:0, seconds:2}` → Hours select snaps back to `00`, text shows "2s". User then sets Minutes=30 → `update({0,30,2})` → emits `0 + 30/60 + 2/3600 ≈ 0.5006` hours instead of the intended 2.5.
**Impact**: The `durationConfig.format` values `'hours'` and `'minutes'` (declared in `FormedibleDurationConfig`, types.ts:610) are broken: selects reset right after selection and every follow-up edit mathematically corrupts the submitted value. This violates the "duration arithmetic and submitted value shape" behavior FROM-SCRATCH-2.md requires preserving.
**Suggestion**: Make parsing unit-aware: `format === 'hours'` → `totalSeconds = value * 3600`; `'minutes'` → `value * 60`; `'seconds'` → `value`. Alternatively emit `totalSeconds` for all numeric formats and convert only at display time.

---

### [SEVERITY: MEDIUM] Finding 3: Duration picker matches format units by substring, rendering a stray Seconds select for `hours`/`minutes` formats
**File**: packages/formedible/src/components/formedible/fields/duration-picker-field.tsx:33-35 (also 109-119)
**Problem**: Rendering is gated with `format.includes('h')`, `format.includes('m')`, `format.includes('s')`. The strings `'hours'` and `'minutes'` both contain `'s'`, so a stray "Seconds" select (and a stray `Ns` text segment) is rendered for single-unit formats that have no seconds concept.
**Evidence**:
```tsx
{format.includes('h') && <DurationSelect label="Hours" ... />}
{format.includes('m') && <DurationSelect label="Minutes" ... />}
{format.includes('s') && <DurationSelect label="Seconds" ... />}
```
`'hours'.includes('s')` → true; `'minutes'.includes('s')` → true. So `format: 'hours'` shows "Hours" and "Seconds" selects; `format: 'minutes'` shows "Minutes" and "Seconds". (`'seconds'` and the multi-unit formats `'hms' | 'hm' | 'ms'` are unaffected.)
**Impact**: Wrong UI for two of the six documented formats; users can enter seconds into a field whose submitted value is hours, compounding the corruption from Finding 2.
**Suggestion**: Match formats exactly: `const units = format === 'hours' ? ['h'] : format === 'minutes' ? ['m'] : format === 'seconds' ? ['s'] : [...format]`, and gate on set membership. Same fix applies to `formatDurationText`.

---

### [SEVERITY: HIGH] Finding 4: Color picker custom text input snaps to "#000000" on every invalid keystroke and commits raw, unvalidated strings
**File**: packages/formedible/src/components/formedible/fields/color-picker-field.tsx:41-51 (with 13-15, 77-99)
**Problem**: The free-text input's controlled `value` is `displayValue`, derived by normalizing the committed form value (`normalizeHex(value)` falls back to `'#000000'` for anything unparseable). Its `onChange` commits the raw text directly (`field.onChange(event.target.value)`) and the field re-renders synchronously. Any intermediate editing state (empty input, `'#'`, `'rgb('`, partial hex) is instantly replaced with the normalized fallback, and the stored value diverges from what is displayed.
**Evidence**:
```tsx
const value = typeof field.value === 'string' && field.value !== '' ? field.value : '#000000';
const hexValue = normalizeHex(value);            // unparseable -> '#000000'
const displayValue = formatColor(hexValue, config?.format ?? 'hex');
...
<Input
  value={displayValue}
  onChange={(event) => field.onChange(event.target.value)}   // raw text committed
/>
```
Selecting all of `#ff0000` and typing `#` commits `'#'` → re-render → `displayValue` becomes `'#000000'` → the typed character is overwritten and the cursor jumps to the end; the user can never build a new value by typing. Pasting an invalid string (`'zzz'`) commits `'zzz'` as the form value while the input, swatch, and preset highlight all render `#000000`.
**Impact**: The custom color entry input (the only text-entry path when `allowCustom` is true) is unusable for typing, and the form can hold arbitrary invalid strings that do not match the displayed color — a data-integrity break in the "color format handling" behavior FROM-SCRATCH-2.md requires preserving.
**Suggestion**: Keep a local draft string while editing (commit on blur), or normalize/validate on commit: on change, only `field.onChange` when `normalizeHex`-parse succeeds (or normalize the committed text via `updateColor(event.target.value)`), and render the draft during editing.

---

### [SEVERITY: MEDIUM] Finding 5: Date field converts Date values and bounds via `toISOString()` (UTC), shifting display by one day outside UTC
**File**: packages/formedible/src/components/formedible/fields/date-field.tsx:5-19
**Problem**: `toDateInputValue` and `toDateBound` convert `Date` objects to `YYYY-MM-DD` using `toISOString().slice(0, 10)`, which formats in UTC. A `Date` at local midnight in any timezone east of UTC (e.g. `new Date(2026, 0, 15)` in Europe/Berlin = `2026-01-14T23:00:00Z`) renders as the previous day. Note this is distinct from the already-tracked finding about submitting strings instead of Dates: it is about the Date→display conversion itself.
**Evidence**:
```ts
function toDateInputValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);   // UTC
  }
  ...
}
```
Same bug in `toDateBound` (line 15) for `dateConfig.minDate`/`maxDate`, so `minDate = new Date(2030, 0, 1)` becomes `2029-12-31` in UTC+ timezones, letting users pick a day the config meant to exclude.
**Impact**: Date-typed default values and min/max bounds display and validate against the wrong calendar day for all users east of UTC (i.e. most of Europe, Asia, Africa, Australia).
**Suggestion**: Format using local date parts, e.g. `const d = value; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`` (a small local `formatDateInput` helper used by both functions).

---

### [SEVERITY: MEDIUM] Finding 6: Date field calls `disableDate` with an Invalid Date when the input is cleared or mid-edit
**File**: packages/formedible/src/components/formedible/fields/date-field.tsx:40-48
**Problem**: For `type="date"` inputs the browser fires `onChange` with `''` while the user is editing (each keystroke of a new date) and when clearing. The handler then builds `new Date(`${nextValue}T00:00:00`)` → `new Date('T00:00:00')` → **Invalid Date**, and passes it straight into the user-supplied `disableDate` callback with no guard and no try/catch.
**Evidence**:
```tsx
onChange={(event) => {
  const nextValue = event.target.value;
  const nextDate = new Date(`${nextValue}T00:00:00`);   // Invalid Date when nextValue === ''
  if (dateConfig?.disableDate?.(nextDate, (field.formValues ?? {}) as TFormValues)) {
    return;
  }
  field.onChange(nextValue);
}}
```
**Impact**: Two failure modes depending on the consumer's `disableDate`: (a) implementations that call `date.toISOString()` throw `RangeError: Invalid time value` inside the React event handler — an uncaught exception that crashes the form (this is the documented API for "date disabled-date behavior", FROM-SCRATCH-2.md item 6); (b) implementations that return truthy for NaN dates make the date field impossible to clear.
**Suggestion**: Short-circuit the empty/incomplete case before calling the callback: `if (nextValue === '') { field.onChange(''); return; }` and/or skip `disableDate` when `Number.isNaN(nextDate.getTime())`.

---

### [SEVERITY: MEDIUM] Finding 7: Multi-select nests remove `<button>`s inside the trigger `<button>` (invalid HTML)
**File**: packages/formedible/src/components/formedible/fields/multi-select-field.tsx:65-100 (badge remove button at 82-95)
**Problem**: Each selected-value badge renders a shadcn `Button` (a real `<button>` per button.tsx) for the "x" remove action *inside* the outer trigger `Button`'s subtree — interactive content nested in interactive content, which HTML forbids. The HTML parsing algorithm closes a `<button>` when a nested one starts, so any SSR consumer of this published component library gets server HTML whose structure differs from the client DOM, producing React hydration failures; screen readers and keyboard activation of the nested controls are also unreliable.
**Evidence**:
```tsx
<Button type="button" variant="outline" ... onClick={() => setIsOpen((open) => !open)}>
  <span className="flex flex-wrap items-center gap-1">
    {selectedValues.map((value) => (
      <Badge key={value} variant="secondary" className="gap-1">
        {option?.label ?? value}
        <Button type="button" variant="ghost" size="icon" ... onClick={...}>   // <button> inside <button>
          <X className="size-3" />
```
**Impact**: Invalid DOM nesting in a published library component: guaranteed hydration errors for Next.js/SSR consumers, and a11y problems (nested interactive elements) even in pure CSR (the current docs app is Vite CSR, so it does not surface there).
**Suggestion**: Render badges/removers as siblings above the trigger (a common pattern: a `div role="button"`-style trigger, or `span` badges with an `onMouseDown`/`onClick` handler plus `role="button"`/`tabIndex` styling instead of real `<button>` elements inside the trigger).

---

### [SEVERITY: MEDIUM] Finding 8: Autocomplete input text is never synced with external field value changes (resets, programmatic sets)
**File**: packages/formedible/src/components/formedible/fields/autocomplete-field.tsx:74 (init), 170-176 (blur)
**Problem**: `inputValue` is local state initialized once from `field.value`. Unlike every other field in this cluster (which derives display from `field.value` each render), the autocomplete never re-syncs, so when the form value changes externally (form reset, conditional defaults, `form.setFieldValue`, autosaved values loaded after mount) the input keeps showing stale text.
**Evidence**:
```tsx
const [inputValue, setInputValue] = useState(typeof field.value === 'string' ? field.value : '');
// no effect syncing field.value -> setInputValue
```
Related secondary gap in the same component: with `allowCustom: false`, blurring after typing does not commit (`onBlur` only commits when `shouldCommitCustomAutocompleteValue(allowCustom)`), but the typed text also does not revert to the selected option's label — the input can show text that has no relationship to the committed value.
**Impact**: After a reset/programmatic change the field displays one value while the form holds another; with `allowCustom: false` the same divergence appears after any unselected blur. Data shown ≠ data submitted.
**Suggestion**: Add a sync effect (e.g. `useEffect(() => { setInputValue(typeof field.value === 'string' ? field.value : ''); }, [field.value])`) or track the last-committed value in a ref and reset the draft when `field.value` changes externally; when `allowCustom` is false, restore the selected option's label on blur.

---

### [SEVERITY: MEDIUM] Finding 9: Rating half-values are visually and semantically indistinguishable from full values
**File**: packages/formedible/src/components/formedible/fields/rating-field.tsx:30 (also 39, 49-59)
**Problem**: With `ratingConfig.allowHalf`, committing `x.5` fills the *next* icon completely — `isFilled = activeValue >= rating || (allowHalf && activeValue >= halfRating)` has no half-filled rendering. A value of 3.5 renders four filled icons, identical to a value of 4; hovering the half-hit-area and the full-hit-area produce the same visual, so the user cannot tell which value they are about to commit. Additionally `aria-checked={value === rating}` is never true for half values, so the `role="radio"` elements report no selection state for `x.5` values.
**Evidence**:
```tsx
const isFilled = activeValue >= rating || (config?.allowHalf === true && activeValue >= halfRating);
...
aria-checked={value === rating}
```
For `value = 3.5`: icon 4 satisfies `3.5 >= 3.5` → rendered fully filled; no radio reports checked.
**Impact**: The `allowHalf` feature misreports the committed value (0.5 displays as 1 star, 3.5 as 4 stars) in the visual UI and to assistive technology — a correctness issue in a documented config option, not just styling.
**Suggestion**: Render half states distinctly (e.g. a clipped/half-opacity overlay icon when `activeValue >= halfRating && activeValue < rating`), and make `aria-checked` reflect half selections (e.g. `aria-checked={value === rating || (allowHalf && value === halfRating)}` with `aria-valuetext`-style labeling or `aria-posinset` on the radiogroup).

---

## Summary

| Severity | Count | Findings |
| --- | --- | --- |
| CRITICAL | 0 | — |
| HIGH | 3 | #1 duration text input round-trip, #2 duration hours/minutes unit mismatch, #4 color picker text input |
| MEDIUM | 6 | #3 stray seconds select, #5 date UTC conversion, #6 disableDate Invalid Date, #7 nested buttons, #8 autocomplete stale input, #9 rating half display |

Clean files: checkbox-field.tsx, switch-field.tsx, radio-field.tsx, select-field.tsx, slider-field.tsx, combobox-field.tsx, multi-combobox-field.tsx. (Slider's `Array.isArray` branch in `InputRange.onValueChange` is dead code because the local `Slider` is a native range input that always emits a number — harmless. Base UI `Select.Value` placeholder support and `onCheckedChange` boolean signatures were verified against the installed `@base-ui/react@1.4.1`.)
