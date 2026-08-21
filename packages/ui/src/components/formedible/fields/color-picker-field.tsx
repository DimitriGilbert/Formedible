import { Check, Palette } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

const defaultPresets = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8000ff', '#ff00ff', '#000000', '#808080', '#ffffff'] as const;

export function ColorPickerField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.colorConfig;
  const format = config?.format ?? 'hex';
  const storedValue = typeof field.value === 'string' ? field.value : '';
  const hexValue = normalizeHex(storedValue);
  const presets = config?.presetColors ?? defaultPresets;
  const allowCustom = config?.allowCustom ?? true;
  const [draft, setDraft] = useState<string | null>(null);
  const committedValueRef = useRef<unknown>(field.value);
  const draftIsInvalid = draft !== null && draft.trim() !== '' && parseColorText(draft) === undefined;

  useEffect(() => {
    if (field.value !== committedValueRef.current) {
      committedValueRef.current = field.value;
      setDraft(null);
    }
  }, [field.value]);

  function commitHex(nextHex: string) {
    const nextValue = formatColor(nextHex, format);
    committedValueRef.current = nextValue;
    field.onChange(nextValue);
  }

  function commitColor(color: string) {
    setDraft(null);
    commitHex(normalizeHex(color));
  }

  function commitDraft() {
    if (draft === null) {
      return;
    }

    const draftHex = parseColorText(draft);
    setDraft(null);
    if (draftHex === undefined) {
      return;
    }

    const formatted = formatColor(draftHex, format);
    if (storedValue !== formatted) {
      committedValueRef.current = formatted;
      field.onChange(formatted);
    }
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
              onChange={(event) => commitColor(event.target.value)}
            />
          </div>
          {allowCustom && (
            <Input
              value={draft ?? formatColor(hexValue, format)}
              placeholder="#000000"
              disabled={fieldConfig.disabled}
              aria-invalid={field.error || draftIsInvalid ? true : undefined}
              className={fieldConfig.inputClassName}
              onBlur={() => {
                commitDraft();
                field.onBlur();
              }}
              onChange={(event) => {
                const nextDraft = event.target.value;
                setDraft(nextDraft);
                const nextHex = parseColorText(nextDraft);
                if (nextHex !== undefined && nextHex.toLowerCase() !== hexValue.toLowerCase()) {
                  commitHex(nextHex);
                }
              }}
            />
          )}
        </div>
        {allowCustom && draftIsInvalid && (
          <p data-slot="color-invalid-hint" className="text-sm text-destructive">
            Enter a valid color, e.g. #ff0000, rgb(255, 0, 0), or hsl(0, 100%, 50%).
          </p>
        )}
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
                onClick={() => commitColor(normalizedPreset)}
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

function parseColorText(value: string): string | undefined {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return `#${trimmed}`;
  }

  const rgb = parseRgbColor(trimmed);
  if (rgb) {
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  const hsl = parseHslColor(trimmed);
  if (hsl) {
    const hslRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(hslRgb.r, hslRgb.g, hslRgb.b);
  }

  return undefined;
}

function normalizeHex(value: string): string {
  return parseColorText(value) ?? '#000000';
}

function parseRgbColor(value: string): { readonly r: number; readonly g: number; readonly b: number } | undefined {
  const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(value);
  if (!match) {
    return undefined;
  }

  const [, rText, gText, bText] = match;
  if (rText === undefined || gText === undefined || bText === undefined) {
    return undefined;
  }

  const r = Number.parseInt(rText, 10);
  const g = Number.parseInt(gText, 10);
  const b = Number.parseInt(bText, 10);

  if (!isValidRgbChannel(r) || !isValidRgbChannel(g) || !isValidRgbChannel(b)) {
    return undefined;
  }

  return { r, g, b };
}

function parseHslColor(value: string): { readonly h: number; readonly s: number; readonly l: number } | undefined {
  const match = /^hsl\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)$/i.exec(value);
  if (!match) {
    return undefined;
  }

  const [, hText, sText, lText] = match;
  if (hText === undefined || sText === undefined || lText === undefined) {
    return undefined;
  }

  const h = Number.parseFloat(hText);
  const s = Number.parseFloat(sText);
  const l = Number.parseFloat(lText);

  if (!Number.isFinite(h) || !isValidPercentage(s) || !isValidPercentage(l)) {
    return undefined;
  }

  return { h, s, l };
}

function isValidRgbChannel(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

function isValidPercentage(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function toHexChannel(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0');
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

function hslToRgb(h: number, s: number, l: number): { readonly r: number; readonly g: number; readonly b: number } {
  const normalizedHue = (((h % 360) + 360) % 360) / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  if (saturation === 0) {
    const gray = lightness * 255;
    return { r: gray, g: gray, b: gray };
  }

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: hueToRgbChannel(p, q, normalizedHue + 1 / 3) * 255,
    g: hueToRgbChannel(p, q, normalizedHue) * 255,
    b: hueToRgbChannel(p, q, normalizedHue - 1 / 3) * 255,
  };
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let ratio = t;
  if (ratio < 0) {
    ratio += 1;
  }
  if (ratio > 1) {
    ratio -= 1;
  }
  if (ratio < 1 / 6) {
    return p + (q - p) * 6 * ratio;
  }
  if (ratio < 1 / 2) {
    return q;
  }
  if (ratio < 2 / 3) {
    return p + (q - p) * (2 / 3 - ratio) * 6;
  }

  return p;
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
