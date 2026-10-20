import type { ReactNode } from 'react';

import type {
  FormedibleFieldRenderProps,
  FormedibleFieldValidation,
  FormedibleFormValues,
  FormedibleStandardFieldSchema,
  NormalizedFieldType,
} from '@formedible/ui/components/formedible/lib/types';

/**
 * The field-extension contract (contract version 1.0.0).
 *
 * The engine already renders custom field types: a field declaring any type
 * string resolves through `defaultComponents` registrations or `field.component`
 * and falls back to the text field. This module adds the PUBLISHED CONTRACT
 * OBJECT a third-party field needs beyond rendering, assembled as one surface:
 *
 * - `valueSerialization` — to/from wire JSON with a stable, versioned envelope;
 * - `zodValidation` — the field's schema factory (any Standard Schema v1
 *   validator; zod v4 schemas satisfy it natively), installed as the field's
 *   validation when the field config declares none of its own;
 * - `builderMetadata` — label, icon key, and configurability declarations the
 *   form builder consumes to offer the field;
 * - `accessibilityObligations` — the a11y contract a field MUST satisfy, with
 *   the machine-checkable subset the engine can assert against rendered markup
 *   (`verifyFieldExtensionAccessibility`) and the documented remainder;
 * - `aiSafeRedactionRules` — how AI features must treat the field's value
 *   (`treatFieldExtensionValueForAi` is the enforcement surface);
 * - `semver` — the contract's own version plus the compatibility range the
 *   extension declares against `FIELD_EXTENSION_CONTRACT_VERSION`.
 *
 * Rendering itself is unchanged: `registerFieldExtension` feeds the existing
 * resolution order (`field.component` > hook `defaultComponents` > registered
 * extension > built-in registry > text fallback).
 */

/** The contract version this engine implements. */
export const FIELD_EXTENSION_CONTRACT_VERSION = '1.0.0';

/**
 * A field-extension component. Receives the standard field render props
 * (`field`, `fieldConfig`, `renderField`, ...); the dual-shape legacy flat
 * props (`fieldApi`, `label`, `options`, resolved config objects) are
 * delivered alongside them at runtime. Generic like the built-in field
 * components so one registration serves every `TFormValues` instantiation.
 */
export type FieldExtensionComponent = <TFormValues extends FormedibleFormValues>(props: FormedibleFieldRenderProps<TFormValues>) => ReactNode;

/** The stable wire envelope every serialized extension value is wrapped in. */
export interface FieldExtensionWireValue {
  /** Envelope discriminator; always `formedible-field-extension`. */
  readonly $field: 'formedible-field-extension';
  /** The registered extension type the value belongs to. */
  readonly extensionType: string;
  /** The engine contract version that produced the envelope. */
  readonly contractVersion: string;
  /** The extension's own serialization shape version (`valueSerialization.version`). */
  readonly serializationVersion: number;
  /** The extension-produced wire value; must be JSON-safe. */
  readonly value: unknown;
}

/** Value serialization contract: to/from wire JSON with a versioned shape. */
export interface FieldExtensionValueSerialization {
  /** Serialization shape version; a positive integer the extension bumps when its wire shape changes. */
  readonly version: number;
  /** Converts a live field value into a JSON-safe wire value. */
  readonly toWire: (value: unknown) => unknown;
  /** Restores a live field value from a wire value produced by `toWire`. */
  readonly fromWire: (wire: unknown) => unknown;
}

/**
 * Zod validation contract. The engine validates through Standard Schema v1
 * (`~standard`), which zod v4 schemas implement natively — the factory returns
 * the schema instance and must be pure (it is invoked once per registration
 * and the product is reused).
 */
export interface FieldExtensionZodValidation {
  readonly schemaFactory: () => FormedibleStandardFieldSchema;
}

/** One configurability declaration the form builder offers for the field. */
export interface FieldExtensionConfigurableProp {
  /** The prop key on the field config the builder writes (e.g. `swatchConfig.colors`). */
  readonly prop: string;
  /** Human label shown next to the builder control. */
  readonly label: string;
  /** The builder control kind. */
  readonly kind: 'string' | 'number' | 'boolean' | 'options' | 'json';
  /** Whether the builder must collect the prop before the field is usable. */
  readonly required?: boolean;
  /** Default value written when the prop is first added. */
  readonly defaultValue?: string | number | boolean;
  /** Fixed choices for `kind: 'options'`. */
  readonly options?: readonly FieldExtensionConfigurableOption[];
}

