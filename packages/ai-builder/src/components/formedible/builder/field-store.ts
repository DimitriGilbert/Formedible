import type { FormedibleFieldType } from '@/lib/formedible/types';
import { builderFieldTypes } from '@/lib/formedible/builder-types';
import type { FormField } from '@/lib/formedible/builder-types';

type StructureListener = () => void;
type FieldListener = (field: FormField) => void;

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
      name: `field_${this.fieldOrder.length + 1}`,
      type,
      label: `${label} Field`,
      required: false,
      page: selectedPage,
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

    const updatedField: FormField = { ...currentField, ...fieldUpdate, id: fieldId };
    this.fields[fieldId] = updatedField;
    this.rebuildFieldSnapshot();
    this.notifyStructureListeners();
    this.notifyFieldListeners(fieldId, updatedField);

    return updatedField;
  }

  replaceField(fieldId: string, field: FormField): FormField {
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
      name: `${field.name}_copy`,
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
}

export const globalFieldStore = new FieldStore();
export type { FormField };
