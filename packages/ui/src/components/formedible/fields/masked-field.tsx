import { FieldWrapper } from '@formedible/ui/components/formedible/fields/field-wrapper';
import { Input } from '@formedible/ui/components/input';
import type { FormedibleFieldRenderProps, FormedibleFormValues, FormedibleMaskedInputConfig, FormedibleMaskedInputMask } from '@formedible/ui/components/formedible/lib/types';

const digitMaskToken = '9';
const legacyDigitMaskToken = '0';
const alphaMaskToken = 'a';
const upperAlphaMaskToken = 'A';
const alphaNumericMaskToken = '*';
const maskGuideCharacter = '_';

export function MaskedField<TFormValues extends FormedibleFormValues>({ fieldConfig, field }: FormedibleFieldRenderProps<TFormValues>) {
  const rawValue = typeof field.value === 'string' ? field.value : '';
  const maskedInputConfig = fieldConfig.maskedInputConfig;
  const mask = fieldConfig.mask ?? maskedInputConfig?.mask;
  const value = mask ? applyInputMask(rawValue, mask, maskedInputConfig) : rawValue;
  const placeholder = getMaskedInputPlaceholder(fieldConfig.placeholder, maskedInputConfig);

  return (
    <FieldWrapper fieldConfig={fieldConfig} field={field}>
      <Input
        data-slot="masked-input"
        data-mask={typeof mask === 'string' ? mask : undefined}
        id={field.id}
        name={field.name}
        type="text"
        inputMode={typeof mask === 'string' && usesOnlyDigitTokens(mask) ? 'numeric' : undefined}
        value={value}
        placeholder={placeholder}
        disabled={fieldConfig.disabled}
        required={fieldConfig.required}
        aria-invalid={field.error ? true : undefined}
        className={fieldConfig.inputClassName}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(mask ? applyInputMask(event.target.value, mask, maskedInputConfig, value) : event.target.value)}
      />
    </FieldWrapper>
  );
}

function applyInputMask(value: string, mask: FormedibleMaskedInputMask, config?: FormedibleMaskedInputConfig, fallbackValue = ''): string {
  if (typeof mask === 'function') {
    return applyMaskPipe(mask(value), config, fallbackValue);
  }

  let valueIndex = 0;
  let maskedValue = '';

  for (const maskCharacter of mask) {
    const matcher = getMaskTokenMatcher(maskCharacter);

    if (!matcher) {
      maskedValue += maskCharacter;
      continue;
    }

    const nextValueCharacter = getNextMatchingCharacter(value, valueIndex, matcher);
    if (!nextValueCharacter && shouldShowGuide(config)) {
      maskedValue += maskGuideCharacter;
      continue;
    }

    if (!nextValueCharacter) {
      break;
    }

    maskedValue += getConformedMaskCharacter(nextValueCharacter.character, maskCharacter);
    valueIndex = nextValueCharacter.nextIndex;
  }

  return applyMaskPipe(maskedValue, config, fallbackValue);
}

function getNextMatchingCharacter(
  value: string,
  startIndex: number,
  matcher: (character: string) => boolean,
): { readonly character: string; readonly nextIndex: number } | undefined {
  for (let index = startIndex; index < value.length; index += 1) {
    const character = value[index];

    if (character && matcher(character)) {
      return { character, nextIndex: index + 1 };
    }
  }

  return undefined;
}

function getMaskTokenMatcher(token: string): ((character: string) => boolean) | undefined {
  if (token === digitMaskToken || token === legacyDigitMaskToken) {
    return (character) => /\d/.test(character);
  }

  if (token === alphaMaskToken || token === upperAlphaMaskToken) {
    return (character) => /[A-Za-z]/.test(character);
  }

  if (token === alphaNumericMaskToken) {
    return (character) => /[A-Za-z0-9]/.test(character);
  }

  return undefined;
}

function usesOnlyDigitTokens(mask: string): boolean {
  return [...mask].some((character) => character === digitMaskToken || character === legacyDigitMaskToken) && [...mask].every((character) => character === digitMaskToken || character === legacyDigitMaskToken || !getMaskTokenMatcher(character));
}

function getConformedMaskCharacter(character: string, token: string): string {
  if (token === upperAlphaMaskToken) {
    return character.toUpperCase();
  }

  if (token === alphaMaskToken) {
    return character.toLowerCase();
  }

  return character;
}

function shouldShowGuide(config: FormedibleMaskedInputConfig | undefined): boolean {
  return config?.showMask === true && config.guide !== false;
}

function applyMaskPipe(maskedValue: string, config: FormedibleMaskedInputConfig | undefined, fallbackValue: string): string {
  if (!config?.pipe) {
    return maskedValue;
  }

  const pipedValue = config.pipe(maskedValue, config);

  if (pipedValue === false) {
    return fallbackValue;
  }

  if (typeof pipedValue === 'string') {
    return pipedValue;
  }

  return pipedValue.value;
}

function getMaskedInputPlaceholder(fieldPlaceholder: string | undefined, config: FormedibleMaskedInputConfig | undefined): string | undefined {
  if (fieldPlaceholder) {
    return fieldPlaceholder;
  }

  if (config?.placeholder) {
    return config.placeholder;
  }

  if (typeof config?.mask === 'string' && shouldShowGuide(config)) {
    return config.mask.replace(/[09Aa*]/g, maskGuideCharacter);
  }

  return undefined;
}
