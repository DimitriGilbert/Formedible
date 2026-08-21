import { createContext, useContext } from 'react';

import type { FormedibleFieldType } from '@formedible/ui/components/formedible/lib/types';
import { builderFieldTypes } from '@formedible/ui/components/formedible/lib/builder-types';
import type { FormField } from '@formedible/ui/components/formedible/lib/builder-types';

type StructureListener = () => void;
type FieldListener = (field: FormField) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]));
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key]));
  }

  return false;
}

export class FieldStore {
  private fields: Record<string, FormField> = {};
  private fieldOrder: string[] = [];
  private fieldSnapshot: readonly FormField[] = [];
  private structureListeners = new Set<StructureListener>();
  private fieldListeners = new Map<string, Set<FieldListener>>();
  private nextId = 1;

  addField(type: FormedibleFieldType, selectedPage = 1): string {
    const id = this.createNextFieldId();

    const label = builderFieldTypes.find((fieldType) => fieldType.value === type)?.label ?? type;
    const field: FormField = {
      id,
      name: this.createNextFieldName(),
      type,
      label: `${label} Field`,
      required: false,
      page: selectedPage,
      ...this.defaultConfigForType(type),
    };

    this.fields[id] = field;
    this.fieldOrder.push(id);
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();

    return id;
  }

  updateField(fieldId: string, fieldUpdate: Partial<FormField>): FormField | undefined {
    const currentField = this.fields[fieldId];

    if (currentField === undefined) {
      return undefined;
    }

    this.assertNameAvailable(fieldId, fieldUpdate.name, currentField.name);

    const updatedField: FormField = { ...currentField, ...fieldUpdate, id: fieldId };
    this.fields[fieldId] = updatedField;
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();
    this.notifyFieldListeners(fieldId, updatedField);

    return updatedField;
  }

  replaceField(fieldId: string, field: FormField): FormField {
    this.assertNameAvailable(fieldId, field.name, this.fields[fieldId]?.name);

    const updatedField = { ...field, id: fieldId };
    const isNewField = !this.fieldOrder.includes(fieldId);
    this.fields[fieldId] = updatedField;

    if (isNewField) {
      this.fieldOrder.push(fieldId);
    }

    this.advanceNextIdFromFieldId(fieldId);
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();
    this.notifyFieldListeners(fieldId, updatedField);

    return updatedField;
  }

  deleteField(fieldId: string): void {
    if (this.fields[fieldId] === undefined) {
      return;
    }

    delete this.fields[fieldId];
    this.fieldOrder = this.fieldOrder.filter((id) => id !== fieldId);
    this.fieldListeners.delete(fieldId);
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();
  }

  duplicateField(fieldId: string): string | null {
    const field = this.fields[fieldId];

    if (field === undefined) {
      return null;
    }

    const id = this.createNextFieldId();

    this.fields[id] = {
      ...field,
      id,
      name: this.createUniqueCopyName(field.name),
      label: `${String(field.label)} (Copy)`,
    };
    this.fieldOrder.push(id);
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();

    return id;
  }

  getField(fieldId: string): FormField | undefined {
    return this.fields[fieldId];
  }

  getAllFields(): readonly FormField[] {
    return this.fieldSnapshot;
  }

  getFieldsByPage(page: number): readonly FormField[] {
    return this.getAllFields().filter((field) => (field.page ?? 1) === page);
  }

  getFieldsByTab(tabId: string): readonly FormField[] {
    return this.getAllFields().filter((field) => field.tab === tabId);
  }

  subscribe(listener: StructureListener): () => void {
    this.structureListeners.add(listener);

    return () => {
      this.structureListeners.delete(listener);
    };
  }

  subscribeToFieldUpdates(fieldId: string, listener: FieldListener): () => void {
    const fieldListenerSet = this.fieldListeners.get(fieldId) ?? new Set<FieldListener>();
    fieldListenerSet.add(listener);
    this.fieldListeners.set(fieldId, fieldListenerSet);

    return () => {
      fieldListenerSet.delete(listener);

      if (fieldListenerSet.size === 0) {
        this.fieldListeners.delete(fieldId);
      }
    };
  }

