import type { FormField } from "@/lib/formedible/builder-types";

const FIELD_TYPES = [
  { value: "text", label: "Text Input", icon: "📝" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "password", label: "Password", icon: "🔒" },
  { value: "textarea", label: "Textarea", icon: "📄" },
  { value: "number", label: "Number", icon: "🔢" },
  { value: "select", label: "Select", icon: "📋" },
  { value: "radio", label: "Radio Group", icon: "⚪" },
  { value: "multiSelect", label: "Multi-Select", icon: "☑️" },
  { value: "checkbox", label: "Checkbox", icon: "✅" },
  { value: "switch", label: "Switch", icon: "🔘" },
  { value: "date", label: "Date Picker", icon: "📅" },
  { value: "slider", label: "Slider", icon: "🎚️" },
  { value: "rating", label: "Rating", icon: "⭐" },
  { value: "colorPicker", label: "Color Picker", icon: "🎨" },
  { value: "phone", label: "Phone Number", icon: "📞" },
  { value: "file", label: "File Upload", icon: "📎" },
  { value: "array", label: "Array Field", icon: "📚" },
];

// ISOLATED FIELD STORE - SEPARATE NOTIFICATIONS FOR STRUCTURE VS FIELD UPDATES
class FieldStore {
  private fields: Record<string, FormField> = {};
  private fieldOrder: string[] = [];
  private structureListeners: Set<() => void> = new Set(); // For add/delete/reorder
  private fieldUpdateCallbacks: Map<string, Set<(field: FormField) => void>> = new Map(); // Field-specific subscribers

  addField(type: string, selectedPage?: number): string {
    const id = `field_${Date.now()}`;
    const newField: FormField = {
      id,
      name: `field_${Object.keys(this.fields).length + 1}`,
      type,
      label: `${FIELD_TYPES.find((t) => t.value === type)?.label || type} Field`,
      required: false,
      page: selectedPage || 1,
    };
    
    this.fields[id] = newField;
    this.fieldOrder.push(id);
    this.notifyStructureListeners(); // Structure change
    return id;
  }

  updateField(fieldId: string, updatedField: FormField): void {
    this.fields[fieldId] = updatedField;
    // DO NOT notify structure listeners - field updates should not cause parent re-renders!
  }

  // Notify specific field subscribers
  notifyFieldUpdate(fieldId: string, field: FormField): void {
    const subscribers = this.fieldUpdateCallbacks.get(fieldId);
    if (subscribers) {
      subscribers.forEach(callback => callback(field));
    }
  }

  deleteField(fieldId: string): void {
    delete this.fields[fieldId];
    this.fieldOrder = this.fieldOrder.filter(id => id !== fieldId);
    this.notifyStructureListeners(); // Structure change
  }

  duplicateField(fieldId: string): string | null {
    const field = this.fields[fieldId];
    if (field) {
      const id = `field_${Date.now()}`;
      const newField: FormField = {
        ...field,
        id,
        name: `${field.name}_copy`,
        label: `${field.label} (Copy)`,
      };
      this.fields[id] = newField;
      this.fieldOrder.push(id);
      this.notifyStructureListeners(); // Structure change
      return id;
    }
    return null;
  }

  getField(fieldId: string): FormField | undefined {
    return this.fields[fieldId];
  }
  
  getAllFields(): FormField[] {
    return this.fieldOrder.map(id => this.fields[id]).filter(Boolean);
  }

  getFieldsByPage(page: number): FormField[] {
    return this.fieldOrder.map(id => this.fields[id]).filter(field => field && (field.page || 1) === page);
  }

  getFieldsByTab(tabId: string): FormField[] {
    return this.fieldOrder.map(id => this.fields[id]).filter(field => field && field.tab === tabId);
  }

  // Subscribe to structure changes only (add/delete/reorder)
  subscribe(listener: () => void): () => void {
    this.structureListeners.add(listener);
    return () => this.structureListeners.delete(listener);
  }

  // Subscribe to specific field updates
  subscribeToFieldUpdates(fieldId: string, callback: (field: FormField) => void): () => void {
    if (!this.fieldUpdateCallbacks.has(fieldId)) {
      this.fieldUpdateCallbacks.set(fieldId, new Set());
    }
    this.fieldUpdateCallbacks.get(fieldId)!.add(callback);
    
    return () => {
      const subscribers = this.fieldUpdateCallbacks.get(fieldId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.fieldUpdateCallbacks.delete(fieldId);
        }
      }
    };
  }

  private notifyStructureListeners(): void {
    this.structureListeners.forEach(listener => listener());
  }

  // Import/Export methods
  clear(): void {
    this.fields = {};
    this.fieldOrder = [];
    this.notifyStructureListeners();
  }

  importFields(fields: any[]): void {
    this.clear();
    fields.forEach((field: any) => {
      const newFieldId = this.addField(field.type, field.page || 1);
      const newField: FormField = {
        id: newFieldId,
        name: field.name,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        required: field.required || false,
        page: field.page || 1,
        group: field.group,
        section: field.section,
        help: field.help,
        inlineValidation: field.inlineValidation,
        options: field.options,
        arrayConfig: field.arrayConfig,
        datalist: field.datalist,
        multiSelectConfig: field.multiSelectConfig,
        colorConfig: field.colorConfig,
        ratingConfig: field.ratingConfig,
        phoneConfig: field.phoneConfig,
        sliderConfig: field.sliderConfig,
        numberConfig: field.numberConfig,
        dateConfig: field.dateConfig,
        fileConfig: field.fileConfig,
        textareaConfig: field.textareaConfig,
        passwordConfig: field.passwordConfig,
        emailConfig: field.emailConfig,
        validation: field.validation,
      };
      this.updateField(newFieldId, newField);
    });
  }
}

// Global field store instance
export const globalFieldStore = new FieldStore();
export type { FormField };