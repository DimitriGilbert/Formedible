import { useState } from 'react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Input as TextInput } from '@formedible/ui/components/input';
import { cn } from '@formedible/ui/lib/utils';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';

const maximumPasswordStrength = 4;

function clampStrength(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(maximumPasswordStrength, Math.max(0, Math.trunc(value)));
}

function getPasswordStrength(value: string) {
  const lengthScore = value.length >= 12 ? 1 : 0;
  const lowercaseScore = /[a-z]/u.test(value) ? 1 : 0;
  const uppercaseScore = /[A-Z]/u.test(value) ? 1 : 0;
  const numberOrSymbolScore = /(?:\d|[^A-Za-z0-9])/u.test(value) ? 1 : 0;

  return lengthScore + lowercaseScore + uppercaseScore + numberOrSymbolScore;
}

function getStrengthLabel(strength: number) {
  if (strength <= 1) {
    return 'Weak';
  }

  if (strength === 2) {
    return 'Fair';
  }

  if (strength === 3) {
    return 'Good';
  }

  return 'Strong';
}

export function PasswordField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const [isVisible, setIsVisible] = useState(false);
  const value = typeof field.value === 'string' ? field.value : '';
  const strength = getPasswordStrength(value);
  const minStrength = clampStrength(fieldConfig.passwordConfig?.minStrength ?? 0);
  const showToggle = fieldConfig.passwordConfig?.showToggle === true;
  const showStrengthMeter = fieldConfig.passwordConfig?.strengthMeter === true;
  const inputType = showToggle && isVisible ? 'text' : 'password';

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="relative">
        <TextInput
          id={field.id}
          name={field.name}
          type={inputType}
          value={value}
          placeholder={fieldConfig.placeholder}
          disabled={fieldConfig.disabled}
          required={fieldConfig.required}
          aria-invalid={field.error ? true : undefined}
          className={cn(showToggle ? 'pr-24' : undefined, fieldConfig.inputClassName)}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
        />
        {showToggle ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            className="absolute top-1/2 right-1 h-7 -translate-y-1/2 px-2"
            disabled={fieldConfig.disabled}
            onClick={() => setIsVisible((current) => !current)}
          >
            {isVisible ? 'Hide' : 'Show'}
          </Button>
        ) : null}
      </div>
      {showStrengthMeter ? (
        <div className="space-y-1" aria-live="polite">
          <div className="bg-muted flex h-2 overflow-hidden rounded-full" aria-hidden="true">
            <div className="bg-primary transition-all" style={{ width: `${(strength / maximumPasswordStrength) * 100}%` }} />
          </div>
          <p className="text-muted-foreground text-xs">
            Password strength: {getStrengthLabel(strength)} ({strength}/{maximumPasswordStrength})
            {minStrength > 0 ? ` · Minimum strength: ${minStrength}/${maximumPasswordStrength}` : null}
          </p>
        </div>
      ) : null}
    </FieldWrapper>
  );
}