export interface FieldExtensionConfigurableOption {
  readonly value: string;
  readonly label: string;
}

/** Builder-facing metadata: how the field is offered and configured. */
export interface FieldExtensionBuilderMetadata {
  /** Human label shown in the builder's field palette. */
  readonly label: string;
  /** Icon key the builder resolves in its own icon set. */
  readonly iconKey: string;
  /** One-line description of what the field captures. */
  readonly description?: string;
  /** Declarative configurability surface consumed by the builder UI. */
  readonly configurable: readonly FieldExtensionConfigurableProp[];
}

/** How the rendered control's accessible name is associated. */
export type FieldExtensionLabelAssociation = 'htmlFor' | 'aria-labelledby' | 'aria-label' | 'wrapping-label';

/** How focus enters the field. */
export type FieldExtensionFocusTarget = 'native-control' | 'tabindex-0' | 'roving-tabindex';

/** An ARIA pattern the rendered control exposes. */
export interface FieldExtensionAriaPattern {
  /** The `role` the pattern centers on, when it has one. */
  readonly role?: string;
  /** ARIA attributes the pattern requires (e.g. `aria-checked`). */
  readonly attributes: readonly string[];
}

/**
 * A machine-checkable obligation the engine asserts against rendered markup
 * through `verifyFieldExtensionAccessibility`.
 */
export type FieldExtensionAccessibilityMachineCheck =
  | { readonly kind: 'focusable-control' }
  | { readonly kind: 'label-associated' }
  | { readonly kind: 'aria-attribute'; readonly attribute: string }
  | { readonly kind: 'role'; readonly role: string };

/**
 * The accessibility contract a field MUST satisfy. `keyboardBehavior` and the
 * prose inside `ariaPatterns` are the documented portion (the engine cannot
 * script every keyboard interaction); `machineChecks` is the portion the
 * engine asserts. `verifyFieldExtensionAccessibility` additionally checks the
 * declared `labelAssociation` and `focusTarget` shapes.
 */
export interface FieldExtensionAccessibilityObligations {
  readonly labelAssociation: FieldExtensionLabelAssociation;
  readonly focusTarget: FieldExtensionFocusTarget;
  /** Documented keyboard behavior, one entry per interaction (e.g. `ArrowRight: select the next swatch`). */
  readonly keyboardBehavior: readonly string[];
  readonly ariaPatterns: readonly FieldExtensionAriaPattern[];
  /** Optional extra checks; the declared label/focus/aria surface is always checked. */
  readonly machineChecks?: readonly FieldExtensionAccessibilityMachineCheck[];
}

/** How AI features (classifiers, prompts, support tooling) must treat the value. */
export type FieldExtensionAiTreatment = 'include' | 'exclude' | 'redact';

export interface FieldExtensionAiSafeRedactionRules {
  /**
   * `include`: the value may flow into AI features as-is. `exclude`: the value
   * must never reach an AI feature. `redact`: AI features see the placeholder
   * from `redactWith` instead of the value.
   */
  readonly treatment: FieldExtensionAiTreatment;
  /** Documented reason the treatment exists (surfaced by auditors). */
  readonly reason?: string;
  /** Placeholder used when `treatment` is `redact`; defaults to `[redacted]`. */
  readonly redactWith?: string;
}

/** The extension's own version and its compatibility with the engine contract. */
export interface FieldExtensionSemver {
  /** The extension's version, strict `major.minor.patch`. */
  readonly version: string;
  /**
   * The contract versions the extension is compatible with, satisfied against
   * `FIELD_EXTENSION_CONTRACT_VERSION`. Supported comparators: `*`, an exact
   * version (`1.0.0` / `=1.0.0`), `>`, `>=`, `<`, `<=`, `~` (same minor), and
   * `^` (same major), space-separated as an AND list. Prerelease tags, `||`,
   * and hyphen ranges are not part of the contract grammar.
   */
  readonly contractCompatRange: string;
}

