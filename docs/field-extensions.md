# Field extensions

Formedible renders custom field types through the existing component
resolution path: `field.component` > hook `defaultComponents` > the built-in
registry > the text fallback. The **field-extension contract** adds the
published contract OBJECT a third-party field needs beyond rendering,
assembled as one surface: value serialization, zod validation, builder
metadata, accessibility obligations, AI-safe redaction rules, and semver.

The engine's contract version is `FIELD_EXTENSION_CONTRACT_VERSION`
(currently `1.0.0`). An extension declares the contract range it is
compatible with and is refused at registration when the engine cannot
satisfy it.

## The contract object

```ts
import type { FieldExtension } from '@/components/ui/formedible/lib/field-extensions';

export const myFieldExtension: FieldExtension = {
  // The custom type string fields declare in `type`.
  // Must not collide with a built-in type (or a legacy alias of one).
  type: 'myField',

  // The renderer. Receives the standard field render props (`field`,
  // `fieldConfig`, `renderField`, ...); the legacy flat props (`fieldApi`,
  // `label`, `options`, resolved config objects) are delivered alongside.
  // Rendering resolves through the existing path — the contract adds no
  // new rendering mechanism.
  component: MyFieldComponent,

  // Value serialization: to/from wire JSON with a versioned shape.
  valueSerialization: {
    version: 1,
    toWire: (value) => ({ /* JSON-safe structure */ }),
    fromWire: (wire) => /* restore the live value */,
  },

  // Zod validation: a schema factory returning any Standard Schema v1
  // validator. Zod v4 schemas satisfy this natively (the engine validates
  // through `~standard`, so zod stays a consumer-side dependency).
  // The schema is installed as the field's validation whenever a field of
  // this type declares no `validation` of its own; field-level
  // configuration always wins. Author schemas tolerant of empty values
  // (`.optional()`, `.nullable()`) unless the field is required — the
  // schema runs on the empty value of optional fields.
  zodValidation: { schemaFactory: () => myValueSchema },

  // Builder metadata: how form builders offer and configure the field.
  builderMetadata: {
    label: 'My field',
    iconKey: 'my-icon',
    description: 'What the field captures.',
    configurable: [
      { prop: 'label', label: 'Field label', kind: 'string', required: true },
      { prop: 'max', label: 'Maximum', kind: 'number', defaultValue: 10 },
      { prop: 'variant', label: 'Variant', kind: 'options', options: [{ value: 'a', label: 'A' }] },
    ],
  },

  // The accessibility contract the rendered control MUST satisfy.
  accessibilityObligations: {
    labelAssociation: 'aria-label',        // htmlFor | aria-labelledby | aria-label | wrapping-label
    focusTarget: 'roving-tabindex',        // native-control | tabindex-0 | roving-tabindex
    keyboardBehavior: [                    // documented interactions (auditors script these)
      'Tab moves focus into the control',
      'ArrowRight selects the next option',
    ],
    ariaPatterns: [
      { role: 'radiogroup', attributes: ['aria-label'] },
    ],
    machineChecks: [{ kind: 'role', role: 'radiogroup' }], // engine-assertable extras
  },

  // How AI features must treat the field's value.
  aiSafeRedactionRules: {
    treatment: 'redact',                   // include | exclude | redact
    reason: 'Free-text notes may hold personal data.',
    redactWith: '████',                    // placeholder for `redact`; default '[redacted]'
  },

  // The extension's own version and the contract compatibility range.
  semver: {
    version: '1.0.0',                      // strict major.minor.patch
    contractCompatRange: '^1.0.0',
  },
};
```

## Registration

```ts
import { registerFieldExtension } from '@/components/ui/formedible/lib/field-extensions';

registerFieldExtension(myFieldExtension);
```

Registration is module-level and engine-wide:

- fields declaring `type: 'myField'` render `MyFieldComponent` through the
  normal resolution order (a hook-level `defaultComponents` entry for the
  same type still wins, as does a per-field `component`);
- fields of the type without their own `validation` validate against the
  extension's schema;
- `serializeFieldExtensionValue` / `deserializeFieldExtensionValue` move
  values to and from the wire envelope;
- `treatFieldExtensionValueForAi` applies the AI-safety treatment;
- builders read `builderMetadata` and assert accessibility with
  `verifyFieldExtensionAccessibility`.

A malformed extension (bad shape, built-in type collision, non-Standard
Schema factory, unsatisfiable compat range, ...) is rejected with a
descriptive `Error` at registration time — never silently. Re-registering
the exact same extension object is a no-op (safe under hot reload);
registering a different extension under a taken type throws. Tests can
remove registrations with `unregisterFieldExtension(type)`.

## The wire envelope

`serializeFieldExtensionValue(type, value)` returns:

```json
{
  "$field": "formedible-field-extension",
  "extensionType": "myField",
  "contractVersion": "1.0.0",
  "serializationVersion": 1,
  "value": { }
}
```

The engine enforces that `toWire` output is JSON-safe (only null, booleans,
finite numbers, strings, arrays, and plain objects — functions, `undefined`,
symbols, `bigint`, and class instances are rejected loudly) because JSON
serialization would otherwise drop them silently. `deserializeFieldExtensionValue`
validates the envelope (marker, type, serialization version) before calling
`fromWire`, and wraps deserialization failures with the extension's type.

## Accessibility verification

`verifyFieldExtensionAccessibility(extension, rootElement)` machine-checks
the declared obligations against rendered markup:

- the declared `focusTarget` shape is reachable;
- the declared `labelAssociation` names a focusable control;
- every declared ARIA role/attribute is present;
- every declared extra machine check passes.

It returns `{ check, passed, message }` findings — nothing throws, so CI
suites can assert `findings.every((finding) => finding.passed)`. The
`keyboardBehavior` list is the documented portion of the contract: the
engine cannot script arbitrary interactions, so auditors cover it with
keyboard journeys against these declarations.

## Semver rules

`semver.version` is strict `major.minor.patch`. The compat range grammar is
a space-separated AND list of comparators: `*`, `1.0.0` (or `=1.0.0`),
`>`, `>=`, `<`, `<=`, `~1.0.0` (same minor), `^1.0.0` (same major).
Prerelease tags, `||`, and hyphen ranges are not part of the grammar. An
extension declaring a range the engine's `FIELD_EXTENSION_CONTRACT_VERSION`
does not satisfy is refused at registration — check compatibility directly
with `isFieldExtensionContractCompatible(range, version?)`.

## A complete sample

`tests/formedible/field-extensions/color-swatch-field.tsx` in this
repository is a complete third-party field — a color-swatch radiogroup —
registered through the contract, with its tests in
`tests/formedible/field-extensions/*.test.tsx`
(`pnpm run test:formedible:field-extensions`). It is written exactly as an
external package would be: the component, the contract object, and the
registration call, with no engine internals beyond the published types.
