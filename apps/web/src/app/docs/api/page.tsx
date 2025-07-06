import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference - Formedible",
  description: "Complete API documentation for Formedible hooks, components, and utilities.",
};

export default function ApiPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-lg text-muted-foreground">
            Complete API documentation for all Formedible hooks, components, and utilities.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">useFormedible Hook</h2>
            <p className="mb-4">
              The main hook for creating forms with Formedible. Returns form components and utilities.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Signature</h3>
              <pre className="text-sm overflow-x-auto">
{`function useFormedible<TFormValues>(
  config: FormedibleConfig<TFormValues>
): FormedibleReturn<TFormValues>`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Configuration</h3>
              <pre className="text-sm overflow-x-auto">
{`interface FormedibleConfig<TFormValues> {
  // Required: Field definitions
  fields: FieldConfig[];
  
  // Optional: Zod schema for validation
  schema?: ZodSchema<TFormValues>;
  
  // Optional: TanStack Form options
  formOptions?: FormOptions<TFormValues>;
  
  // Optional: Cross-field validation
  crossFieldValidation?: CrossFieldValidation[];
  
  // Optional: Async validation
  asyncValidation?: Record<string, AsyncValidationConfig>;
  
  // Optional: Form persistence
  persistence?: PersistenceConfig;
  
  // Optional: Analytics tracking
  analytics?: AnalyticsConfig;
  
  // Optional: Layout configuration
  layout?: LayoutConfig;
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Return Value</h3>
              <pre className="text-sm overflow-x-auto">
{`interface FormedibleReturn<TFormValues> {
  // Main form component
  Form: React.ComponentType;
  
  // TanStack Form instance
  form: FormApi<TFormValues>;
  
  // Cross-field validation errors
  crossFieldErrors: Record<string, string>;
  
  // Async validation states
  asyncValidationStates: Record<string, AsyncValidationState>;
  
  // Multi-page navigation
  currentPage: number;
  totalPages: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToPage: (page: number) => void;
  
  // Persistence utilities
  saveToStorage: (data: Partial<TFormValues>) => void;
  loadFromStorage: () => SavedFormData<TFormValues> | null;
  clearStorage: () => void;
  
  // Async validation utilities
  validateFieldAsync: (fieldName: string, value: any) => Promise<void>;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Field Configuration</h2>
            <p className="mb-4">
              Each field in the fields array follows this configuration structure:
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Base Field Config</h3>
              <pre className="text-sm overflow-x-auto">
{`interface BaseFieldConfig {
  // Required
  name: string;
  type: FieldType;
  label: string;
  
  // Optional
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  wrapperClassName?: string;
  
  // Multi-page support
  page?: number;
  
  // Conditional rendering
  condition?: (values: any) => boolean;
  
  // Help text
  help?: {
    text: string;
    tooltip?: string;
  };
  
  // Validation
  validation?: ZodSchema;
}`}
              </pre>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <h3 className="font-semibold mb-2">Field Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Basic Fields</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>text</code> - Text input</li>
                    <li>• <code>email</code> - Email input</li>
                    <li>• <code>password</code> - Password input</li>
                    <li>• <code>number</code> - Number input</li>
                    <li>• <code>tel</code> - Phone input</li>
                    <li>• <code>url</code> - URL input</li>
                    <li>• <code>textarea</code> - Multi-line text</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Selection Fields</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>select</code> - Dropdown select</li>
                    <li>• <code>multiSelect</code> - Multi-select</li>
                    <li>• <code>radio</code> - Radio buttons</li>
                    <li>• <code>checkbox</code> - Checkbox</li>
                    <li>• <code>switch</code> - Toggle switch</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Advanced Fields</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>date</code> - Date picker</li>
                    <li>• <code>file</code> - File upload</li>
                    <li>• <code>slider</code> - Range slider</li>
                    <li>• <code>rating</code> - Star rating</li>
                    <li>• <code>color</code> - Color picker</li>
                    <li>• <code>array</code> - Dynamic arrays</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Specialized Fields</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <code>location</code> - Location picker</li>
                    <li>• <code>duration</code> - Duration input</li>
                    <li>• <code>autocomplete</code> - Autocomplete</li>
                    <li>• <code>masked</code> - Masked input</li>
                    <li>• <code>phone</code> - Phone number</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Validation Configuration</h2>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Cross-Field Validation</h3>
                <pre className="text-sm overflow-x-auto">
{`interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => string | null;
  message: string;
}`}
                </pre>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Async Validation</h3>
                <pre className="text-sm overflow-x-auto">
{`interface AsyncValidationConfig {
  validator: (value: any) => Promise<string | null>;
  debounceMs?: number;
  loadingMessage?: string;
}`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Persistence Configuration</h2>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`interface PersistenceConfig {
  key: string;
  storage: 'localStorage' | 'sessionStorage';
  debounceMs?: number;
  exclude?: string[];
  restoreOnMount?: boolean;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Analytics Configuration</h2>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`interface AnalyticsConfig {
  onFormStart?: (timestamp: number) => void;
  onFormComplete?: (timeSpent: number, formData: any) => void;
  onFormAbandon?: (completionPercentage: number) => void;
  onFieldFocus?: (fieldName: string, timestamp: number) => void;
  onFieldBlur?: (fieldName: string, timeSpent: number) => void;
  onFieldChange?: (fieldName: string, value: any, timestamp: number) => void;
  onPageChange?: (fromPage: number, toPage: number, timeSpent: number) => void;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Testing Utilities</h2>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">createFormTester</h3>
              <pre className="text-sm overflow-x-auto">
{`function createFormTester<TFormValues>(
  config: FormedibleConfig<TFormValues>,
  container?: HTMLElement
): FormTester<TFormValues>

interface FormTester<TFormValues> {
  render(): Promise<FormActions<TFormValues>>;
  setFormInstance(form: FormApi<TFormValues>): void;
}

interface FormActions<TFormValues> {
  // Field interactions
  fillField(name: string, value: any): Promise<void>;
  fillFields(values: Partial<TFormValues>): Promise<void>;
  triggerFieldFocus(name: string): Promise<void>;
  triggerFieldBlur(name: string): Promise<void>;
  
  // Form actions
  submitForm(): Promise<void>;
  resetForm(): Promise<void>;
  getFormData(): TFormValues;
  
  // Navigation
  goToPage(page: number): Promise<void>;
  nextPage(): Promise<void>;
  previousPage(): Promise<void>;
  
  // Assertions
  expectError(fieldName: string, message?: string): void;
  expectNoError(fieldName: string): void;
  expectValid(): void;
  expectInvalid(): void;
  expectFieldValue(fieldName: string, value: any): void;
  expectCurrentPage(page: number): void;
  
  // Async validation
  waitForAsyncValidation(fieldName: string): Promise<void>;
}`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Type Definitions</h2>
            
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`// Main types exported by Formedible
export type {
  FormedibleConfig,
  FormedibleReturn,
  FieldConfig,
  BaseFieldConfig,
  CrossFieldValidation,
  AsyncValidationConfig,
  PersistenceConfig,
  AnalyticsConfig,
  LayoutConfig,
  FormTester,
  FormActions
};

// Field-specific types
export type {
  TextFieldConfig,
  SelectFieldConfig,
  DateFieldConfig,
  FileFieldConfig,
  LocationFieldConfig,
  DurationFieldConfig,
  AutocompleteFieldConfig,
  MaskedInputFieldConfig
};`}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}