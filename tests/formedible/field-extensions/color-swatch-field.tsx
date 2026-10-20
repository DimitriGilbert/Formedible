import { FieldWrapper } from '../../../packages/formedible/src/components/formedible/fields/field-wrapper';
import type { FieldExtension, FieldExtensionComponent } from '../../../packages/formedible/src/lib/formedible/field-extensions';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '../../../packages/formedible/src/lib/formedible/types';

/**
 * A sample THIRD-PARTY field proving the field-extension contract end to end:
 * a color-swatch picker registered under the custom type `colorSwatch`.
 *
 * Everything a third-party author needs lives in this one file — the component
 * (rendered through the engine's existing resolution path), the contract
 * object (serialization, zod validation, builder metadata, accessibility
 * obligations, AI-safety rules, semver), and the registration call. It is
 * written against the engine exactly as an external package would be: no
 * engine internals beyond the published contract types and `FieldWrapper`.
 */

const swatchColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'] as const;

function isSwatchColor(value: unknown): value is (typeof swatchColors)[number] {
  return typeof value === 'string' && (swatchColors as readonly string[]).includes(value);
}

function SwatchLabel({ color }: { readonly color: string }) {
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span
        aria-hidden="true"
        className="size-6 rounded-full border border-input shadow-xs"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{color}</span>
    </span>
  );
}

/** The renderer: a radiogroup of swatch buttons with roving tabindex. */
export const ColorSwatchField: FieldExtensionComponent = <TFormValues extends FormedibleFormValues>({
  fieldConfig,
  field,
}: FormedibleFieldRenderProps<TFormValues>) => {
  const value = isSwatchColor(field.value) ? field.value : undefined;

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div
        role="radiogroup"
        aria-label={typeof fieldConfig.label === 'string' ? fieldConfig.label : 'Color'}
        aria-invalid={field.error ? true : undefined}
        className="flex flex-wrap gap-2"
      >
        {swatchColors.map((color, index) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={value === color}
            aria-label={color}
            tabIndex={value === color || (value === undefined && index === 0) ? 0 : -1}
            disabled={fieldConfig.disabled}
            className="rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected=true]:ring-2 data-[selected=true]:ring-primary"
            data-selected={value === color ? 'true' : undefined}
            data-testid={`color-swatch-${color.slice(1)}`}
            onBlur={field.onBlur}
            onClick={() => field.onChange(color)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
                return;
              }

              event.preventDefault();
              const offset = event.key === 'ArrowRight' ? 1 : -1;
              const nextIndex = (swatchColors.indexOf(value ?? swatchColors[0]) + offset + swatchColors.length) % swatchColors.length;
              const nextColor = swatchColors[nextIndex];

              if (nextColor !== undefined) {
                field.onChange(nextColor);
                const group = event.currentTarget.closest('[role="radiogroup"]');
                const nextButton = group?.querySelector(`[data-testid="color-swatch-${nextColor.slice(1)}"]`);

                if (nextButton instanceof HTMLElement) {
                  nextButton.focus();
                }
              }
            }}
          >
            <SwatchLabel color={color} />
          </button>
        ))}
      </div>
    </FieldWrapper>
  );
};

/**
 * The published contract object. The zod validation is expressed as a
 * Standard Schema factory (zod v4 schemas satisfy it natively); this sample
 * hand-rolls the `~standard` view so the fixture stays dependency-free.
 */
export const colorSwatchExtension: FieldExtension = {
  type: 'colorSwatch',
  component: ColorSwatchField,
  valueSerialization: {
    version: 1,
    toWire: (value) => ({ hex: isSwatchColor(value) ? value : null }),
    fromWire: (wire) => {
      if (typeof wire !== 'object' || wire === null || !('hex' in wire)) {
        throw new Error('expected a wire object with a `hex` key');
      }

      const hex = (wire as { readonly hex: unknown }).hex;

      if (hex === null) {
        return undefined;
      }

      if (!isSwatchColor(hex)) {
        throw new Error(`unknown swatch color: ${String(hex)}`);
      }

      return hex;
    },
  },
  zodValidation: {
    schemaFactory: () => ({
      '~standard': {
        version: 1,
        validate: (value: unknown) => {
          if (value === undefined || value === null || value === '') {
            return { value };
          }

          return isSwatchColor(value)
            ? { value }
            : { issues: [{ message: 'Pick one of the offered swatches', path: [] }] };
        },
      },
    }),
  },
  builderMetadata: {
    label: 'Color swatch',
    iconKey: 'palette',
    description: 'Pick one color from a fixed swatch palette.',
    configurable: [
      { prop: 'label', label: 'Field label', kind: 'string', required: true, defaultValue: 'Pick a color' },
      { prop: 'required', label: 'Required', kind: 'boolean', defaultValue: false },
      { prop: 'description', label: 'Description', kind: 'string' },
      { prop: 'className', label: 'Field class', kind: 'string' },
    ],
  },
  accessibilityObligations: {
    labelAssociation: 'aria-label',
    focusTarget: 'roving-tabindex',
    keyboardBehavior: [
      'Tab moves focus into the swatch group onto the selected swatch (or the first swatch when nothing is selected)',
      'ArrowRight selects and focuses the next swatch, wrapping at the end',
      'ArrowLeft selects and focuses the previous swatch, wrapping at the start',
      'Space or Enter activates the focused swatch',
    ],
    ariaPatterns: [
      { role: 'radiogroup', attributes: ['aria-label'] },
      { role: 'radio', attributes: ['aria-checked'] },
    ],
    machineChecks: [{ kind: 'role', role: 'radiogroup' }],
  },
  aiSafeRedactionRules: {
    treatment: 'include',
    reason: 'A picked palette color is not personal data; classification features may read it.',
  },
  semver: {
    version: '1.0.0',
    contractCompatRange: '^1.0.0',
  },
};
