import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FIELD_EXTENSION_CONTRACT_VERSION,
  deserializeFieldExtensionValue,
  getFieldExtension,
  isFieldExtensionContractCompatible,
  listFieldExtensions,
  registerFieldExtension,
  serializeFieldExtensionValue,
  treatFieldExtensionValueForAi,
  unregisterFieldExtension,
} from '../../../packages/formedible/src/lib/formedible/field-extensions';
import type { FieldExtension, FieldExtensionAccessibilityMachineCheck } from '../../../packages/formedible/src/lib/formedible/field-extensions';
import type { FormedibleStandardFieldSchema } from '../../../packages/formedible/src/lib/formedible/types';
import { colorSwatchExtension } from './color-swatch-field';

/** A minimal well-formed extension the malformed-extension cases mutate. */
function minimalExtension(overrides: Partial<FieldExtension> = {}): FieldExtension {
  return {
    type: 'minimalSample',
    component: () => null,
    valueSerialization: {
      version: 1,
      toWire: (value) => value ?? null,
      fromWire: (wire) => wire ?? null,
    },
    zodValidation: {
      schemaFactory: () => ({
        '~standard': {
          version: 1,
          validate: (value: unknown) => ({ value }),
        },
      }),
    },
    builderMetadata: {
      label: 'Minimal sample',
      iconKey: 'sample',
      configurable: [],
    },
    accessibilityObligations: {
      labelAssociation: 'aria-label',
      focusTarget: 'native-control',
      keyboardBehavior: ['Tab moves focus into the control'],
      ariaPatterns: [{ attributes: ['aria-label'] }],
    },
    aiSafeRedactionRules: { treatment: 'include' },
    semver: { version: '1.0.0', contractCompatRange: '^1.0.0' },
    ...overrides,
  };
}

function withCleanRegistry(run: () => void): void {
  for (const extension of listFieldExtensions()) {
    unregisterFieldExtension(extension.type);
  }

  try {
    run();
  } finally {
    for (const extension of listFieldExtensions()) {
      unregisterFieldExtension(extension.type);
    }
  }
}

function assertRegistrationRejected(extension: FieldExtension, detail: RegExp): void {
  assert.throws(() => registerFieldExtension(extension), (error: unknown) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, detail);
    return true;
  });
}

test('the sample third-party field registers through the contract', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    assert.equal(getFieldExtension('colorSwatch'), colorSwatchExtension);
    assert.deepEqual(listFieldExtensions().map((extension) => extension.type), ['colorSwatch']);
  });
});

test('re-registering the same extension object is a no-op; a different extension under a taken type is refused', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);
    registerFieldExtension(colorSwatchExtension);

    assert.equal(listFieldExtensions().length, 1);
    assertRegistrationRejected({ ...colorSwatchExtension, semver: { ...colorSwatchExtension.semver, version: '1.1.0' } }, /already registered by a different extension/);
    assert.equal(unregisterFieldExtension('colorSwatch'), true);
    assert.equal(unregisterFieldExtension('colorSwatch'), false);
    assert.equal(listFieldExtensions().length, 0);
  });
});