/** The field-extension contract object. */
export interface FieldExtension {
  /** The custom field type string fields declare in `type`. Must not collide with a built-in type. */
  readonly type: string;
  /** The renderer for the type; resolved through the existing component resolution order. */
  readonly component: FieldExtensionComponent;
  readonly valueSerialization: FieldExtensionValueSerialization;
  readonly zodValidation: FieldExtensionZodValidation;
  readonly builderMetadata: FieldExtensionBuilderMetadata;
  readonly accessibilityObligations: FieldExtensionAccessibilityObligations;
  readonly aiSafeRedactionRules: FieldExtensionAiSafeRedactionRules;
  readonly semver: FieldExtensionSemver;
}

/** The result of treating a value per the extension's AI-safety rules. */
export interface FieldExtensionAiTreatmentResult {
  readonly treatment: FieldExtensionAiTreatment;
  readonly value: unknown;
}

/** One machine-checkable accessibility verdict against rendered markup. */
export interface FieldExtensionAccessibilityFinding {
  /** Human-readable check id (e.g. `label-associated`). */
  readonly check: string;
  readonly passed: boolean;
  readonly message: string;
}

const builtInFieldTypes: ReadonlySet<string> = new Set(
  Object.keys({
    array: 'array',
    autocomplete: 'autocomplete',
    checkbox: 'checkbox',
    color: 'color',
    combobox: 'combobox',
    date: 'date',
    duration: 'duration',
    email: 'email',
    file: 'file',
    location: 'location',
    masked: 'masked',
    multiCombobox: 'multiCombobox',
    multiSelect: 'multiSelect',
    number: 'number',
    object: 'object',
    password: 'password',
    phone: 'phone',
    radio: 'radio',
    rating: 'rating',
    select: 'select',
    slider: 'slider',
    switch: 'switch',
    tel: 'tel',
    text: 'text',
    textarea: 'textarea',
    url: 'url',
  } satisfies Record<NormalizedFieldType, string>),
);

const labelAssociations: ReadonlySet<string> = new Set(['htmlFor', 'aria-labelledby', 'aria-label', 'wrapping-label']);
const focusTargets: ReadonlySet<string> = new Set(['native-control', 'tabindex-0', 'roving-tabindex']);
const aiTreatments: ReadonlySet<string> = new Set(['include', 'exclude', 'redact']);
const configurableKinds: ReadonlySet<string> = new Set(['string', 'number', 'boolean', 'options', 'json']);

const fieldExtensionRegistry = new Map<string, FieldExtension>();
const fieldExtensionSchemas = new WeakMap<FieldExtension, FormedibleStandardFieldSchema>();
const registrationListeners = new Set<() => void>();

