"use client";
import React, { useState, useEffect } from "react";
import type { BaseFieldProps } from "@/lib/formedible/types";
import { FieldWrapper } from "./base-field-wrapper";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DurationValue {
  hours?: number;
  minutes?: number;
  seconds?: number;
  totalSeconds?: number;
}

interface DurationPickerFieldProps extends BaseFieldProps {
  durationConfig?: {
    format?: 'hms' | 'hm' | 'ms' | 'hours' | 'minutes' | 'seconds';
    maxHours?: number;
    maxMinutes?: number;
    maxSeconds?: number;
    showLabels?: boolean;
    allowNegative?: boolean;
  };
}

export const DurationPickerField: React.FC<DurationPickerFieldProps> = ({
  fieldApi,
  label,
  description,
  placeholder,
  wrapperClassName,
  labelClassName,
  inputClassName,
  durationConfig = {},
}) => {
  const name = fieldApi.name;

  const {
    format = 'hms',
    maxHours = 23,
    maxMinutes = 59,
    maxSeconds = 59,
    showLabels = true,
    allowNegative: _allowNegative = false
  } = durationConfig;

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  // Initialize from field value
  useEffect(() => {
    const value = fieldApi.state?.value;
    if (value) {
      if (typeof value === 'number') {
        // Value is total seconds
        const totalSeconds = Math.abs(value);
        const newHours = Math.min(Math.floor(totalSeconds / 3600), maxHours);
        const newMinutes = Math.min(Math.floor((totalSeconds % 3600) / 60), maxMinutes);
        const newSeconds = Math.min(totalSeconds % 60, maxSeconds);
        setHours(newHours);
        setMinutes(newMinutes);
        setSeconds(newSeconds);
      } else if (typeof value === 'object') {
        // Value is duration object
        setHours(Math.min(value.hours || 0, maxHours));
        setMinutes(Math.min(value.minutes || 0, maxMinutes));
        setSeconds(Math.min(value.seconds || 0, maxSeconds));
      }
    }
  }, [fieldApi.state?.value, maxHours, maxMinutes, maxSeconds]);

  // Update field value when duration changes
  useEffect(() => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const durationValue: DurationValue = {
      hours,
      minutes,
      seconds,
      totalSeconds
    };

    // Update field based on format
    switch (format) {
      case 'hours':
        fieldApi.handleChange(hours + minutes / 60 + seconds / 3600);
        break;
      case 'minutes':
        fieldApi.handleChange(hours * 60 + minutes + seconds / 60);
        break;
      case 'seconds':
        fieldApi.handleChange(totalSeconds);
        break;
      default:
        fieldApi.handleChange(durationValue);
    }
  }, [hours, minutes, seconds, format, fieldApi.handleChange]);

  const formatDuration = () => {
    const parts = [];
    if (format.includes('h') && hours > 0) parts.push(`${hours}h`);
    if (format.includes('m') && minutes > 0) parts.push(`${minutes}m`);
    if (format.includes('s') && seconds > 0) parts.push(`${seconds}s`);
    return parts.join(' ') || '0';
  };

  const renderTimeInput = (
    value: number,
    onChange: (value: number) => void,
    max: number,
    unit: string,
    show: boolean
  ) => {
    if (!show) return null;

    return (
      <div className="flex flex-col space-y-1">
        {showLabels && (
          <Label className="text-xs text-muted-foreground capitalize">
            {unit}
          </Label>
        )}
        <Select
          value={value.toString()}
          onValueChange={(val) => onChange(parseInt(val))}
        >
          <SelectTrigger className={cn("w-20", inputClassName)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: max + 1 }, (_, i) => (
              <SelectItem key={i} value={i.toString()}>
                {i.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderManualInput = () => {
    return (
      <div className="space-y-2">
        <Input
          id={name}
          value={formatDuration()}
          placeholder={placeholder || "Enter duration (e.g., 1h 30m 45s)"}
          className={inputClassName}
          onChange={(e) => {
            const input = e.target.value;
            // Parse manual input like "1h 30m 45s" or "90m" or "3600s"
            const hourMatch = input.match(/(\d+)h/i);
            const minuteMatch = input.match(/(\d+)m(?!s)/i); // Don't match 'ms'
            const secondMatch = input.match(/(\d+)s/i);
            
            const newHours = hourMatch ? Math.max(0, parseInt(hourMatch[1], 10)) : 0;
            const newMinutes = minuteMatch ? Math.max(0, parseInt(minuteMatch[1], 10)) : 0;
            const newSeconds = secondMatch ? Math.max(0, parseInt(secondMatch[1], 10)) : 0;
            
            if (newHours <= maxHours && newMinutes <= maxMinutes && newSeconds <= maxSeconds) {
              setHours(newHours);
              setMinutes(newMinutes);
              setSeconds(newSeconds);
            } else {
              // Provide feedback for invalid input
              console.warn('Duration values exceed maximum limits');
            }
          }}
        />
        <div className="text-xs text-muted-foreground">
          Format: {format === 'hms' ? '1h 30m 45s' : format === 'hm' ? '1h 30m' : format === 'ms' ? '30m 45s' : `${format} only`}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", wrapperClassName)}>
      {label && (
        <Label htmlFor={name} className={labelClassName}>
          {label}
        </Label>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <div className="space-y-3">
        {/* Dropdown selectors */}
        <div className="flex gap-3">
          {renderTimeInput(
            hours,
            setHours,
            maxHours,
            'hours',
            format.includes('h')
          )}
          {renderTimeInput(
            minutes,
            setMinutes,
            maxMinutes,
            'minutes',
            format.includes('m')
          )}
          {renderTimeInput(
            seconds,
            setSeconds,
            maxSeconds,
            'seconds',
            format.includes('s')
          )}
        </div>

        {/* Manual input alternative */}
        {renderManualInput()}

        {/* Duration display */}
        <div className="text-sm text-muted-foreground">
          Total: {formatDuration()}
          {format !== 'seconds' && ` (${hours * 3600 + minutes * 60 + seconds} seconds)`}
        </div>
      </div>

      {fieldApi.state?.meta?.errors && fieldApi.state?.meta?.errors.length > 0 && (
        <p className="text-sm text-destructive">
          {fieldApi.state?.meta?.errors[0]}
        </p>
      )}
    </div>
  );
};