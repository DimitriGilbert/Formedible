interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  page?: number;
  tab?: string;
  group?: string;
  section?: {
    title: string;
    description?: string;
    collapsible?: boolean;
    defaultExpanded?: boolean;
  };
  help?: {
    text?: string;
    tooltip?: string;
    position?: "top" | "bottom" | "left" | "right";
    link?: { url: string; text: string };
  };
  inlineValidation?: {
    enabled?: boolean;
    debounceMs?: number;
    showSuccess?: boolean;
  };
  options?: Array<{ value: string; label: string }>;
  arrayConfig?: any;
  datalist?: any;
  multiSelectConfig?: {
    placeholder?: string;
    searchable?: boolean;
    maxSelections?: number;
    creatable?: boolean;
  };
  colorConfig?: any;
  ratingConfig?: any;
  phoneConfig?: any;
  sliderConfig?: any;
  numberConfig?: any;
  dateConfig?: any;
  fileConfig?: any;
  textareaConfig?: any;
  passwordConfig?: any;
  emailConfig?: any;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string;
    includes?: string;
    startsWith?: string;
    endsWith?: string;
    email?: boolean;
    url?: boolean;
    uuid?: boolean;
    transform?: string;
    refine?: string;
    customMessages?: Record<string, string>;
  };
}

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
  private fieldUpdateCallbacks: Set<() => void> = new Set(); // For field property updates

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
    this.notifyFieldUpdateCallbacks();
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

  // Subscribe to field updates (for components that need fresh field data)
  subscribeToFieldUpdates(callback: () => void): () => void {
    this.fieldUpdateCallbacks.add(callback);
    return () => this.fieldUpdateCallbacks.delete(callback);
  }

  private notifyStructureListeners(): void {
    this.structureListeners.forEach(listener => listener());
  }

  private notifyFieldUpdateCallbacks(): void {
    this.fieldUpdateCallbacks.forEach(callback => callback());
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