function registrationError(detail: string): Error {
  return new Error(`Invalid Formedible field extension: ${detail}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

interface SemverParts {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

function parseStrictSemver(version: unknown, what: string): SemverParts {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
    throw registrationError(`${what} must be a strict major.minor.patch semver string, received ${JSON.stringify(version)}`);
  }

  const [major, minor, patch] = version.split('.') as [string, string, string];

  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function compareSemver(left: SemverParts, right: SemverParts): number {
  if (left.major !== right.major) {
    return left.major < right.major ? -1 : 1;
  }

  if (left.minor !== right.minor) {
    return left.minor < right.minor ? -1 : 1;
  }

  return left.patch < right.patch ? -1 : left.patch > right.patch ? 1 : 0;
}

/**
 * Whether `version` satisfies a contract compat range. Grammar: one or more
 * comparators AND-ed by spaces; each comparator is `*`, an exact version, or
 * `=`, `>`, `>=`, `<`, `<=`, `~`, or `^` followed by a strict version.
 */
export function isFieldExtensionContractCompatible(range: string, version: string = FIELD_EXTENSION_CONTRACT_VERSION): boolean {
  const target = parseStrictSemver(version, 'version');
  const comparators = range.split(/\s+/).filter((comparator) => comparator.length > 0);

  if (comparators.length === 0) {
    return false;
  }

  for (const comparator of comparators) {
    if (comparator === '*') {
      continue;
    }

    const match = /^(>=|<=|>|<|=|\^|~)?(\d+\.\d+\.\d+)$/.exec(comparator);

    if (match === null) {
      return false;
    }

    const operator = match[1] ?? '=';
    const bound = parseStrictSemver(match[2], 'comparator version');
    const comparison = compareSemver(target, bound);
    let satisfied = false;

    switch (operator) {
      case '=':
        satisfied = comparison === 0;
        break;
      case '>':
        satisfied = comparison > 0;
        break;
      case '>=':
        satisfied = comparison >= 0;
        break;
      case '<':
        satisfied = comparison < 0;
        break;
      case '<=':
        satisfied = comparison <= 0;
        break;
      case '~':
        satisfied = comparison >= 0 && target.major === bound.major && target.minor === bound.minor;
        break;
      case '^':
        satisfied = comparison >= 0 && target.major === bound.major;
        break;
    }

    if (!satisfied) {
      return false;
    }
  }

  return true;
}

function hasStandardSchemaShape(schema: unknown): schema is FormedibleStandardFieldSchema {
  return (
    typeof schema === 'object' &&
    schema !== null &&
    '~standard' in schema &&
    typeof schema['~standard'] === 'object' &&
    schema['~standard'] !== null &&
    (schema['~standard'] as { readonly version?: unknown }).version === 1 &&
    typeof (schema['~standard'] as { readonly validate?: unknown }).validate === 'function'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateFieldExtension(extension: FieldExtension): FormedibleStandardFieldSchema {
  if (!isRecord(extension)) {
    throw registrationError('expected an extension object');
  }

  if (!isNonEmptyString(extension.type)) {
    throw registrationError('`type` must be a non-empty string');
  }

  if (builtInFieldTypes.has(normalizeAlias(extension.type))) {
    throw registrationError(`\`${extension.type}\` collides with a built-in field type; extension types must be custom strings`);
  }

  if (typeof extension.component !== 'function') {
    throw registrationError('`component` must be a React component function');
  }

  const serialization = extension.valueSerialization;

  if (!isRecord(serialization)) {
    throw registrationError('`valueSerialization` must be an object');
  }

  if (!Number.isInteger(serialization.version) || serialization.version < 1) {
    throw registrationError('`valueSerialization.version` must be a positive integer');
  }

  if (typeof serialization.toWire !== 'function' || typeof serialization.fromWire !== 'function') {
    throw registrationError('`valueSerialization.toWire` and `valueSerialization.fromWire` must be functions');
  }

  const zodValidation = extension.zodValidation;

  if (!isRecord(zodValidation) || typeof zodValidation.schemaFactory !== 'function') {
    throw registrationError('`zodValidation.schemaFactory` must be a function');
  }

  let schema: unknown;

  try {
    schema = zodValidation.schemaFactory();
  } catch (error: unknown) {
    throw registrationError(`\`zodValidation.schemaFactory\` threw: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!hasStandardSchemaShape(schema)) {
    throw registrationError('`zodValidation.schemaFactory` must return a Standard Schema v1 validator (a `~standard` object with version 1 and a validate function; zod v4 schemas satisfy this natively)');
  }

  const metadata = extension.builderMetadata;

  if (!isRecord(metadata)) {
    throw registrationError('`builderMetadata` must be an object');
  }

  if (!isNonEmptyString(metadata.label)) {
    throw registrationError('`builderMetadata.label` must be a non-empty string');
  }

  if (!isNonEmptyString(metadata.iconKey)) {
    throw registrationError('`builderMetadata.iconKey` must be a non-empty string');
  }

  if (!Array.isArray(metadata.configurable)) {
    throw registrationError('`builderMetadata.configurable` must be an array of configurability declarations');
  }

  for (const [index, entry] of (metadata.configurable as readonly unknown[]).entries()) {
    if (!isRecord(entry)) {
      throw registrationError(`\`builderMetadata.configurable[${index}]\` must be an object`);
    }

    if (!isNonEmptyString(entry.prop)) {
      throw registrationError(`\`builderMetadata.configurable[${index}].prop\` must be a non-empty string`);
    }

    if (!isNonEmptyString(entry.label)) {
      throw registrationError(`\`builderMetadata.configurable[${index}].label\` must be a non-empty string`);
    }

    if (typeof entry.kind !== 'string' || !configurableKinds.has(entry.kind)) {
      throw registrationError(`\`builderMetadata.configurable[${index}].kind\` must be one of string, number, boolean, options, json`);
    }

    if (entry.kind === 'options') {
      const options = entry.options;

      if (
        !Array.isArray(options) ||
        options.length === 0 ||
        (options as readonly unknown[]).some((option) => !isRecord(option) || !isNonEmptyString(option.value))
      ) {
        throw registrationError(`\`builderMetadata.configurable[${index}]\` declares kind \`options\` and must list at least one option with a non-empty value`);
      }
    }
  }

  const obligations = extension.accessibilityObligations;

  if (!isRecord(obligations)) {
    throw registrationError('`accessibilityObligations` must be an object');
  }

  if (typeof obligations.labelAssociation !== 'string' || !labelAssociations.has(obligations.labelAssociation)) {
    throw registrationError('`accessibilityObligations.labelAssociation` must be one of htmlFor, aria-labelledby, aria-label, wrapping-label');
  }

  if (typeof obligations.focusTarget !== 'string' || !focusTargets.has(obligations.focusTarget)) {
    throw registrationError('`accessibilityObligations.focusTarget` must be one of native-control, tabindex-0, roving-tabindex');
  }

  if (
    !Array.isArray(obligations.keyboardBehavior) ||
    obligations.keyboardBehavior.length === 0 ||
    (obligations.keyboardBehavior as readonly unknown[]).some((behavior) => !isNonEmptyString(behavior))
  ) {
    throw registrationError('`accessibilityObligations.keyboardBehavior` must list at least one documented keyboard interaction');
  }

  const ariaPatterns = obligations.ariaPatterns;

  if (!Array.isArray(ariaPatterns)) {
    throw registrationError('`accessibilityObligations.ariaPatterns` must be an array');
  }

  for (const [index, entry] of (ariaPatterns as readonly unknown[]).entries()) {
    if (!isRecord(entry)) {
      throw registrationError(`\`accessibilityObligations.ariaPatterns[${index}]\` must be an object`);
    }

    if (entry.role !== undefined && !isNonEmptyString(entry.role)) {
      throw registrationError(`\`accessibilityObligations.ariaPatterns[${index}].role\` must be a non-empty string when present`);
    }

    if (
      !Array.isArray(entry.attributes) ||
      entry.attributes.length === 0 ||
      (entry.attributes as readonly unknown[]).some((attribute) => !isNonEmptyString(attribute) || !attribute.startsWith('aria-'))
    ) {
      throw registrationError(`\`accessibilityObligations.ariaPatterns[${index}].attributes\` must list at least one \`aria-\` prefixed attribute`);
    }
  }

  if (obligations.machineChecks !== undefined) {
    const machineChecks = obligations.machineChecks;

    if (!Array.isArray(machineChecks)) {
      throw registrationError('`accessibilityObligations.machineChecks` must be an array');
    }

    for (const [index, entry] of (machineChecks as readonly unknown[]).entries()) {
      if (!isRecord(entry) || typeof entry.kind !== 'string') {
        throw registrationError(`\`accessibilityObligations.machineChecks[${index}]\` must declare a check kind`);
      }

      if (entry.kind === 'aria-attribute' && !isNonEmptyString(entry.attribute)) {
        throw registrationError(`\`accessibilityObligations.machineChecks[${index}]\` declares kind \`aria-attribute\` and must name the attribute`);
      }

      if (entry.kind === 'role' && !isNonEmptyString(entry.role)) {
        throw registrationError(`\`accessibilityObligations.machineChecks[${index}]\` declares kind \`role\` and must name the role`);
      }

      if (entry.kind !== 'focusable-control' && entry.kind !== 'label-associated' && entry.kind !== 'aria-attribute' && entry.kind !== 'role') {
        throw registrationError(`\`accessibilityObligations.machineChecks[${index}].kind\` must be one of focusable-control, label-associated, aria-attribute, role`);
      }
    }
  }

  const redaction = extension.aiSafeRedactionRules;

  if (!isRecord(redaction)) {
    throw registrationError('`aiSafeRedactionRules` must be an object');
  }

  if (typeof redaction.treatment !== 'string' || !aiTreatments.has(redaction.treatment)) {
    throw registrationError('`aiSafeRedactionRules.treatment` must be one of include, exclude, redact');
  }

  if (redaction.redactWith !== undefined && typeof redaction.redactWith !== 'string') {
    throw registrationError('`aiSafeRedactionRules.redactWith` must be a string when present');
  }

  const semver = extension.semver;

  if (!isRecord(semver)) {
    throw registrationError('`semver` must be an object');
  }

  parseStrictSemver(semver.version, '`semver.version`');

  if (!isNonEmptyString(semver.contractCompatRange) || !isFieldExtensionContractCompatible(semver.contractCompatRange)) {
    throw registrationError(
      `\`semver.contractCompatRange\` (${JSON.stringify(semver.contractCompatRange)}) is not satisfied by the engine contract version ${FIELD_EXTENSION_CONTRACT_VERSION}; refusing registration`,
    );
  }

  return schema;
}

