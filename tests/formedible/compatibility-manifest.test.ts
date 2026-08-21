import assert from 'node:assert/strict';
import test from 'node:test';

import {
  compatibilityExampleIds,
  compatibilityExamplesManifest,
  type CompatibilityExample,
  type CompatibilityExampleGroup,
} from '../compatibility-examples/example-manifest';
import {
  formOptionsAnalyticsContract,
  intentionallyRemovedFormOptionsAnalytics,
  restoredFormOptionsAnalytics,
} from '../compatibility-examples/form-options-analytics-contract';
import { removedUseFormedibleReturnFields } from '../compatibility-examples/use-formedible-return-contract';

const exampleGroups: readonly CompatibilityExampleGroup[] = ['core', 'behavior', 'advanced-field', 'nested'];

const manifestEntries: readonly (readonly [string, CompatibilityExample])[] = Object.entries(compatibilityExamplesManifest);

test('compatibility examples manifest wires all fourteen examples with unique ids and sources', () => {
  assert.equal(manifestEntries.length, 14, 'the manifest must keep every extracted compatibility example reachable');

  const ids = manifestEntries.map(([, example]) => example.id);
  assert.equal(new Set(ids).size, ids.length, 'example ids must be unique');

  const sourceFiles = manifestEntries.map(([, example]) => example.sourceFile);
  assert.equal(new Set(sourceFiles).size, sourceFiles.length, 'every example must trace to a distinct legacy source file');

  assert.deepEqual(compatibilityExampleIds, Object.keys(compatibilityExamplesManifest).sort());
});

test('every manifest entry carries complete, well-formed compatibility evidence', () => {
  for (const [key, example] of manifestEntries) {
    assert.ok(example.id.length > 0, `${key} must declare an id`);
    assert.ok(exampleGroups.includes(example.group), `${key} must declare a known group`);
    assert.ok(example.sourceFile.startsWith('old_version_for_knowledge_purpose/'), `${key} must point at the legacy source tree`);
    assert.ok(example.publicBehavior.length > 0, `${key} must record public behavior evidence`);
    assert.ok(Object.keys(example.schemaFields).length > 0, `${key} must record schema field evidence`);
    assert.ok(example.fields.length > 0, `${key} must record field evidence`);
    assert.ok(example.optionsUsed.length > 0, `${key} must record the options it exercises`);
    assert.ok(example.returnHelpersUsed.length > 0, `${key} must record the return helpers it exercises`);
    assert.ok(example.assertionsRequired.length > 0, `${key} must record the assertions it requires`);

    for (const field of example.fields) {
      assert.ok(field.name.length > 0, `${key} field descriptors must be named`);
      assert.ok(field.type.length > 0, `${key} field ${field.name} must declare a type`);
    }
  }
});

test('form options analytics contract classifies every option exactly once', () => {
  const options = formOptionsAnalyticsContract.map((row) => row.option);

  assert.equal(new Set(options).size, options.length, 'contract options must be unique');
  assert.equal(formOptionsAnalyticsContract.length, options.length);

  for (const row of formOptionsAnalyticsContract) {
    assert.ok(row.reason.length > 0, `${row.option} must explain its disposition`);
  }
});

test('contract removed rows mirror the return contract removed helpers', () => {
  assert.deepEqual(
    intentionallyRemovedFormOptionsAnalytics,
    removedUseFormedibleReturnFields.map((field) => `${field} return helper`),
  );
});

test('contract dispositions match current package reality after the compat restorations', () => {
  const dispositionByOption = new Map(formOptionsAnalyticsContract.map((row) => [row.option, row.disposition] as const));

  const restoredByPhase22 = [
    'resetOnSubmitSuccess',
    'fieldClassName',
    'labelClassName',
    'buttonClassName',
    'submitButtonClassName',
  ] as const;
  for (const option of restoredByPhase22) {
    assert.equal(dispositionByOption.get(option), 'restored', `${option} is restored in the package and must stay classified as restored`);
    assert.ok(restoredFormOptionsAnalytics.includes(option));
  }

  const supersededAnalytics = [
    'analytics.onPageComplete',
    'analytics.onPageAbandon',
    'analytics.onPageValidationError',
    'analytics.onTabComplete',
    'analytics.onTabAbandon',
    'analytics.onTabValidationError',
    'analytics.onRenderPerformance',
    'analytics.onValidationPerformance',
  ] as const;
  for (const option of supersededAnalytics) {
    assert.equal(dispositionByOption.get(option), 'superseded', `${option} is typed as a superseded never-callback and must stay classified as superseded`);
  }

  const autoScrollRow = formOptionsAnalyticsContract.find((row) => row.option === 'autoScroll');
  assert.equal(autoScrollRow?.disposition, 'superseded', 'autoScroll is a documented divergence and must not be claimed as restored');
  assert.match(autoScrollRow?.reason ?? '', /divergence/i, 'the autoScroll row must name the divergence explicitly');
});
