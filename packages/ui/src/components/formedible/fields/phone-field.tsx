import { ChevronDown, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Button } from '@formedible/ui/components/button';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues } from '@formedible/ui/components/formedible/lib/types';
import { cn } from '@formedible/ui/lib/utils';

const countries = {
  US: { code: '+1', name: 'United States', flag: '🇺🇸', format: '(###) ###-####' },
  CA: { code: '+1', name: 'Canada', flag: '🇨🇦', format: '(###) ###-####' },
  GB: { code: '+44', name: 'United Kingdom', flag: '🇬🇧', format: '#### ### ####' },
  FR: { code: '+33', name: 'France', flag: '🇫🇷', format: '## ## ## ## ##' },
  DE: { code: '+49', name: 'Germany', flag: '🇩🇪', format: '### ### ####' },
  IT: { code: '+39', name: 'Italy', flag: '🇮🇹', format: '### ### ####' },
  ES: { code: '+34', name: 'Spain', flag: '🇪🇸', format: '### ### ###' },
  AU: { code: '+61', name: 'Australia', flag: '🇦🇺', format: '#### ### ###' },
  JP: { code: '+81', name: 'Japan', flag: '🇯🇵', format: '##-####-####' },
  CN: { code: '+86', name: 'China', flag: '🇨🇳', format: '### #### ####' },
  IN: { code: '+91', name: 'India', flag: '🇮🇳', format: '##### #####' },
  BR: { code: '+55', name: 'Brazil', flag: '🇧🇷', format: '(##) #####-####' },
  MX: { code: '+52', name: 'Mexico', flag: '🇲🇽', format: '## #### ####' },
  RU: { code: '+7', name: 'Russia', flag: '🇷🇺', format: '### ###-##-##' },
  KR: { code: '+82', name: 'South Korea', flag: '🇰🇷', format: '##-####-####' },
} as const;

type CountryCode = keyof typeof countries;

export function PhoneField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const config = fieldConfig.phoneConfig;
  const defaultCountry = isCountryCode(config?.defaultCountry) ? config.defaultCountry : 'US';
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => getAllowedDefaultCountry(defaultCountry, config?.allowedCountries));
  const value = typeof field.value === 'string' ? field.value : '';
  const country = countries[selectedCountry];
  const phoneNumber = stripCountryCode(value, country.code);
  const availableCountries = countryCodes.filter((code) => config?.allowedCountries === undefined || config.allowedCountries.includes(code));

  useEffect(() => {
    const nextFallback = getAllowedDefaultCountry(defaultCountry, config?.allowedCountries);

    if (!availableCountries.includes(selectedCountry)) {
      setSelectedCountry(nextFallback);
      return;
    }

    const valueCountry = countryCodeFromValue(value, nextFallback, config?.allowedCountries);

    if (valueCountry && value.startsWith(countries[valueCountry].code)) {
      setSelectedCountry(valueCountry);
    }
  }, [availableCountries, config?.allowedCountries, defaultCountry, selectedCountry, value]);

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
                      setSelectedCountry(code);
                      updateValue(code, phoneNumber);
                      setOpen(false);
                    }}
                  >
                    <span className="mr-2">{countries[code].flag}</span>
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

function getAllowedDefaultCountry(fallback: CountryCode, allowedCountries: readonly string[] | undefined): CountryCode {
  return allowedCountries === undefined || allowedCountries.includes(fallback) ? fallback : countryCodes.find((code) => allowedCountries.includes(code)) ?? fallback;
}

function countryCodeFromValue(value: string, fallback: CountryCode, allowedCountries: readonly string[] | undefined): CountryCode | undefined {
  const preferredCodes = [fallback, ...countryCodes.filter((code) => code !== fallback)].filter((code) => allowedCountries === undefined || allowedCountries.includes(code));

  for (const code of preferredCodes) {
    if (value.startsWith(countries[code].code)) {
      return code;
    }
  }

  return undefined;
}

function stripCountryCode(value: string, code: string): string {
  return value.startsWith(code) ? value.slice(code.length).trim() : value;
}