function normalizeAlias(type: string): string {
  switch (type) {
    case 'multiselect':
      return 'multiSelect';
    case 'multicombobox':
      return 'multiCombobox';
    case 'colorPicker':
      return 'color';
    case 'maskedInput':
      return 'masked';
    default:
      return type;
  }
}

function notifyRegistrationListeners(): void {
  for (const listener of registrationListeners) {
    listener();
  }
}

/**
 * Registers a third-party field extension. Rendering resolves through the
 * existing path (`field.component` > hook `defaultComponents` > registered
 * extension > built-in registry > text fallback); the contract's validation,
 * serialization, builder metadata, accessibility obligations, AI-safety rules,
 * and semver declaration become available engine-wide.
 *
 * Throws a descriptive error for malformed or contract-incompatible
 * extensions. Re-registering the exact same extension object is a no-op;
 * registering a different extension under an already-registered type throws.
 */
export function registerFieldExtension(extension: FieldExtension): void {
  const schema = validateFieldExtension(extension);
  const existing = fieldExtensionRegistry.get(extension.type);

  if (existing !== undefined) {
    if (existing === extension) {
      return;
    }

    throw registrationError(`type \`${extension.type}\` is already registered by a different extension; unregister it first`);
  }

  fieldExtensionRegistry.set(extension.type, extension);
  fieldExtensionSchemas.set(extension, schema);
  notifyRegistrationListeners();
}