  importFields(fields: readonly FormField[]): void {
    if (deepEqual(fields, this.fieldSnapshot)) {
      return;
    }

    this.fields = {};
    this.fieldOrder = [];
    this.nextId = 1;

    for (const field of fields) {
      const id = field.id.length > 0 ? field.id : this.createNextFieldId();
      this.fields[id] = { ...field, id };
      this.fieldOrder.push(id);
      this.advanceNextIdFromFieldId(id);
    }

    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();
  }

  clear(): void {
    this.fields = {};
    this.fieldOrder = [];
    this.fieldSnapshot = [];
    this.fieldListeners.clear();
    this.nextId = 1;
    this.notifyStructureListeners();
  }

  private createNextFieldId(): string {
    let id = `field_${this.nextId}`;

    while (this.fields[id] !== undefined) {
      this.nextId += 1;
      id = `field_${this.nextId}`;
    }

    this.nextId += 1;

    return id;
  }

  private assertNameAvailable(fieldId: string, requestedName: string | undefined, currentName: string | undefined): void {
    if (requestedName === undefined || requestedName === currentName) {
      return;
    }

    for (const [existingId, existingField] of Object.entries(this.fields)) {
      if (existingId !== fieldId && existingField.name === requestedName) {
        throw new Error(
          `Cannot use field name "${requestedName}" for field "${currentName ?? fieldId}" (${fieldId}): field "${existingField.name}" (${existingId}) already uses that name. Field names must be unique.`,
        );
      }
    }
  }

  private createNextFieldName(): string {
    const namesInUse = this.collectFieldNames();
    let counter = 1;

    while (namesInUse.has(`field_${counter}`)) {
      counter += 1;
    }

    return `field_${counter}`;
  }

  private createUniqueCopyName(baseName: string): string {
    const namesInUse = this.collectFieldNames();
    const baseCopyName = `${baseName}_copy`;

    if (!namesInUse.has(baseCopyName)) {
      return baseCopyName;
    }

    let counter = 2;

    while (namesInUse.has(`${baseCopyName}_${counter}`)) {
      counter += 1;
    }

    return `${baseCopyName}_${counter}`;
  }

  private collectFieldNames(): Set<string> {
    const names = new Set<string>();

    for (const fieldId of this.fieldOrder) {
      const field = this.fields[fieldId];

      if (field !== undefined) {
        names.add(field.name);
      }
    }

    return names;
  }

  private advanceNextIdFromFieldId(fieldId: string): void {
    const match = /^field_(\d+)$/.exec(fieldId);

    if (match === null) {
      return;
    }

    const numericId = Number.parseInt(match[1] ?? '', 10);

    if (Number.isSafeInteger(numericId) && numericId >= this.nextId) {
      this.nextId = numericId + 1;
    }
  }

  private rebuildFieldSnapshot(): void {
    this.fieldSnapshot = this.fieldOrder.map((id) => this.fields[id]).filter((field): field is FormField => field !== undefined);
  }

  private notifyStructureListeners(): void {
    for (const listener of this.structureListeners) {
      listener();
    }
  }

  private notifyFieldListeners(fieldId: string, field: FormField): void {
    const listeners = this.fieldListeners.get(fieldId);

    if (listeners === undefined) {
      return;
    }

    for (const listener of listeners) {
      listener(field);
    }
  }

  private defaultConfigForType(type: FormedibleFieldType): Partial<FormField> {
    if (type === 'select' || type === 'radio' || type === 'multiSelect' || type === 'combobox' || type === 'multiCombobox') {
      return {
        options: [
          { label: 'Option 1', value: 'option_1' },
          { label: 'Option 2', value: 'option_2' },
        ],
      };
    }

    if (type === 'autocomplete') {
      return {
        autocompleteConfig: {
          options: [
            { label: 'Suggestion 1', value: 'suggestion_1' },
            { label: 'Suggestion 2', value: 'suggestion_2' },
          ],
        },
      };
    }

    if (type === 'array') {
      return { arrayConfig: { itemType: 'string', itemLabel: 'Item', sortable: true } };
    }

    if (type === 'object') {
      return { objectConfig: { layout: 'stack', columns: 1, fields: [] } };
    }

    return {};
  }
}

export const globalFieldStore = new FieldStore();

export const FieldStoreContext = createContext<FieldStore | null>(null);

export function useFieldStore(): FieldStore {
  return useContext(FieldStoreContext) ?? globalFieldStore;
}

export type { FormField };
