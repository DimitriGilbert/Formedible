import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderToStaticMarkup } from 'react-dom/server';
import { z } from 'zod';

import { useFormedible } from '../../../packages/formedible/src/hooks/use-formedible';
import {
  listFieldExtensions,
  registerFieldExtension,
  unregisterFieldExtension,
  verifyFieldExtensionAccessibility,
} from '../../../packages/formedible/src/lib/formedible/field-extensions';
import { buildFieldValidators } from '../../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleValidatorContext } from '../../../packages/formedible/src/lib/formedible/validation';
import type { FormedibleFieldConfig, FormedibleFieldValidation, FormedibleFormValues, NormalizedFieldConfig } from '../../../packages/formedible/src/lib/formedible/types';
import { colorSwatchExtension } from './color-swatch-field';

interface SwatchValues extends FormedibleFormValues {
  swatch: string | undefined;
}

type SyncRunner = (context: FormedibleValidatorContext<SwatchValues>) => string | undefined;

function fieldConfig(config: Partial<NormalizedFieldConfig<SwatchValues>> & Pick<NormalizedFieldConfig<SwatchValues>, 'name'>): NormalizedFieldConfig<SwatchValues> {
  return {
    type: 'colorSwatch',
    disabled: false,
    required: false,
    ...config,
  };
}

function validatorContext(value: unknown): FormedibleValidatorContext<SwatchValues> {
  return { value, fieldApi: { form: { state: { values: { swatch: undefined } }, parseValuesWithSchema: () => undefined, parseValuesWithSchemaAsync: async () => undefined } } };
}

function withCleanRegistry(run: () => void): void {
  for (const extension of listFieldExtensions()) {
    unregisterFieldExtension(extension.type);
  }

  try {
    run();
  } finally {
    unregisterFieldExtension('colorSwatch');
    unregisterFieldExtension('zodStars');
  }
}

function SwatchForm({ fieldOverrides }: { readonly fieldOverrides?: Partial<FormedibleFieldConfig<SwatchValues>> }) {
  const { Form } = useFormedible<SwatchValues>({
    fields: [{ name: 'swatch', type: 'colorSwatch', label: 'Pick a color', ...fieldOverrides }],
    formOptions: { defaultValues: { swatch: '#22c55e' }, onSubmit: () => undefined },
  });

  return <Form />;
}

function HookOverrideForm() {
  const { Form } = useFormedible<SwatchValues>({
    fields: [{ name: 'swatch', type: 'colorSwatch', label: 'Pick a color' }],
    formOptions: { defaultValues: { swatch: undefined }, onSubmit: () => undefined },
    defaultComponents: {
      colorSwatch: () => <div data-testid="hook-override">hook override wins</div>,
    },
  });

  return <Form />;
}

test('a registered extension renders through the existing component resolution path', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const markup = renderToStaticMarkup(<SwatchForm />);

    assert.match(markup, /role="radiogroup"/);
    assert.match(markup, /aria-label="Pick a color"/);
    assert.match(markup, /aria-checked="true"/);
    assert.match(markup, /data-testid="color-swatch-22c55e"/);
    assert.equal((markup.match(/role="radio"/g) ?? []).length, 6);
  });
});

test('an unregistered custom type still falls back to the text field', () => {
  withCleanRegistry(() => {
    const markup = renderToStaticMarkup(<SwatchForm />);

    assert.doesNotMatch(markup, /role="radiogroup"/);
    assert.match(markup, /<input /);
  });
});

test('hook-level defaultComponents take precedence over a registered extension', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const markup = renderToStaticMarkup(<HookOverrideForm />);

    assert.match(markup, /data-testid="hook-override"/);
    assert.doesNotMatch(markup, /role="radiogroup"/);
  });
});

test('the extension zod schema validates fields that declare no validation of their own', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const validators = buildFieldValidators<SwatchValues, string>(fieldConfig({ name: 'swatch' }), undefined, undefined, undefined);
    const onChange = validators.onChange as unknown as SyncRunner;

    assert.equal(onChange(validatorContext(undefined)), undefined);
    assert.equal(onChange(validatorContext('#22c55e')), undefined);
    assert.equal(onChange(validatorContext('#000000')), 'Pick one of the offered swatches');
  });
});

test('a real zod schema from a third-party factory drives validation through the same chain', () => {
  withCleanRegistry(() => {
    const swatchSchema = z.enum(['#ef4444', '#22c55e', '#3b82f6']).nullable().optional();

    registerFieldExtension({
      ...colorSwatchExtension,
      type: 'zodStars',
      zodValidation: { schemaFactory: () => swatchSchema },
    });

    const validators = buildFieldValidators<SwatchValues, string>(fieldConfig({ name: 'stars', type: 'zodStars' }), undefined, undefined, undefined);
    const onChange = validators.onChange as unknown as SyncRunner;

    assert.equal(onChange(validatorContext(undefined)), undefined);
    assert.equal(onChange(validatorContext('#ef4444')), undefined);
    const invalidMessage = onChange(validatorContext('chartreuse'));
    assert.match(invalidMessage ?? '', /Invalid option|invalid value|expected/i);
  });
});

test('field-level validation overrides the extension schema', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const fieldValidation: FormedibleFieldValidation<SwatchValues> = () => 'field validation wins';
    const validators = buildFieldValidators<SwatchValues, string>(fieldConfig({ name: 'swatch', validation: fieldValidation }), undefined, undefined, undefined);
    const onChange = validators.onChange as unknown as SyncRunner;

    assert.equal(onChange(validatorContext('#22c55e')), 'field validation wins');
  });
});

test('the machine-checkable accessibility obligations pass on the rendered sample field', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const dom = new JSDOM(renderToStaticMarkup(<SwatchForm />));
    const root = dom.window.document.body;
    const findings = verifyFieldExtensionAccessibility(colorSwatchExtension, root);
    const failed = findings.filter((finding) => !finding.passed);

    assert.deepEqual(failed.map((finding) => finding.check), []);
    assert.ok(findings.some((finding) => finding.check === 'focusable-control'));
    assert.ok(findings.some((finding) => finding.check === 'label-associated'));
    assert.ok(findings.some((finding) => finding.check === 'role:radiogroup'));
    assert.ok(findings.some((finding) => finding.check === 'aria-attribute:aria-checked'));
  });
});

test('machine checks fail loudly when the rendered markup violates the declared obligations', () => {
  withCleanRegistry(() => {
    registerFieldExtension(colorSwatchExtension);

    const dom = new JSDOM('<div><p>no controls here</p></div>');
    const findings = verifyFieldExtensionAccessibility(colorSwatchExtension, dom.window.document.body);
    const failedChecks = findings.filter((finding) => !finding.passed).map((finding) => finding.check);

    assert.ok(failedChecks.includes('focusable-control'));
    assert.ok(failedChecks.includes('label-associated'));
    assert.ok(failedChecks.includes('role:radiogroup'));
    assert.ok(failedChecks.includes('aria-attribute:aria-checked'));
    assert.ok(findings.every((finding) => finding.message.length > 0));
  });
});
