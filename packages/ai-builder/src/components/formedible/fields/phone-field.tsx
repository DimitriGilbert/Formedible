import { ChevronDown, Phone } from 'lucide-react';
import { useState } from 'react';

import { FieldWrapper } from '@/components/formedible/fields/field-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@/lib/formedible/types';
import { cn } from '@/lib/utils';

const countries = {
  US: { code: '+1', name: 'United States', format: '(###) ###-####' },
  CA: { code: '+1', name: 'Canada', format: '(###) ###-####' },
  GB: { code: '+44', name: 'United Kingdom', format: '#### ### ####' },
  FR: { code: '+33', name: 'France', format: '## ## ## ## ##' },
  DE: { code: '+49', name: 'Germany', format: '### ### ####' },
} as const;

type CountryCode = keyof typeof countries;

export function PhoneField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.phoneConfig;
  const defaultCountry = isCountryCode(config?.defaultCountry) ? config.defaultCountry : 'US';
  const [open, setOpen] = useState(false);
  const value = typeof field.value === 'string' ? field.value : '';
  const selectedCountry = countryCodeFromValue(value, defaultCountry, config?.allowedCountries);
  const country = countries[selectedCountry];
  const phoneNumber = stripCountryCode(value, country.code);
  const availableCountries = countryCodes.filter((code) => config?.allowedCountries === undefined || config.allowedCountries.includes(code));

  function updateValue(countryCode: CountryCode, nextValue: string) {
    const nextCountry = countries[countryCode];
    const formatted = formatPhone(nextValue, nextCountry.format);
    field.onChange(config?.format === 'international' ? `${nextCountry.code} ${formatted}`.trim() : formatted);
  }

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <div className="space-y-2">
        <div className="flex">
          <div className="relative">
            <Button variant="outline" className="rounded-r-none border-r-0" disabled={fieldConfig.disabled} onClick={() => setOpen((isOpen) => !isOpen)}>
              {country.code}
              <ChevronDown className="size-3" />
            </Button>
            {open && (
              <div className="absolute z-50 mt-1 min-w-48 rounded-md border bg-popover p-1 shadow-md">
                {availableCountries.map((code) => (
                  <Button
                    key={code}
                    type="button"
                    variant="ghost"
                    className={cn('h-auto w-full justify-start rounded-sm px-2 py-1.5 text-left text-sm', selectedCountry === code ? 'bg-accent' : '')}
                    onClick={() => {
                      updateValue(code, phoneNumber);
                      setOpen(false);
                    }}
                  >
                    {countries[code].name} {countries[code].code}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Input
            id={field.id}
            name={field.name}
            value={phoneNumber}
            placeholder={config?.placeholder ?? formatPhone('1234567890', country.format)}
            disabled={fieldConfig.disabled}
            aria-invalid={field.error ? true : undefined}
            className={cn('rounded-l-none', fieldConfig.inputClassName)}
            onBlur={field.onBlur}
            onChange={(event) => updateValue(selectedCountry, event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="size-3" />
          Format: {country.format.replaceAll('#', '0')}
        </div>
      </div>
    </FieldWrapper>
  );
}

const countryCodes = Object.keys(countries).filter(isCountryCode);

function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && value in countries;
}

function formatPhone(value: string, format: string): string {
  const digits = value.replace(/\D/g, '');
  let formatted = '';
  let digitIndex = 0;

  for (const character of format) {
    if (character === '#') {
      if (digitIndex >= digits.length) {
        break;
      }
      formatted += digits[digitIndex];
      digitIndex += 1;
    } else {
      formatted += character;
    }
  }

  return formatted;
}

function countryCodeFromValue(value: string, fallback: CountryCode, allowedCountries: readonly string[] | undefined): CountryCode {
  for (const code of countryCodes) {
    if ((allowedCountries === undefined || allowedCountries.includes(code)) && value.startsWith(countries[code].code)) {
      return code;
    }
  }

  return allowedCountries === undefined || allowedCountries.includes(fallback) ? fallback : countryCodes.find((code) => allowedCountries.includes(code)) ?? fallback;
}

function stripCountryCode(value: string, code: string): string {
  return value.startsWith(code) ? value.slice(code.length).trim() : value;
}
