# Formedible Compatibility Audit — `re-codex` (rewrite) vs `main` (original)

Date: 2026-08-19
Scope: public API + schema backward-compatibility of `packages/formedible` (core hook/types/fields), `packages/formedible-parser`, `packages/builder`, `packages/ai-builder`, the 14 canonical docs examples, persistence format, and the rewrite's compat fixtures.

Method: `main` read via `git show main:<path>` (paths cited as `main:<path>:line`). Rewrite read from the working tree (`<path>:line`). Both branches use zod 4 (main `^4.3.6`, rewrite catalog `^4.1.13`) and TanStack React Form v1 — zod schemas are Standard-Schema compatible on both sides.

---

## 1. Field types matrix

Main's effective hook registry (`main:packages/formedible/src/hooks/use-formedible.tsx:113-139`):
`text, email, password, url, tel (via TextField fallback + type prop, lines 1762-1780), textarea, select, checkbox, switch, number, date, slider, file, array, radio, multiSelect, colorPicker, rating, phone, location, duration, autocomplete, masked, object, combobox, multicombobox`.
Note: main's separately exported `fieldComponents` registry (`main:.../fields/field-registry.tsx:26-49`) used `multiselect`/`color`-style keys but was **never imported by the hook** — `multiselect` (lowercase) on main fell through to the TextField fallback and rendered a broken text input.

Rewrite: `FormedibleFieldType` union (`packages/formedible/src/lib/formedible/types.ts:6-36`) accepts all 30 strings from FROM-SCRATCH-2 §"Field Type Compatibility"; `normalizeFieldType` (`packages/formedible/src/lib/formedible/normalize-field-config.ts:3-19`) maps `multiselect→multiSelect`, `multicombobox→multiCombobox`, `colorPicker→color`, `maskedInput→masked`; registry covers all 26 normalized types (`packages/formedible/src/components/formedible/fields/field-registry.tsx:26-53`).

| type / alias | main hook accepted | rewrite accepted | verdict |
|---|---|---|---|
| text, email, password, url, tel | yes | yes | OK |
| textarea, select, checkbox, switch, number | yes | yes | OK |
| date, slider, rating, phone, file | yes | yes | OK (date value shape changed — see F2) |
| array, object, radio, combobox | yes | yes | OK |
| autocomplete, masked | yes | yes | OK |
| duration, location, multiSelect, colorPicker | yes | yes (`colorPicker` normalized) | OK |
| multicombobox | yes | yes | OK |
| multiSelect camel / multiselect lower | camel only (lower = broken fallback) | both | OK (rewrite superset) |
| color / colorPicker | colorPicker only (`color` = fallback) | both | OK (superset) |
| maskedInput | masked only (`maskedInput` = fallback) | both | OK (superset) |
| multiCombobox camel | **no** (lowercase only) | yes | OK (superset) |

No missing or renamed field types. The rewrite is strictly more permissive than main at the type-string level.

### Submitted value shapes (main → rewrite)

| field | main | rewrite | verdict |
|---|---|---|---|
| text/email/password/url/tel/textarea/masked/combobox/autocomplete/phone | string | string | OK |
| number | number, `undefined` when empty, raw string if unparseable (`main:.../number-field.tsx:29-38`) | number / `undefined` (`number-field.tsx:55`) | OK |
| select / radio | string | string | OK |
| checkbox / switch | boolean | boolean | OK |
| slider / rating | number | number | OK |
| color | formatted string per `format` | same | OK |
| multiSelect | string[] | string[] | OK |
| duration | number for `hours|minutes|seconds`, `{hours,minutes,seconds,totalSeconds}` otherwise (`main:.../duration-picker-field.tsx:42-56`) | identical logic (`duration-picker-field.tsx` `formatDurationOutput`) | OK |
| location | `LocationValue` object / null | object / null | OK (map UI lost — D6) |
| file | single `File` / null (`main:.../file-upload-field.tsx:31-43`) | single `File`/null; `File[]` when `fileConfig.multiple` (`file-upload-field.tsx:19`) | OK+ (behavior change only for `multiple:true`, which main silently truncated to 1 file) |
| array | items array (dnd-kit reorder) | items array (button reorder) | OK |
| **date** | **`Date` object** (`main:.../date-field.tsx:75-79`) | **`'YYYY-MM-DD'` string** (`date-field.tsx` `onChange`) | **BREAKING (F2)** |

---

## 2. FieldConfig props matrix

Main type: `main:packages/formedible/src/lib/formedible/types.ts:1307-1374`. Rewrite type: `packages/formedible/src/lib/formedible/types.ts:224-284`.

