import { useEffect, useRef, useState } from 'react';

import { clamp } from '@/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormedibleDurationConfig, FormedibleDurationValue, FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

type DurationUnit = 'h' | 'm' | 's';
type DurationFormat = NonNullable<FormedibleDurationConfig['format']>;

interface DurationParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

const durationUnitsByFormat: Record<DurationFormat, ReadonlySet<DurationUnit>> = {
  hms: new Set<DurationUnit>(['h', 'm', 's']),
  hm: new Set<DurationUnit>(['h', 'm']),
  ms: new Set<DurationUnit>(['m', 's']),
  hours: new Set<DurationUnit>(['h']),
  minutes: new Set<DurationUnit>(['m']),
  seconds: new Set<DurationUnit>(['s']),
};

const zeroDuration: DurationParts = { hours: 0, minutes: 0, seconds: 0 };

export function DurationPickerField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.durationConfig;
  const format: DurationFormat = config?.format ?? 'hms';
  const units = durationUnitsByFormat[format];
  const maxHours = config?.maxHours ?? 23;
  const maxMinutes = config?.maxMinutes ?? 59;
  const maxSeconds = config?.maxSeconds ?? 59;
  const parts = parseDuration(field.value, format);
  const committedValueRef = useRef<unknown>(field.value);
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (field.value !== committedValueRef.current) {
      committedValueRef.current = field.value;
      setDraft(null);
    }
  }, [field.value]);

  function commit(nextParts: DurationParts) {
    const nextValue = formatDurationOutput(nextParts, format);
    committedValueRef.current = nextValue;
    field.onChange(nextValue);
  }

  function update(nextParts: DurationParts) {
    setDraft(null);
    commit(nextParts);
  }

  function updatePart(partName: keyof DurationParts, value: number) {
    update({ ...parts, [partName]: value });
  }

  function commitDraft() {
    if (draft === null) {
      return;
    }

    const parsed = parseDurationText(draft, format, maxHours, maxMinutes, maxSeconds);
    setDraft(null);
    if (parsed && !isSameDuration(parsed, parts)) {
      commit(parsed);
    }
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-3">
        <div className="flex gap-3">
          {units.has('h') && <DurationSelect unit="hours" label="Hours" value={parts.hours} max={maxHours} disabled={fieldConfig.disabled} onChange={(value) => updatePart('hours', value)} />}
          {units.has('m') && <DurationSelect unit="minutes" label="Minutes" value={parts.minutes} max={maxMinutes} disabled={fieldConfig.disabled} onChange={(value) => updatePart('minutes', value)} />}
          {units.has('s') && <DurationSelect unit="seconds" label="Seconds" value={parts.seconds} max={maxSeconds} disabled={fieldConfig.disabled} onChange={(value) => updatePart('seconds', value)} />}
        </div>
        <Input
          value={draft ?? formatDurationText(parts, units)}
          placeholder={fieldConfig.placeholder ?? 'Enter duration (e.g., 1h 30m 45s)'}
          disabled={fieldConfig.disabled}
          className={fieldConfig.inputClassName}
          onBlur={() => {
            commitDraft();
            field.onBlur();
          }}
          onChange={(event) => {
            const nextDraft = event.target.value;
            setDraft(nextDraft);
            const parsed = parseDurationText(nextDraft, format, maxHours, maxMinutes, maxSeconds);
            if (parsed && !isSameDuration(parsed, parts)) {
              commit(parsed);
            }
          }}
        />
        <div className="text-sm text-muted-foreground">Total: {parts.hours * 3600 + parts.minutes * 60 + parts.seconds} seconds</div>
      </div>
    </FieldWrapper>
  );
}

interface DurationSelectProps {
  readonly unit: 'hours' | 'minutes' | 'seconds';
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly disabled: boolean;
  readonly onChange: (value: number) => void;
}

function DurationSelect({ unit, label, value, max, disabled, onChange }: DurationSelectProps) {
  return (
    <div className="space-y-1" data-slot="duration-select" data-unit={unit}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <Select value={String(value)} disabled={disabled} onValueChange={(nextValue) => onChange(Number(nextValue ?? 0))}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: max + 1 }, (_, index) => (
            <SelectItem key={index} value={String(index)}>
              {String(index).padStart(2, '0')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function parseDuration(value: unknown, format: DurationFormat): DurationParts {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return zeroDuration;
    }

    if (format === 'hours') {
      return parseTotalSeconds(Math.round(value * 3600));
    }

    if (format === 'minutes') {
      return parseTotalSeconds(Math.round(value * 60));
    }

    return parseTotalSeconds(value);
  }

  if (isDurationValue(value)) {
    return { hours: value.hours, minutes: value.minutes, seconds: value.seconds };
  }

  return zeroDuration;
}

function isDurationValue(value: unknown): value is FormedibleDurationValue {
  return typeof value === 'object' && value !== null && 'hours' in value && 'minutes' in value && 'seconds' in value;
}

function parseTotalSeconds(value: number): DurationParts {
  const totalSeconds = Math.abs(value);

  return { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor((totalSeconds % 3600) / 60), seconds: totalSeconds % 60 };
}

function parseDurationText(value: string, format: DurationFormat, maxHours: number, maxMinutes: number, maxSeconds: number): DurationParts | undefined {
  const hours = value.match(/(\d+)h/i);
  const minutes = value.match(/(\d+)m(?!s)/i);
  const seconds = value.match(/(\d+)s/i);

  if (hours !== null || minutes !== null || seconds !== null) {
    return {
      hours: clamp(Number.parseInt(hours?.[1] ?? '0', 10), 0, maxHours),
      minutes: clamp(Number.parseInt(minutes?.[1] ?? '0', 10), 0, maxMinutes),
      seconds: clamp(Number.parseInt(seconds?.[1] ?? '0', 10), 0, maxSeconds),
    };
  }

  const bare = value.trim();
  if (/^\d+$/.test(bare)) {
    const amount = Number.parseInt(bare, 10);

    if (format === 'hours') {
      return { hours: clamp(amount, 0, maxHours), minutes: 0, seconds: 0 };
    }

    if (format === 'minutes') {
      return { hours: 0, minutes: clamp(amount, 0, maxMinutes), seconds: 0 };
    }

    if (format === 'seconds') {
      return { hours: 0, minutes: 0, seconds: clamp(amount, 0, maxSeconds) };
    }
  }

  return undefined;
}

function formatDurationText(parts: DurationParts, units: ReadonlySet<DurationUnit>): string {
  const output: string[] = [];
  if (units.has('h') && parts.hours > 0) {
    output.push(`${parts.hours}h`);
  }
  if (units.has('m') && parts.minutes > 0) {
    output.push(`${parts.minutes}m`);
  }
  if (units.has('s') && parts.seconds > 0) {
    output.push(`${parts.seconds}s`);
  }

  return output.join(' ') || '0';
}

function formatDurationOutput(parts: DurationParts, format: DurationFormat): number | FormedibleDurationValue {
  const totalSeconds = parts.hours * 3600 + parts.minutes * 60 + parts.seconds;

  if (format === 'hours') {
    return parts.hours + parts.minutes / 60 + parts.seconds / 3600;
  }

  if (format === 'minutes') {
    return parts.hours * 60 + parts.minutes + parts.seconds / 60;
  }

  if (format === 'seconds') {
    return totalSeconds;
  }

  return { ...parts, totalSeconds };
}

function isSameDuration(left: DurationParts, right: DurationParts): boolean {
  return left.hours === right.hours && left.minutes === right.minutes && left.seconds === right.seconds;
}
