import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const matrixPath = 'docs/formedible-compatibility-matrix.md';
const matrix = readFileSync(matrixPath, 'utf8');

const requiredMatrixRows = [
  '| `section` | Restored |',
  '| `textareaConfig` | Restored |',
  '| `passwordConfig` | Restored |',
  '| Direct field validation schema | Restored |',
  '| `autocomplete` / `autocompleteConfig` | Restored |',
  '| `masked` / `maskedInput` | Restored |',
  '| Custom field `component` / `wrapper` | Restored |',
  '| Form-level `defaultComponents` / `globalWrapper` | Restored |',
  '| Form options | Supported / restored / removed |',
  '| Analytics | Supported / superseded |',
  '| Parser/storage preservation | Supported with serialization limits |',
] as const;

const requiredExplicitDecisions = [
  '`collapsible` and `defaultExpanded` are intentionally unsupported',
  '`emailConfig` is intentionally unsupported',
  '`onSubmitInvalid` is intentionally removed',
  'Function-backed configuration is not persisted',
] as const;

describe('Formedible compatibility matrix', () => {
  it('covers every Phase 8 compatibility surface with an explicit status', () => {
    for (const row of requiredMatrixRows) {
      assert.ok(matrix.includes(row), `${matrixPath} is missing matrix row: ${row}`);
    }
  });

  it('documents intentionally unsupported or non-serializable behavior explicitly', () => {
    for (const decision of requiredExplicitDecisions) {
      assert.ok(matrix.includes(decision), `${matrixPath} is missing explicit compatibility decision: ${decision}`);
    }
  });
});
