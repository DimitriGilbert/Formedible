import { clamp } from '@/components/formedible/fields/advanced-field-utils';
import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormedibleDurationValue, FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';

interface DurationParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

export function DurationPickerField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.durationConfig;
  const format = config?.format ?? 'hms';
  const maxHours = config?.maxHours ?? 23;
  const maxMinutes = config?.maxMinutes ?? 59;
  const maxSeconds = config?.maxSeconds ?? 59;
  const parts = parseDuration(field.value);

  function update(nextParts: DurationParts) {
    field.onChange(formatDurationOutput(nextParts, format));
  }

  function updatePart(partName: keyof DurationParts, value: number) {
    update({ ...parts, [partName]: value });
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-3">
        <div className="flex gap-3">
          {format.includes('h') && <DurationSelect label="Hours" value={parts.hours} max={maxHours} disabled={fieldConfig.disabled} onChange={(value) => updatePart('hours', value)} />}
          {format.includes('m') && <DurationSelect label="Minutes" value={parts.minutes} max={maxMinutes} disabled={fieldConfig.disabled} onChange={(value) => updatePart('minutes', value)} />}
          {format.includes('s') && <DurationSelect label="Seconds" value={parts.seconds} max={maxSeconds} disabled={fieldConfig.disabled} onChange={(value) => updatePart('seconds', value)} />}
        </div>
        <Input
          value={formatDurationText(parts, format)}
          placeholder={fieldConfig.placeholder ?? 'Enter duration (e.g., 1h 30m 45s)'}
          disabled={fieldConfig.disabled}
          className={fieldConfig.inputClassName}
          onBlur={field.onBlur}
          onChange={(event) => update(parseDurationText(event.target.value, maxHours, maxMinutes, maxSeconds))}
        />
        <div className="text-sm text-muted-foreground">Total: {parts.hours * 3600 + parts.minutes * 60 + parts.seconds} seconds</div>
      </div>
    </FieldWrapper>
  );
}

interface DurationSelectProps {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly disabled: boolean;
  readonly onChange: (value: number) => void;
}

function DurationSelect({ label, value, max, disabled, onChange }: DurationSelectProps) {
  return (
    <div className="space-y-1">
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

function parseDuration(value: unknown): DurationParts {
  if (typeof value === 'number') {
    return parseTotalSeconds(value);
  }

  if (isDurationValue(value)) {
    return { hours: value.hours, minutes: value.minutes, seconds: value.seconds };
  }

  return { hours: 0, minutes: 0, seconds: 0 };
}

function isDurationValue(value: unknown): value is FormedibleDurationValue {
  return typeof value === 'object' && value !== null && 'hours' in value && 'minutes' in value && 'seconds' in value;
}

function parseTotalSeconds(value: number): DurationParts {
  const totalSeconds = Math.abs(value);

  return { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor((totalSeconds % 3600) / 60), seconds: totalSeconds % 60 };
}

function parseDurationText(value: string, maxHours: number, maxMinutes: number, maxSeconds: number): DurationParts {
  const hours = Number.parseInt(value.match(/(\d+)h/i)?.[1] ?? '0', 10);
  const minutes = Number.parseInt(value.match(/(\d+)m(?!s)/i)?.[1] ?? '0', 10);
  const seconds = Number.parseInt(value.match(/(\d+)s/i)?.[1] ?? '0', 10);

  return { hours: clamp(hours, 0, maxHours), minutes: clamp(minutes, 0, maxMinutes), seconds: clamp(seconds, 0, maxSeconds) };
}

function formatDurationText(parts: DurationParts, format: string): string {
  const output = [];
  if (format.includes('h') && parts.hours > 0) {
    output.push(`${parts.hours}h`);
  }
  if (format.includes('m') && parts.minutes > 0) {
    output.push(`${parts.minutes}m`);
  }
  if (format.includes('s') && parts.seconds > 0) {
    output.push(`${parts.seconds}s`);
  }

  return output.join(' ') || '0';
}

function formatDurationOutput(parts: DurationParts, format: string): number | FormedibleDurationValue {
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