test('malformed extensions are rejected loudly', () => {
  withCleanRegistry(() => {
    assertRegistrationRejected(minimalExtension({ type: '' }), /`type` must be a non-empty string/);
    assertRegistrationRejected(minimalExtension({ type: 'color' }), /collides with a built-in field type/);
    assertRegistrationRejected(minimalExtension({ type: 'colorPicker' }), /collides with a built-in field type/);
    assertRegistrationRejected(minimalExtension({ component: 'not-a-component' as unknown as FieldExtension['component'] }), /`component` must be a React component function/);
    assertRegistrationRejected(
      minimalExtension({ valueSerialization: { version: 0, toWire: (value) => value, fromWire: (wire) => wire } }),
      /`valueSerialization.version` must be a positive integer/,
    );
    assertRegistrationRejected(
      minimalExtension({ valueSerialization: { version: 1.5, toWire: (value) => value, fromWire: (wire) => wire } }),
      /`valueSerialization.version` must be a positive integer/,
    );
    assertRegistrationRejected(
      minimalExtension({ valueSerialization: { version: 1, toWire: 'nope' as unknown as FieldExtension['valueSerialization']['toWire'], fromWire: (wire) => wire } }),
      /toWire` and `valueSerialization.fromWire` must be functions/,
    );
    assertRegistrationRejected(minimalExtension({ zodValidation: { schemaFactory: 'nope' as unknown as FieldExtension['zodValidation']['schemaFactory'] } }), /`zodValidation.schemaFactory` must be a function/);
    assertRegistrationRejected(
      minimalExtension({
        zodValidation: {
          schemaFactory: () => ({ notStandard: true }) as unknown as FormedibleStandardFieldSchema,
        },
      }),
      /must return a Standard Schema v1 validator/,
    );
    assertRegistrationRejected(
      minimalExtension({
        zodValidation: {
          schemaFactory: () => {
            throw new Error('factory exploded');
          },
        },
      }),
      /`zodValidation.schemaFactory\` threw: factory exploded/,
    );
    assertRegistrationRejected(
      minimalExtension({ builderMetadata: { label: '', iconKey: 'sample', configurable: [] } }),
      /`builderMetadata.label` must be a non-empty string/,
    );
    assertRegistrationRejected(
      minimalExtension({ builderMetadata: { label: 'Minimal sample', iconKey: '', configurable: [] } }),
      /`builderMetadata.iconKey` must be a non-empty string/,
    );
    assertRegistrationRejected(
      minimalExtension({ builderMetadata: { label: 'Minimal sample', iconKey: 'sample', configurable: 'nope' as unknown as FieldExtension['builderMetadata']['configurable'] } }),
      /`builderMetadata.configurable` must be an array/,
    );
    assertRegistrationRejected(
      minimalExtension({
        builderMetadata: {
          label: 'Minimal sample',
          iconKey: 'sample',
          configurable: [{ prop: 'palette', label: 'Palette', kind: 'options' }],
        },
      }),
      /declares kind `options` and must list at least one option/,
    );
    assertRegistrationRejected(
      minimalExtension({ accessibilityObligations: { labelAssociation: 'vibes', focusTarget: 'native-control', keyboardBehavior: ['Tab'], ariaPatterns: [{ attributes: ['aria-label'] }] } as unknown as FieldExtension['accessibilityObligations'] }),
      /labelAssociation` must be one of/,
    );
    assertRegistrationRejected(
      minimalExtension({ accessibilityObligations: { labelAssociation: 'aria-label', focusTarget: 'teleport', keyboardBehavior: ['Tab'], ariaPatterns: [{ attributes: ['aria-label'] }] } as unknown as FieldExtension['accessibilityObligations'] }),
      /focusTarget` must be one of/,
    );
    assertRegistrationRejected(
      minimalExtension({ accessibilityObligations: { labelAssociation: 'aria-label', focusTarget: 'native-control', keyboardBehavior: [], ariaPatterns: [{ attributes: ['aria-label'] }] } }),
      /keyboardBehavior` must list at least one documented keyboard interaction/,
    );
    assertRegistrationRejected(
      minimalExtension({ accessibilityObligations: { labelAssociation: 'aria-label', focusTarget: 'native-control', keyboardBehavior: ['Tab'], ariaPatterns: [{ attributes: ['data-vibes'] }] } }),
      /must list at least one `aria-` prefixed attribute/,
    );
    assertRegistrationRejected(
      minimalExtension({
        accessibilityObligations: {
          labelAssociation: 'aria-label',
          focusTarget: 'native-control',
          keyboardBehavior: ['Tab'],
          ariaPatterns: [{ attributes: ['aria-label'] }],
          machineChecks: [{ kind: 'aria-attribute' } as unknown as FieldExtensionAccessibilityMachineCheck],
        },
      }),
      /declares kind `aria-attribute` and must name the attribute/,
    );
    assertRegistrationRejected(minimalExtension({ aiSafeRedactionRules: { treatment: 'leak' as unknown as FieldExtension['aiSafeRedactionRules']['treatment'] } }), /treatment` must be one of include, exclude, redact/);
    assertRegistrationRejected(minimalExtension({ semver: { version: '1.0', contractCompatRange: '^1.0.0' } }), /strict major.minor.patch/);
    assertRegistrationRejected(minimalExtension({ semver: { version: '1.0.0', contractCompatRange: 'nonsense' } }), /not satisfied by the engine contract version/);
    assert.equal(listFieldExtensions().length, 0, 'no malformed extension may remain registered');
  });
});

test('semver compat checks: compatible ranges register, incompatible ranges are refused', () => {
  withCleanRegistry(() => {
    for (const [range, version, expected] of [
      ['^1.0.0', '1.0.0', true],
      ['^1.0.0', '1.9.9', true],
      ['^1.0.0', '2.0.0', false],
      ['~1.0.0', '1.0.5', true],
      ['~1.0.0', '1.1.0', false],
      ['>=1.0.0 <2.0.0', '1.5.0', true],
      ['>=1.0.0 <2.0.0', '2.0.0', false],
      ['=1.0.0', '1.0.0', true],
      ['=1.0.0', '1.0.1', false],
      ['1.0.0', '1.0.0', true],
      ['*', '0.0.1', true],
      ['>1.0.0', '1.0.0', false],
      ['>1.0.0', '1.0.1', true],
      ['<=1.0.0', '1.0.0', true],
      ['<1.0.0', '1.0.0', false],
      ['^1.0.0 || ^2.0.0', '1.0.0', false],
      ['', '1.0.0', false],
    ] as const) {
      assert.equal(isFieldExtensionContractCompatible(range, version), expected, `range ${range} vs ${version}`);
    }

    registerFieldExtension(minimalExtension({ type: 'wideFloor', semver: { version: '0.8.0', contractCompatRange: '>=0.9.0' } }));
    assert.ok(getFieldExtension('wideFloor') !== undefined);
    assertRegistrationRejected(minimalExtension({ type: 'nextContract', semver: { version: '1.0.0', contractCompatRange: '^2.0.0' } }), /not satisfied by the engine contract version/);
  });
});

test('serialization round-trips through a stable versioned wire envelope', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const wire = serializeFieldExtensionValue('colorSwatch', '#22c55e');

    assert.deepEqual(wire, {
      $field: 'formedible-field-extension',
      extensionType: 'colorSwatch',
      contractVersion: FIELD_EXTENSION_CONTRACT_VERSION,
      serializationVersion: 1,
      value: { hex: '#22c55e' },
    });

    const throughJson = JSON.parse(JSON.stringify(wire)) as typeof wire;
    assert.equal(deserializeFieldExtensionValue('colorSwatch', throughJson), '#22c55e');
    assert.equal(deserializeFieldExtensionValue('colorSwatch', serializeFieldExtensionValue('colorSwatch', undefined)), undefined);
  });
});

test('serialization failures are loud: unregistered types, foreign envelopes, version drift, non-JSON-safe wire values', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    assert.throws(() => serializeFieldExtensionValue('unknownType', 'x'), /no extension is registered for that type/);
    assert.throws(() => deserializeFieldExtensionValue('colorSwatch', { $field: 'something-else' }), /wire envelope belongs to a different field/);
    assert.throws(
      () => deserializeFieldExtensionValue('colorSwatch', { $field: 'formedible-field-extension', extensionType: 'colorSwatch', serializationVersion: 2, value: { hex: '#22c55e' } }),
      /serialization version 2 does not match the registered version 1/,
    );
    assert.throws(
      () =>
        deserializeFieldExtensionValue('colorSwatch', {
          $field: 'formedible-field-extension',
          extensionType: 'colorSwatch',
          contractVersion: FIELD_EXTENSION_CONTRACT_VERSION,
          serializationVersion: 1,
          value: { hex: '#deadbe' },
        }),
      /failed to deserialize.*unknown swatch color/,
    );

    registerFieldExtension(
      minimalExtension({
        type: 'unsafeWire',
        valueSerialization: { version: 1, toWire: () => ({ leak: () => 'closures are not JSON' }), fromWire: (wire) => wire },
      }),
    );
    assert.throws(() => serializeFieldExtensionValue('unsafeWire', 'anything'), /`leak` has type function, which JSON cannot carry/);
  });
});

test('redaction rules are enforced through the AI treatment surface', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);
    registerFieldExtension(minimalExtension({ type: 'secretSample', aiSafeRedactionRules: { treatment: 'exclude', reason: 'internal notes' } }));
    registerFieldExtension(minimalExtension({ type: 'maskedSample', aiSafeRedactionRules: { treatment: 'redact' } }));
    registerFieldExtension(minimalExtension({ type: 'customMaskSample', aiSafeRedactionRules: { treatment: 'redact', redactWith: '████' } }));

    assert.deepEqual(treatFieldExtensionValueForAi('colorSwatch', '#22c55e'), { treatment: 'include', value: '#22c55e' });
    assert.deepEqual(treatFieldExtensionValueForAi('secretSample', 'internal note text'), { treatment: 'exclude', value: undefined });
    assert.deepEqual(treatFieldExtensionValueForAi('maskedSample', 'internal note text'), { treatment: 'redact', value: '[redacted]' });
    assert.deepEqual(treatFieldExtensionValueForAi('customMaskSample', 'internal note text'), { treatment: 'redact', value: '████' });
    assert.throws(() => treatFieldExtensionValueForAi('unknownType', 'x'), /no extension is registered for that type/);
  });
});