/** Removes a registered extension; returns whether one was registered. */
export function unregisterFieldExtension(type: string): boolean {
  const removed = fieldExtensionRegistry.delete(type);

  if (removed) {
    notifyRegistrationListeners();
  }

  return removed;
}

/** The extension registered for a type, when present. */
export function getFieldExtension(type: string): FieldExtension | undefined {
  return fieldExtensionRegistry.get(type);
}

/** All registered extensions. */
export function listFieldExtensions(): readonly FieldExtension[] {
  return [...fieldExtensionRegistry.values()];
}

/**
 * Subscribes to registration changes; the listener runs after every
 * registration and unregistration. Returns an unsubscribe function.
 */
export function subscribeToFieldExtensionRegistrations(listener: () => void): () => void {
  registrationListeners.add(listener);

  return () => {
    registrationListeners.delete(listener);
  };
}

/**
 * Deep JSON-safety assertion for wire values: only null, booleans, finite
 * numbers, strings, arrays, and plain objects may appear. `JSON.stringify`
 * silently drops functions, `undefined`, and symbol keys (and coerces Dates
 * and class instances), so stringification alone cannot catch a value that
 * would not round-trip — the structure is checked directly.
 */
function assertJsonSafeValue(value: unknown, describe: (path: string) => string): void {
  if (value === null) {
    return;
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`${describe('')} is a non-finite number, which JSON cannot carry`);
    }

    return;
  }

  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
    throw new Error(`${describe('')} has type ${typeof value}, which JSON cannot carry`);
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      assertJsonSafeValue(item, (path) => describe(`${path}[${index}]`));
    }

    return;
  }

  if (Object.getOwnPropertySymbols(value).length > 0) {
    throw new Error(`${describe('')} carries symbol keys, which JSON drops silently`);
  }

  const prototype = Object.getPrototypeOf(value);

  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${describe('')} is a class instance (${prototype.constructor?.name ?? 'unnamed'}), not a JSON structure`);
  }

  for (const [key, item] of Object.entries(value)) {
    assertJsonSafeValue(item, (path) => describe(`${path ? `${path}.` : ''}${key}`));
  }
}

/**
 * Serializes a live field value into the stable versioned wire envelope. The
 * extension's `toWire` output must be JSON-safe; the engine enforces this by
 * walking the structure and throwing loudly when any part of it could not
 * survive a JSON round-trip.
 */
export function serializeFieldExtensionValue(type: string, value: unknown): FieldExtensionWireValue {
  const extension = requireFieldExtension(type, 'serialize');
  let wireValue: unknown;

  try {
    wireValue = extension.valueSerialization.toWire(value);
  } catch (error: unknown) {
    throw new Error(`Field extension \`${type}\` failed to serialize a value: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    assertJsonSafeValue(wireValue, (path) => `Field extension \`${type}\` produced a wire value where \`${path || 'the root'}\``);
  } catch (error: unknown) {
    throw new Error(`${error instanceof Error ? error.message : String(error)} — the wire value must be JSON-safe`);
  }

  return {
    $field: 'formedible-field-extension',
    extensionType: type,
    contractVersion: FIELD_EXTENSION_CONTRACT_VERSION,
    serializationVersion: extension.valueSerialization.version,
    value: wireValue,
  };
}

