import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/code-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Reference - Formedible",
  description: "Complete API documentation for Formedible hooks, components, and utilities.",
};

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/docs">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Docs
                </Link>
              </Button>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-4">API Reference</h1>
              <p className="text-lg text-muted-foreground">
                Complete API documentation for all Formedible hooks, components, and utilities.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>useFormedible Hook</CardTitle>
                <CardDescription>
                  The main hook for creating forms with Formedible. Returns form components and utilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Signature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`function useFormedible<TFormValues>(
  config: FormedibleConfig<TFormValues>
): FormedibleReturn<TFormValues>`}
                      language="typescript"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`interface FormedibleConfig<TFormValues> {
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
                      language="typescript"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Return Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`interface FormedibleReturn<TFormValues> {
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
                      language="typescript"
                    />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Field Configuration</CardTitle>
                <CardDescription>
                  Each field in the fields array follows this configuration structure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Base Field Config</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`interface BaseFieldConfig {
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
                      language="typescript"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Field Types</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Validation Configuration</CardTitle>
                <CardDescription>
                  Configure cross-field and async validation for complex form requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cross-Field Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => string | null;
  message: string;
}`}
                      language="typescript"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Async Validation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`interface AsyncValidationConfig {
  validator: (value: any) => Promise<string | null>;
  debounceMs?: number;
  loadingMessage?: string;
}`}
                      language="typescript"
                    />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Persistence Configuration</CardTitle>
                <CardDescription>
                  Configure form data persistence to localStorage or sessionStorage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`interface PersistenceConfig {
  key: string;
  storage: 'localStorage' | 'sessionStorage';
  debounceMs?: number;
  exclude?: string[];
  restoreOnMount?: boolean;
}`}
                  language="typescript"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Configuration</CardTitle>
                <CardDescription>
                  Track form interactions and user behavior for insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`interface AnalyticsConfig {
  onFormStart?: (timestamp: number) => void;
  onFormComplete?: (timeSpent: number, formData: any) => void;
  onFormAbandon?: (completionPercentage: number) => void;
  onFieldFocus?: (fieldName: string, timestamp: number) => void;
  onFieldBlur?: (fieldName: string, timeSpent: number) => void;
  onFieldChange?: (fieldName: string, value: any, timestamp: number) => void;
  onPageChange?: (fromPage: number, toPage: number, timeSpent: number) => void;
}`}
                  language="typescript"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Testing Utilities</CardTitle>
                <CardDescription>
                  Utilities for testing forms in your test suites.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">createFormTester</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock
                      code={`function createFormTester<TFormValues>(
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
                      language="typescript"
                    />
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Type Definitions</CardTitle>
                <CardDescription>
                  All TypeScript types exported by Formedible for type-safe development.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`// Main types exported by Formedible
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
                  language="typescript"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}