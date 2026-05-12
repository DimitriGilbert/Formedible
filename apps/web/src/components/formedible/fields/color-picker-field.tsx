import { Check, Palette } from 'lucide-react';

import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';
import { cn } from '@/lib/utils';

const defaultPresets = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8000ff', '#ff00ff', '#000000', '#808080', '#ffffff'] as const;

export function ColorPickerField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.colorConfig;
  const value = typeof field.value === 'string' && field.value !== '' ? field.value : '#000000';
  const hexValue = normalizeHex(value);
  const displayValue = formatColor(hexValue, config?.format ?? 'hex');
  const presets = config?.presetColors ?? defaultPresets;

  function updateColor(color: string) {
    field.onChange(formatColor(normalizeHex(color), config?.format ?? 'hex'));
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="outline" className="size-9 p-0" disabled={fieldConfig.disabled} style={{ backgroundColor: hexValue }}>
              {config?.showPreview === false && <Palette className="size-4" />}
            </Button>
            <Input
              data-slot="color-input"
              type="color"
              value={hexValue}
              disabled={fieldConfig.disabled}
              className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              onBlur={field.onBlur}
              onChange={(event) => updateColor(event.target.value)}
            />
          </div>
          <Input
            value={displayValue}
            placeholder="#000000"
            disabled={fieldConfig.disabled}
            aria-invalid={field.error ? true : undefined}
            className={fieldConfig.inputClassName}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-8 gap-2">
          {presets.map((color) => {
            const normalizedPreset = normalizeHex(color);
            return (
              <Button
                key={color}
                type="button"
                variant="ghost"
                size="icon"
                disabled={fieldConfig.disabled}
                className={cn('size-7 rounded border transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50', hexValue.toLowerCase() === normalizedPreset.toLowerCase() ? 'ring-2 ring-ring ring-offset-2' : '')}
                style={{ backgroundColor: normalizedPreset }}
                onClick={() => updateColor(normalizedPreset)}
              >
                {hexValue.toLowerCase() === normalizedPreset.toLowerCase() && <Check className="mx-auto size-4 text-white drop-shadow" />}
              </Button>
            );
          })}
        </div>
      </div>
    </FieldWrapper>
  );
}

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed}`;
  }

  return '#000000';
}

function formatColor(hex: string, format: 'hex' | 'rgb' | 'hsl'): string {
  const rgb = hexToRgb(hex);
  if (format === 'rgb') {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  if (format === 'hsl') {
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  return hex;
}

function hexToRgb(hex: string): { readonly r: number; readonly g: number; readonly b: number } {
  return { r: Number.parseInt(hex.slice(1, 3), 16), g: Number.parseInt(hex.slice(3, 5), 16), b: Number.parseInt(hex.slice(5, 7), 16) };
}

function rgbToHsl(r: number, g: number, b: number): { readonly h: number; readonly s: number; readonly l: number } {
  const rRatio = r / 255;
  const gRatio = g / 255;
  const bRatio = b / 255;
  const max = Math.max(rRatio, gRatio, bRatio);
  const min = Math.min(rRatio, gRatio, bRatio);
  const diff = max - min;
  const lightness = (max + min) / 2;
  const saturation = diff === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (diff !== 0 && max === rRatio) {
    hue = 60 * (((gRatio - bRatio) / diff) % 6);
  } else if (diff !== 0 && max === gRatio) {
    hue = 60 * ((bRatio - rRatio) / diff + 2);
  } else if (diff !== 0) {
    hue = 60 * ((rRatio - gRatio) / diff + 4);
  }

  return { h: Math.round(hue < 0 ? hue + 360 : hue), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
}