/** Restores a live field value from the wire envelope produced by {@link serializeFieldExtensionValue}. */
export function deserializeFieldExtensionValue(type: string, wire: unknown): unknown {
  const extension = requireFieldExtension(type, 'deserialize');

  if (typeof wire !== 'object' || wire === null) {
    throw new Error(`Cannot deserialize field extension \`${type}\`: expected a wire envelope object, received ${JSON.stringify(wire)}`);
  }

  const envelope = wire as Partial<FieldExtensionWireValue>;

  if (envelope.$field !== 'formedible-field-extension' || envelope.extensionType !== type) {
    throw new Error(`Cannot deserialize field extension \`${type}\`: the wire envelope belongs to a different field`);
  }

  if (envelope.serializationVersion !== extension.valueSerialization.version) {
    throw new Error(
      `Cannot deserialize field extension \`${type}\`: wire serialization version ${JSON.stringify(envelope.serializationVersion)} does not match the registered version ${extension.valueSerialization.version}`,
    );
  }

  try {
    return extension.valueSerialization.fromWire(envelope.value);
  } catch (error: unknown) {
    throw new Error(`Field extension \`${type}\` failed to deserialize a wire value: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Applies the extension's AI-safety treatment to a value — the enforcement surface AI features call. */
export function treatFieldExtensionValueForAi(type: string, value: unknown): FieldExtensionAiTreatmentResult {
  const extension = requireFieldExtension(type, 'treat for AI');

  const { treatment } = extension.aiSafeRedactionRules;

  if (treatment === 'exclude') {
    return { treatment, value: undefined };
  }

  if (treatment === 'redact') {
    return { treatment, value: extension.aiSafeRedactionRules.redactWith ?? '[redacted]' };
  }

  return { treatment: 'include', value };
}

/**
 * The extension's validation schema for fields of its type — the memoized
 * `zodValidation.schemaFactory` product. Installed as the field's validation
 * when the field config declares none of its own.
 */
export function getFieldExtensionFieldValidation(fieldType: string): FormedibleFieldValidation<FormedibleFormValues> | undefined {
  const extension = fieldExtensionRegistry.get(fieldType);

  if (extension === undefined) {
    return undefined;
  }

  return fieldExtensionSchemas.get(extension) ?? validateFieldExtension(extension);
}

function requireFieldExtension(type: string, action: string): FieldExtension {
  const extension = fieldExtensionRegistry.get(type);

  if (extension === undefined) {
    throw new Error(`Cannot ${action} field extension \`${type}\`: no extension is registered for that type`);
  }

  return extension;
}

const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([disabled])';

function findControls(root: Element): readonly Element[] {
  return [...root.querySelectorAll(focusableSelector)];
}

function isFocusable(element: Element): boolean {
  if (element.hasAttribute('disabled')) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'button' || tagName === 'input' || tagName === 'select' || tagName === 'textarea' || (tagName === 'a' && element.hasAttribute('href'))) {
    return element.getAttribute('tabindex') !== '-1';
  }

  const tabIndex = element.getAttribute('tabindex');

  return tabIndex !== null && Number.parseInt(tabIndex, 10) >= 0;
}

