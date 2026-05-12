import assert from 'node:assert/strict';
import test from 'node:test';

test('advanced field modules import in SSR without browser globals', async () => {
  await Promise.all([
    import('../../packages/formedible/src/components/formedible/fields/date-field'),
    import('../../packages/formedible/src/components/formedible/fields/slider-field'),
    import('../../packages/formedible/src/components/formedible/fields/rating-field'),
    import('../../packages/formedible/src/components/formedible/fields/multi-select-field'),
    import('../../packages/formedible/src/components/formedible/fields/combobox-field'),
    import('../../packages/formedible/src/components/formedible/fields/multi-combobox-field'),
    import('../../packages/formedible/src/components/formedible/fields/color-picker-field'),
    import('../../packages/formedible/src/components/formedible/fields/phone-field'),
    import('../../packages/formedible/src/components/formedible/fields/duration-picker-field'),
    import('../../packages/formedible/src/components/formedible/fields/location-picker-field'),
    import('../../packages/formedible/src/components/formedible/fields/file-upload-field'),
  ]);

  assert.ok(true);
});