| prop | main | rewrite | verdict |
|---|---|---|---|
| name, label, placeholder, description | yes (DynamicText fn or string) | yes (dynamic interpolation via `withDynamicText`, `use-formedible.tsx:323-331`) | OK |
| required | typed, **never enforced at runtime** | enforced by built-in validator (`validation.ts:167-173`) | BREAKING-strictness (folded into F3) |
| options (static/dynamic fn) | yes | yes (`resolveFieldOptions` w/ form values) | OK |
| min/max/step/rows/maxLength | yes (passed to fields) | yes + built-in constraint checks | OK |
| accept, multiple (top-level file props) | passed to fields (`main:use-formedible.tsx:1611-1612,1709-1710`) | dropped from types; `fileConfig.accept/multiple` only | DEGRADED (D9) |
| defaultValue (field-level) | typed only — **never read by the hook** (only `arrayConfig.defaultValue` was, `main:use-formedible.tsx:1754`) | absent (customProp, ignored) | OK (dead on main; no behavior change) |
| dependencies | typed only, never read | absent | OK (dead on main) |
| group | used for group-boxed rendering (`main:use-formedible.tsx:1925,2030`) | absent | DEGRADED (D8) |
| gridColumn/gridRow/gridColumnSpan/gridRowSpan/gridArea | used in grid layout (`main:use-formedible.tsx:271-275`) | absent | DEGRADED (D8, with `layout`) |
| section | `SectionConfig{title?, description?, collapsible?, defaultExpanded?}` — title optional, collapsible implemented (`main:use-formedible.tsx:345-384`) | `string \| {title: REQUIRED, description?}`; collapsible/defaultExpanded intentionally unsupported (docstring `types.ts:54-63`); renders static header (`use-formedible.tsx:366-375`) | **BREAKING (F7)** title-less object sections no longer typecheck; collapsible = INTENTIONAL-REMOVAL (code-documented, not in FROM-SCRATCH-2) |
| help | `{text, tooltip, position, link}` fully implemented incl. tooltip positioning (`main:.../field-help.tsx:10-63`) | `ReactNode \| {tooltip?, text?}` rendered as static description (`field-wrapper.tsx:6-20`); no interpolation of `{{tokens}}` | DEGRADED (D5) |
| inlineValidation | `{enabled, debounceMs, showSuccess, asyncValidator}` — wrapper UI | `{enabled, debounceMs, validator, showSuccess}` mapped to TanStack async validator (`validation.ts:323,354-361`) | OK (remap per FROM-SCRATCH-2 §Validation Architecture) |
| validation | `z.ZodSchema` — onChange safeParse (`main:use-formedible.tsx:1643-1653`) | fn / StandardSchema / `{validator,message}` (`types.ts:188-194`); zod 4 passes `~standard` | OK |
| validationConfig (`FieldValidationConfig` min/minLength/pattern/email/url/uuid/refine/customMessages...) | typed (`main:types.ts:976-993`), **never read by hook or fields** | absent | OK (dead on main) |
| emailConfig | typed + forwarded to email fields (`main:use-formedible.tsx:1844-1845`), not implemented in TextField | `emailConfig?: never` (`types.ts:258,320`) | **BREAKING (F6)** — compile error for existing configs |
| component | `ComponentType<FieldComponentProps>` — received flat props: `fieldApi, label, placeholder, description, options, min/max/step, configs...` (`main:use-formedible.tsx:1699-1849`) | `ComponentType<FormedibleFieldRenderProps>` — receives `{fieldConfig, field, renderField, defaultComponent, globalWrapper}` (`field-renderer.tsx:8`) | **BREAKING (F1)** |
| wrapper | `{children, field}` (`main:types.ts:1327-1330`) | `{fieldConfig, field, children}` (`types.ts:216-220`) | **BREAKING (F1)** |
| datalist | `DatalistConfig` (only `.options` string[] consumed, `main:use-formedible.tsx:1779`) | `readonly FormedibleFieldOption[]` native datalist (`text-field.tsx`) | OK (no example used it) |
| configs: sliderConfig, ratingConfig, phoneConfig, colorConfig, multiSelectConfig, comboboxConfig, autocompleteConfig, maskedInputConfig, locationConfig, durationConfig, fileConfig, textareaConfig, passwordConfig, numberConfig, objectConfig, arrayConfig | yes | yes (see per-config notes below) | mostly OK |
| sliderConfig.gradientColors | implemented gradient track (`main:.../slider-field.tsx:44,89-95`) | absent from type & implementation | DEGRADED (D3) — fixture still advertises it |
| sliderConfig.showTooltip/showTicks/orientation | typed only, not implemented on main | absent | OK (dead on main) |
| dateConfig.disabledDates/showTime/timeFormat/disabledDaysOfWeek/disabledDateRanges/disablePastDates/disableFutureDates | typed; **only `disableDate` implemented** on main (`main:.../date-field.tsx:56-63`) | absent (only minDate/maxDate/disableDate/format) | OK-equivalent (all but disableDate were dead on main; rental-car's `disablePastDates` was ignored on main too — `main:apps/web/src/app/docs/examples/rental-car-flow-form.tsx`) |
| dateConfig.disableDate(date, formValues) | yes | yes (`date-field.tsx` `disableDate?.(nextDate, field.formValues)`) | OK |
| locationConfig map options (mapProvider, googleMaps, openStreetMap, bingMaps, mapRenderCallback, ui, searchOptions.countryCode/bounds) | implemented — Leaflet map + tile providers (`main:.../location-picker-field.tsx:361,424,511-523`) | absent; no map rendering at all (`location-picker-field.tsx` has no map code) | DEGRADED (D6) |
| locationConfig searchCallback/reverseGeocodeCallback/enableSearch/enableGeolocation/enableManualEntry/defaultLocation | yes | yes | OK |
| phoneConfig preferredCountries/onlyCountries/excludeCountries | typed only; implementation used `allowedCountries` (`main:.../phone-field.tsx:77,90-92`) | `allowedCountries` only | OK (dead on main) |
| ratingConfig icon as ComponentType / size legacy variants | typed | icon limited to 'star'\|'heart'\|'thumbs', size sm/md/lg | OK (examples use the union values) |
| passwordConfig.requirements | typed only, not implemented | absent (rewrite implements showToggle/strengthMeter/minStrength for real) | OK |
| fileConfig.allowedTypes/uploadUrl/onUpload | typed only, not implemented (`main:.../file-upload-field.tsx` never references them) | absent | OK (dead on main) |
| comboboxConfig.allowClear, multiSelectConfig.loadingText | typed | absent (customProp) | OK-equivalent (not implemented on main) |
| className, inputClassName, disabled | (index signature / per-field) | first-class, consumed | OK |
| labelClassName, wrapperClassName | passed to wrapper/label (`main:use-formedible.tsx:1704-1705`) | absent | DEGRADED (D8 styling subset) |
| objectConfig.collapsible/defaultExpanded/showCard | implemented (`main:.../object-field.tsx:16-17,104,153`) | ignored — no collapsible/card code in rewrite `object-field.tsx` | DEGRADED (D2) |
| objectConfig.layout | `"grid"\|"vertical"\|"horizontal"` | `'stack'\|'grid'` (`types.ts:75-79`) | DEGRADED-minor (D2) — `vertical`/`horizontal` values silently fall back to stack |
| arrayConfig (itemType, min/maxItems, sortable, addButtonLabel, removeButtonLabel, defaultValue, objectConfig) | yes (dnd-kit sort) | yes (up/down buttons) | OK |

---

## 3. UseFormedibleOptions matrix

Main: `main:packages/formedible/src/lib/formedible/types.ts:1159-1304`. Rewrite: `packages/formedible/src/lib/formedible/types.ts:453-487`.

| option | main | rewrite | verdict |
|---|---|---|---|
| fields | optional (`fields = []` default) | **required** | **BREAKING type (F8)** — all 14 canonical examples pass it |
| formOptions | optional (`Partial<...>`) | **required**, and `defaultValues` **required** inside (`types.ts:362,455`; `useFormedible` reads `config.formOptions.defaultValues` unconditionally, `use-formedible.tsx:85`) | **BREAKING type (F8)** — all 14 examples pass both, so no example impact |
| schema | declared + documented (`main:apps/web/src/app/docs/api/page.tsx` "Optional: Zod schema") but **never wired into the hook** (not destructured, `main:use-formedible.tsx:392-434`) | wired: form-level + per-field mapping (`validation.ts:314-416`) | **BREAKING strictness (F3)** |
| formOptions.onSubmit / defaultValues | yes (onSubmit wrapped, `main:use-formedible.tsx:670-733`) | yes | OK |
| formOptions.onSubmitInvalid | forwarded to TanStack `useForm` via spread (`main:use-formedible.tsx:668-669`) | `onSubmitInvalid?: never` (`types.ts:369`) | **BREAKING type (F4)** |
| formOptions.onChange/onBlur/onFocus/onReset | debounced/on-valid filtering on main (300ms, `main:use-formedible.tsx:1128-1133`) | fired per change/blur/focus from field events (`use-formedible.tsx:409-426`) | OK (behavioral timing change, documented-adjacent) |
| formOptions.asyncDebounceMs / canSubmitWhenInvalid | spread into `useForm` on main | not forwarded (customProp only) | DEGRADED (D10) |
| pages / tabs / progress | yes | yes (tabs also accept plain strings; tab/page conditional added) | OK |
| progress.component, PageConfig.component | yes (`main:use-formedible.tsx:2121,2073`) | absent | DEGRADED (D7) — no example used them |
| submitLabel/nextLabel/previousLabel | yes | yes | OK |
| collapseLabel/expandLabel | yes, used by collapsible sections/objects | typed, accepted, **unused** (static headers, no collapsible UI) | DEGRADED (D2/D4) |
| formClassName | yes | yes | OK |
| fieldClassName/labelClassName/buttonClassName/submitButtonClassName | consumed (`main:use-formedible.tsx:401-404,1704,2158,2196-2211`) | absent | DEGRADED (D8) |
| submitButton (custom component) | yes (`main:use-formedible.tsx:2151,2186`) | absent | DEGRADED (D7) |
| title, description (top-level) | destructured but unused in render | absent | OK (dead on main) |
| autoScroll | implemented scrollToTop gate (`main:use-formedible.tsx:51-68,1353`) | absent (rewrite always scroll-focuses invalid field on submit) | DEGRADED-minor |
| resetOnSubmitSuccess | destructured, unused (`main:use-formedible.tsx:417`) — main ALWAYS reset after submit (`main:use-formedible.tsx:727-730`) | absent; rewrite does NOT reset after submit | DEGRADED-minor (behavior change: form no longer clears after successful submit) |
| disabled, loading, showSubmitButton | yes | yes (fieldset-based) | OK |
| onFormReset/Input/Invalid/KeyDown/KeyUp/Focus/Blur | yes | yes (`use-formedible.tsx:552-592`) | OK |
| onPageChange | yes | yes | OK |
| autoSubmitOnChange / autoSubmitDebounceMs | yes (debounce default undefined) | yes (default 300ms, `use-formedible.tsx:153`) | OK |
| crossFieldValidation | yes — state-based, blocks submit by throwing (`main:use-formedible.tsx:585-607,675-681`) | mapped to TanStack form+field validators with `onChangeListenTo` (`validation.ts:293-366,394-404`) | INTENTIONAL-REMOVAL/REMAP (documented, FROM-SCRATCH-2 §Validation Architecture) |
| asyncValidation | yes — manual debounce + setFieldMeta | TanStack `onChangeAsync` + debounce (`validation.ts:343-365`) | INTENTIONAL-REMAP (documented) |
| inlineValidation | per-field wrapper | TanStack async validator | INTENTIONAL-REMAP (documented) |
| analytics | full callback set; fired: onFormStart, onFormComplete, onFormAbandon, onPageChange, onTabChange, onTabFirstVisit, onFieldChange, onFieldError, onSubmissionPerformance; **never fired on main**: onFieldFocus*, onFieldBlur*, onFieldComplete*, onFormReset*, onPageComplete, onPageAbandon, onPageValidationError, onTabComplete, onTabAbandon, onTabValidationError, onRenderPerformance, onValidationPerformance (* wiring existed but call sites never invoked with required args — verified `main:use-formedible.tsx:771-818,1150-1220`) | fires onFormStart/Complete/Abandon/Reset, onPageChange, onFieldFocus/Blur/Change/Error/Complete; types `never` for: onPageComplete, onPageAbandon, onPageValidationError, onTabChange, onTabComplete, onTabAbandon, onTabValidationError, onTabFirstVisit, onRenderPerformance, onValidationPerformance, onSubmissionPerformance (`types.ts:422-449`) | Mixed: never-fired-on-main ones typed `never` = OK/INTENTIONAL; **onTabChange, onTabFirstVisit, onSubmissionPerformance were fired on main and are now compile errors → BREAKING (F5)**; onFieldBlur/onFieldComplete/onFormReset now actually fire (improvement) |
| layout | documented (`main:apps/web/src/app/docs/api/page.tsx:120`) + implemented grid/flex (`main:use-formedible.tsx:260-299`) | absent | DEGRADED (D8) |
| conditionalSections | typed + implemented (field filtering + page visibility, `main:use-formedible.tsx:524-529,1908-1920,2013-2025`) | absent | DEGRADED (D8) — no example used it |
| persistence | yes | yes | OK |
| defaultComponents | `Record<string, ComponentType<FieldComponentProps>>` — arbitrary custom type keys merged into registry (`main:use-formedible.tsx:486`) | `Partial<Record<NormalizedFieldType, ...>>` — known types only (`types.ts:465`) | **BREAKING (F1)** for custom-type registrations; also new prop shape |
| globalWrapper | `{children, field}` | `{fieldConfig, field, children}` | **BREAKING (F1)** |
| validationSummary (new) | — | added | OK (additive) |

---

## 4. useFormedible return contract

Main return (`main:packages/formedible/src/hooks/use-formedible.tsx:2265-2286`): form, Form, currentPage, totalPages, visiblePages, goToNextPage, goToPreviousPage, setCurrentPage, isFirstPage, isLastPage, progressValue, crossFieldErrors, asyncValidationStates, validateCrossFields, validateFieldAsync, saveToStorage, loadFromStorage, clearStorage — exactly 18 keys.

Rewrite return (`packages/formedible/src/hooks/use-formedible.tsx:664-679`): the 14 "keep" keys. Dropped keys are exactly the 4 documented in FROM-SCRATCH-2 §"useFormedible Return Contract" and mirrored 1:1 in the fixture `tests/compatibility-examples/use-formedible-return-contract.ts`. **No undocumented key was dropped.**

| key | verdict |
|---|---|
| form, Form, currentPage, totalPages, visiblePages, goToNextPage, goToPreviousPage, setCurrentPage, isFirstPage, isLastPage, progressValue, saveToStorage, loadFromStorage, clearStorage | OK (kept) |
| crossFieldErrors, asyncValidationStates, validateCrossFields, validateFieldAsync | INTENTIONAL-REMOVAL (documented) |

Behavioral deltas on kept keys:
- `currentPage`: main = 1-based index into visiblePages (`main:use-formedible.tsx:1308`); rewrite = actual page number (`use-multi-page.ts:60-66`). Differs only when visible page numbers are non-contiguous (conditional pages). DEGRADED-minor (D11).
- `goToNextPage`/`setCurrentPage`: main validated the current page (blocked navigation, marked touched, `main:use-formedible.tsx:1319-1340,1377-1426`); rewrite navigates freely and relies on the submit-time validation summary + autoNavigate (`use-formedible.tsx:301-321`). DEGRADED (D12).
- `saveToStorage()`: main took `(values)`; rewrite takes no args (saves latest). Calling with the old signature still works (arg ignored). OK.
- `loadFromStorage()`: main returned `null` unless `persistence.restoreOnMount`; rewrite loads whenever called (only mount-effect is gated, `use-form-persistence.ts:115-153`). Behavior improvement; note only.

---

## 5. Schema / validation semantics

| aspect | main | rewrite | verdict |
|---|---|---|---|
| top-level `schema` | declared in types + API docs but **never passed to `useForm`** — dead option (`main:use-formedible.tsx:392-434,668-736` — `schema` absent from destructure and formConfig) | `buildFormValidators` maps schema issues to per-field errors + form-level; every field validator also re-checks schema (`validation.ts:314-416`) | **BREAKING strictness (F3)** — previously-submitting forms can now fail |
| field-level `validation` | zod-only, onChange safeParse → first issue message (`main:use-formedible.tsx:1643-1653`) | fn / StandardSchema / `{validator, message}`; onChange+onBlur+onSubmit | OK (zod 4 supported; superset) |
| `required` | never enforced at runtime (not destructured in `main:use-formedible.tsx:1601-1637`, not in baseProps) | enforced: "`<label> is required`" (`validation.ts:167-173`) | folded into F3 |
| built-in constraints | none in hook (min/max/etc. were native input attrs only) | required, email format, URL, maxLength, numeric min/max (`validation.ts:175-209`) | OK/additive (strictness, see F3) |
| cross-field blocking submit | `throw new Error("Cross-field validation failed")` (`main:use-formedible.tsx:676-681`) | field-mapped errors; submit blocked through normal validation | INTENTIONAL-REMAP |
| async validation state | custom `asyncValidationStates` + setFieldMeta poke | TanStack async validators + AbortSignal + debounce | INTENTIONAL-REMAP |
| custom message keys (`customMessages`) | `validationConfig` only — dead | absent | OK (dead on main) |

---

## 6. Parser / Builder / AI-Builder public exports

| export | main | rewrite | verdict |
|---|---|---|---|
| `FormedibleParser` | `main:packages/formedible-parser/src/index.ts` | `packages/formedible-parser/src/index.ts` | OK |
| parser types (ParsedFormConfig, ParsedFieldConfig, ParserOptions, ParserError, FieldOption(s), ObjectConfig, PageConfig, ProgressConfig, EnhancedParser*, SchemaInference*, ValidationWithSuggestionsResult, ParserConfig) | yes | yes (+ FieldConfig, FormedibleExtractionResult, FormedibleParseResult, FormedibleStructuredOutput, UseFormedibleOptions) | OK (superset) |
| `supportedFieldTypes` (24 entries) + `SupportedFieldType` | yes | yes, identical list (`formedible-parser.ts:24-49`) | OK |
| `defaultParserConfig`, `parserConfigFields`, `parserConfigFormDefinition`, `parserConfigSchemaDefinition`, `validateParserConfig`, `mergeParserConfig`, `generateSystemPrompt` | yes | yes | OK |
| `version` const | `"0.1.0"` | absent | DEGRADED-minor (D13) |
| `extractFormedibleCode`, `supportedFieldTypeInfo` | — | added | OK |
| Builder: FormBuilder, FieldConfigurator, FormPreview, builderTab/previewTab/codeTab/defaultTabs | yes | yes | OK |
| Builder: FieldStore, globalFieldStore, CodeGenerator, createTabs*, generateCodeFromParsedConfig, generateFormCode, builderFieldTypes, defaultFormMetadata | — | added | OK |
| Builder: `cn` | exported (`main:packages/builder/src/index.ts`) | not exported | DEGRADED-minor (D13) |
| AI: AIBuilder, AiFormRenderer, parseAiToFormedible, ProviderSelection | yes | yes (+ AgentSettings, ChatInterface, ConversationHistory, ParserSettings, Sidebar*, storage/catalog helpers) | OK |
| AI: FormBuilder/FieldConfigurator/FormPreview/defaultTabs re-exports | yes (`main:packages/ai-builder/src/index.ts`) | **removed** | DEGRADED (D14) |
| AI types: AIBuilderProps, AiFormRendererProps, ProviderSelectionProps, ProviderConfig, AIProvider | exported | exist in source but not index-exported (AIProvider lives in ai-types, not re-exported) | DEGRADED (D14) |
| AI type: BackendConfig | exported on main | gone entirely | DEGRADED (D14) |

---

## 7. The 14 docs examples

All 14 present in `apps/web/src/components/docs/examples/` and wired into `apps/web/src/components/docs/examples/index.tsx`. Diff review (main `apps/web/src/app/docs/examples/*.tsx` vs rewrite):

| example | verdict | notes |
|---|---|---|
| contact-form | OK | only import path + alert→state changes; combobox/multicombobox configs intact |
| registration-form | OK | pages/progress/dynamic description preserved |
| checkout-form | OK | conditional fields preserved |
| job-application-form | OK | multiSelect searchable/creatable/maxSelections preserved |
| survey-form | OK | dynamic options fn preserved |
| conditional-pages-form | OK | page conditionals preserved; no direct currentPage use, so index→number semantics change has no example impact |
| persistence-form | OK | key/storage/exclude/restoreOnMount identical |
| tabbed-form | OK | tabs config identical |
| array-fields-form | OK | arrayConfig object arrays + email arrays intact; alert→state |
| conditional-in-obj | OK* | nested conditional uses item-local values (`localValues: objectValue(item)`, `array-field.tsx:147-152`) — mandated behavior preserved; zod field validation converted to inline fn (both valid) |
| flow-form | OK | |
| rental-car-flow-form | OK* | dynamic `{{token}}` labels preserved; `help.tooltip` with `{{destination}}` now renders literally (D5); `disablePastDates` ignored (was also ignored on main) |
| analytics-tracking-form | OK | uses exactly the 6 callbacks the rewrite fires (onFieldBlur/onFieldFocus actually fire now — they were dead on main) |
| advanced-field-types-form | **BREAKING internally (F2)** | still declares `schema` with `birthDate: z.date()` + `defaultValues.birthDate = new Date()` (rewrite lines 68/200/596) while the date field now submits strings → schema validation fails once the user edits the date |

`pnpm check-types`: 4 of 5 packages pass (formedible, parser, builder, ai-builder, web). `@formedible/ui` FAILS (missing `@tanstack/ai*` module declarations in synced `ai-adapters.ts`/`ai-generation.ts`/`ai-messages.ts` + implicit-any in `markdown-message.tsx:81-111`) — violates the rewrite's own acceptance gate 1, though it is a packaging issue, not a schema-compat issue.

---

## 8. Persistence / storage

| aspect | main | rewrite | verdict |
|---|---|---|---|
| key | `persistence.key` verbatim | same | OK |
| storage default when omitted | sessionStorage (`main:use-formedible.tsx:1012-1015`) | sessionStorage (`use-form-persistence.ts:23-29`) | OK |
| payload | `{values, timestamp, currentPage}` (`main:use-formedible.tsx:1025-1032`) | `{values, timestamp, currentPage?}` (`use-form-persistence.ts:37-52`) | OK |
| old-draft restore | `parsePersistedFormPayload` accepts main's exact shape | OK — old drafts load |
| exclude list | yes | yes | OK |
| save debounce default | 1000ms | 500ms | minor note |
| restore page | index-based currentPage from main drafts reinterpreted as page number; if that page is hidden, rewrite falls back to first visible page (`use-multi-page.ts:71-75`) | minor edge-case note |
| clear on submit | yes | yes (`use-formedible.tsx:95`) | OK |

---

## 9. Compat fixtures faithfulness (`tests/compatibility-examples/`)

- `use-formedible-return-contract.ts`: faithful — 14 keep + 4 remove matches both main's actual return and FROM-SCRATCH-2 exactly.
- Manifest/descriptor fixtures (core/behavior/nested/advanced): faithful to the 14 examples' field/type/page/tab/persistence/analytics usage; `nested-examples.ts` correctly encodes item-local conditionals; `advanced-field-examples.ts` still lists `gradientColors` as "configuration evidence" although the rewrite dropped it (fixture documents main, implementation silently ignores — inconsistency worth flagging).
- Coverage gaps (options exercised on main but covered by NO fixture): `layout`, `conditionalSections`, `group`, grid span props, `help` (tooltip/position/link/dynamic), `section.collapsible`, `objectConfig.collapsible/showCard`, `submitButton`, `fieldClassName`/`labelClassName`/`buttonClassName`/`submitButtonClassName`, `autoScroll`, `resetOnSubmitSuccess`, `title`/`description`, `progress.component`/`page.component`, `formOptions.onSubmitInvalid`/`asyncDebounceMs`/`canSubmitWhenInvalid`, analytics callbacks beyond the 6 (notably onTabChange/onTabFirstVisit/onSubmissionPerformance, which main fired), `emailConfig`, `validationConfig`, field-level `defaultValue`, `dependencies`, `component`/`wrapper`/`defaultComponents` prop shapes. The fixtures therefore silently weaken the contract exactly where the rewrite diverges — they assert the rewrite's shape, not main's.

---

## BREAKING findings (detail)

**F1 — Custom component/wrapper/defaultComponents prop contract replaced.** Severity: HIGH (compile + runtime for anyone using custom fields).
Evidence: main built flat props `{fieldApi, label, placeholder, description, wrapperClassName, labelClassName, min, max, step, accept, multiple, disabled, crossFieldError, asyncValidationState, options, ...configs}` and spread them into the component (`main:packages/formedible/src/hooks/use-formedible.tsx:1699-1849`); wrapper received `{children, field: FieldConfig}` (`main:.../lib/formedible/types.ts:1327-1330`). Rewrite passes `{fieldConfig, field, renderField, defaultComponent, globalWrapper}` (`packages/formedible/src/components/formedible/field-renderer.tsx:8`, `types.ts:511-517,216-222`) and restricts `defaultComponents` keys to known field types (`types.ts:465`).
Impact: every existing custom field component and wrapper breaks; custom registry entries under user-defined type strings no longer typecheck or resolve.

**F2 — `date` field submits `string` instead of `Date`.** Severity: HIGH.
Evidence: main `fieldApi.handleChange(date)` with a `Date` (`main:packages/formedible/src/components/formedible/fields/date-field.tsx:75-79`); rewrite `field.onChange(nextValue)` where `nextValue = event.target.value` ('YYYY-MM-DD') (`packages/formedible/src/components/formedible/fields/date-field.tsx:30-44`).
Impact: existing zod schemas (`z.date()`) and onSubmit handlers expecting Date now receive strings and fail. The rewrite's own `advanced-field-types-form.tsx` (lines 68/200/596) still uses `z.date()` + `new Date()` defaults, so that example is now internally inconsistent.

**F3 — Validation strictness: top-level `schema` and `required` are now enforced (both were runtime no-ops on main).** Severity: MEDIUM-HIGH (behavioral, may be considered a bug fix, but changes which forms submit).
Evidence: `schema` never destructured/wired on main (`main:packages/formedible/src/hooks/use-formedible.tsx:392-434,668-736`); `required` never read by hook or FieldWrapper (verified in `main:.../use-formedible.tsx:1601-1637` and `main:.../fields/base-field-wrapper.tsx`). Rewrite enforces both (`packages/formedible/src/lib/formedible/validation.ts:167-209,314-416`).
Impact: forms that submitted invalid data on main now block with errors. Combined with F2, date schemas enforce-fail.

**F4 — `formOptions.onSubmitInvalid` typed `never`.** Severity: MEDIUM (compile error).
Evidence: main spread `formOptions` into TanStack `useForm` so it worked (`main:.../use-formedible.tsx:668-669`); rewrite `onSubmitInvalid?: never` (`packages/formedible/src/lib/formedible/types.ts:369`).

**F5 — Analytics callbacks that main fired are now compile errors.** Severity: MEDIUM.
Evidence: main fired `onTabChange`/`onTabFirstVisit` (`main:.../use-formedible.tsx:834,888`), `onSubmissionPerformance` (`main:.../use-formedible.tsx:712`); rewrite types them `never` (`types.ts:429-449`). (The other `never`-typed callbacks were never fired on main — those are OK.) FROM-SCRATCH-2 §Input Compatibility item 15 requires `analytics` preserved; the option exists but its formerly-working surface shrank.

**F6 — `emailConfig` rejected (`emailConfig?: never`).** Severity: LOW-MEDIUM (compile error; config was forwarded on main but unimplemented).
Evidence: `main:.../use-formedible.tsx:1844-1845` forwarded it; rewrite `types.ts:258,320`.

**F7 — `section` object now requires `title`.** Severity: LOW-MEDIUM (compile error for title-less sections, e.g. `section: {description}` or `{collapsible: true}`-only groupings that main allowed — `main:.../types.ts:1012-1017` had all keys optional).

**F8 — `fields` and `formOptions` (with `defaultValues`) now required.** Severity: LOW (all 14 canonical examples comply; only hypothetical minimal callers `useFormedible({ fields, schema })` break).

---

## DEGRADED findings (summary)

- D2 — `objectConfig.collapsible/defaultExpanded/showCard` ignored (implemented on main); `layout: 'vertical'|'horizontal'` narrowed to `stack|grid`. `main:.../fields/object-field.tsx:16-17,104,153` vs rewrite `object-field.tsx` (no collapsible code). Also `section.collapsible/defaultExpanded` dropped (code-documented as intentional, but not in FROM-SCRATCH-2).
- D3 — `sliderConfig.gradientColors` dropped though implemented on main and still advertised by fixture `advanced-field-examples.ts`.
- D4 — `collapseLabel`/`expandLabel` accepted but unused.
- D5 — `help` reduced to static text: tooltip UI, `position`, `link` gone; dynamic `{{token}}` in help not interpolated (`{{destination}}` renders literally in rental-car example).
- D6 — Location map rendering removed (mapProvider/openStreetMap/bing/maps/mapRenderCallback/showMap/ui); search + value shape preserved.
- D7 — `progress.component` and `page.component` custom components dropped; `submitButton` custom component dropped.
- D8 — Top-level `layout` (documented on main API page, implemented grid/flex), `conditionalSections`, `group`, grid span props, and styling options (`fieldClassName`, `labelClassName`, `buttonClassName`, `submitButtonClassName`) dropped.
- D9 — Top-level `accept`/`multiple` file props dropped (use `fileConfig`).
- D10 — `formOptions.asyncDebounceMs`/`canSubmitWhenInvalid` no longer forwarded to TanStack.
- D11 — `currentPage` semantics: visible-index (main) → actual page number (rewrite); differs with non-contiguous visible pages.
- D12 — `goToNextPage`/`setCurrentPage` no longer gate on page validation (replaced by submit-time validation summary + autoNavigate).
- D13 — Parser `version` const and builder/ai-builder `cn` exports removed.
- D14 — ai-builder index no longer re-exports FormBuilder/FieldConfigurator/FormPreview/defaultTabs and drops `BackendConfig`; `AIBuilderProps`/`AiFormRendererProps`/`ProviderSelectionProps`/`ProviderConfig`/`AIProvider` no longer index-exported.
- D15 — Form no longer resets after successful submit (main always reset); submit button no longer disabled via `canSubmit`; `<Form>` no longer supports `children` override.

---

## Verified-OK items

1. All 30 accepted field-type strings incl. every alias (rewrite is a superset; several aliases were broken fallbacks on main).
2. Submitted value shapes for all field types except `date` (strings, numbers, booleans, string[], location/duration objects, File).
3. `useFormedible` return: exactly the documented 14 keeps; exactly the 4 documented removals; no undocumented drops.
4. All 14 docs examples exist, remain structurally faithful (diffs limited to import paths, alert/console removal, Badge variant), and typecheck.
5. Persistence: identical storage key, default storage, payload shape; old drafts parse and restore.
6. Parser: `FormedibleParser`, all main type exports, identical 24-entry `supportedFieldTypes`, all parser-config exports (superset).
7. Builder: all main exports present (superset).
8. AI builder: `AIBuilder`, `AiFormRenderer`, `parseAiToFormedible`, `ProviderSelection` + provider settings helpers present (superset minus the D14 re-exports).
9. Zod 4 field-level `validation` still accepted (Standard Schema); dynamic text interpolation for label/description/placeholder/section/page titles preserved.
10. Conditional fields (function + new string form), conditional pages, conditional tabs, nested item-local conditionals in object arrays (conditional-in-obj behavior).
11. Analytics example's 6 callbacks all fire (2 of them fire for the first time).
12. Cross-field / async / inline validation remapped to TanStack validators per the documented plan; errors render in field error UI.

---

## Verdict counts

- BREAKING: 8 (F1–F8; F3 is a strictness change, F5/F6/F7/F8 are compile-level)
- INTENTIONAL-REMOVAL (documented in FROM-SCRATCH-2): 4 return keys + crossField/async/inline validation state remap (+ section collapsible, documented only in code)
- DEGRADED: 15 (D2–D15)
- OK: field types (all), value shapes (all but date), return contract, persistence format, parser/builder exports, all 14 examples structurally, zod validation acceptance

## Recommended fixes (priority order)

1. F2: make `date` submit `Date` again (or coerce in schema mapping) — and fix the advanced example's `z.date()`.
2. F1: provide a legacy prop adapter (or accept `fieldApi`-style props) for `component`/`wrapper`/`defaultComponents`.
3. F5: restore `onTabChange`/`onTabFirstVisit`/`onSubmissionPerformance` (or widen from `never` to optional-and-ignored with a documented note).
4. F4/F6/F7/F8: widen the `never`/required types to keep old configs compiling.
5. D2/D5: restore object/section collapsibility and help tooltip/link + dynamic help interpolation, or document the removal in FROM-SCRATCH-2.
6. Extend compat fixtures to cover the gap list in §9 so the contract can't silently shrink again.
7. Fix `@formedible/ui` check-types failures (missing `@tanstack/ai*` deps, implicit-any) to satisfy acceptance gate 1.