function hasAccessibleName(root: Element, control: Element, association: FieldExtensionLabelAssociation): boolean {
  switch (association) {
    case 'htmlFor':
      return [...root.querySelectorAll('label[for]')].some((label) => {
        const target = label.getAttribute('for');

        return target !== null && target !== '' && root.querySelector(`#${cssEscape(target)}`) === control;
      });
    case 'wrapping-label': {
      let ancestor: Element | null = control.parentElement;

      while (ancestor !== null && ancestor !== root) {
        if (ancestor.tagName.toLowerCase() === 'label') {
          return true;
        }

        ancestor = ancestor.parentElement;
      }

      return false;
    }
    case 'aria-label':
      return isNonEmptyString(control.getAttribute('aria-label'));
    case 'aria-labelledby': {
      const labelledBy = control.getAttribute('aria-labelledby');

      if (labelledBy === null || labelledBy.trim() === '') {
        return false;
      }

      return labelledBy
        .split(/\s+/)
        .every((id) => root.querySelector(`#${cssEscape(id)}`) !== null);
    }
  }
}

function cssEscape(value: string): string {
  return value.replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

/**
 * Machine-checks the extension's declared accessibility obligations against
 * rendered markup: the focus target shape, the declared label association, the
 * declared ARIA patterns, and any extra `machineChecks`. The remainder of the
 * contract (`keyboardBehavior` prose, interaction semantics) is documented
 * obligation the engine cannot script — auditors assert those with their own
 * keyboard journeys.
 */
export function verifyFieldExtensionAccessibility(extension: FieldExtension, root: Element): readonly FieldExtensionAccessibilityFinding[] {
  const findings: FieldExtensionAccessibilityFinding[] = [];
  const obligations = extension.accessibilityObligations;
  const controls = findControls(root);
  const focusableControls = controls.filter(isFocusable);

  const focusPassed =
    obligations.focusTarget === 'roving-tabindex'
      ? controls.some((control) => control.getAttribute('tabindex') !== null)
      : focusableControls.length > 0;

  findings.push({
    check: 'focusable-control',
    passed: focusPassed,
    message: focusPassed
      ? `focus target \`${obligations.focusTarget}\` is reachable in the rendered field`
      : `no control satisfies the declared focus target \`${obligations.focusTarget}\``,
  });

  const labelledControls = focusableControls.filter((control) => hasAccessibleName(root, control, obligations.labelAssociation));
  const labelPassed = labelledControls.length > 0;
  const associationDescription: Record<FieldExtensionLabelAssociation, string> = {
    htmlFor: 'a `label[for]` resolving to the control',
    'wrapping-label': 'a `label` element wrapping the control',
    'aria-label': 'a non-empty `aria-label` on the control',
    'aria-labelledby': 'an `aria-labelledby` resolving inside the field',
  };

  findings.push({
    check: 'label-associated',
    passed: labelPassed,
    message: labelPassed
      ? `accessible name is associated through ${associationDescription[obligations.labelAssociation]}`
      : `no focusable control is named through ${associationDescription[obligations.labelAssociation]}`,
  });

  for (const pattern of obligations.ariaPatterns) {
    if (pattern.role !== undefined) {
      findings.push({
        check: `role:${pattern.role}`,
        passed: root.querySelector(`[role="${pattern.role}"]`) !== null,
        message: `declared ARIA pattern role \`${pattern.role}\` is present`,
      });
    }

    for (const attribute of pattern.attributes) {
      findings.push({
        check: `aria-attribute:${attribute}`,
        passed: root.querySelector(`[${attribute}]`) !== null,
        message: `declared ARIA attribute \`${attribute}\` is present`,
      });
    }
  }

  for (const check of obligations.machineChecks ?? []) {
    if (check.kind === 'aria-attribute') {
      findings.push({
        check: `aria-attribute:${check.attribute}`,
        passed: root.querySelector(`[${check.attribute}]`) !== null,
        message: `machine check requires \`${check.attribute}\` to be present`,
      });
    } else if (check.kind === 'role') {
      findings.push({
        check: `role:${check.role}`,
        passed: root.querySelector(`[role="${check.role}"]`) !== null,
        message: `machine check requires role \`${check.role}\` to be present`,
      });
    }
  }

  return findings;
}
