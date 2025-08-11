import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/code-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Code, Database, Settings, Shield, Layers } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Reference - Formedible",
  description: "Complete API documentation for Formedible hooks, components, and utilities.",
};

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
            
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <Code className="w-3 h-3 mr-1" />
                API Reference
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Complete API Documentation
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to know about Formedible hooks, components, and utilities. 
                Build powerful, type-safe forms with comprehensive configuration options.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Hooks & Config</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Type Definitions</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Code className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Testing Utils</span>
              </div>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="space-y-12">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">useFormedible Hook</CardTitle>
                    <CardDescription className="text-base">The main hook for creating forms with Formedible. Returns form components and utilities.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Signature</h3>
                  <CodeBlock
                    code={`function useFormedible<TFormValues>(
  config: FormedibleConfig<TFormValues>
): FormedibleReturn<TFormValues>`}
                    language="typescript"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Configuration</h3>
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
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Return Value</h3>
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
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Layers className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Field Configuration</CardTitle>
                    <CardDescription className="text-base">Each field in the fields array follows this configuration structure.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Base Field Config</h3>
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
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Field Types</h3>
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
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Validation Configuration</CardTitle>
                    <CardDescription className="text-base">Configure cross-field and async validation for complex form requirements.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Cross-Field Validation</h3>
                  <CodeBlock
                    code={`interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => string | null;
  message: string;
}`}
                    language="typescript"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Async Validation</h3>
                  <CodeBlock
                    code={`interface AsyncValidationConfig {
  validator: (value: any) => Promise<string | null>;
  debounceMs?: number;
  loadingMessage?: string;
}`}
                    language="typescript"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Persistence Configuration</CardTitle>
                    <CardDescription className="text-base">Configure form data persistence to localStorage or sessionStorage.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Code className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Analytics Configuration</CardTitle>
                    <CardDescription className="text-base">Track form interactions and user behavior for insights.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Testing Utilities</CardTitle>
                    <CardDescription className="text-base">Utilities for testing forms in your test suites.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">createFormTester</h3>
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
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Type Definitions</CardTitle>
                    <CardDescription className="text-base">All TypeScript types exported by Formedible for type-safe development.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
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

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Build Amazing Forms?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Now that you know the API, start building powerful forms with Formedible. 
              Create beautiful, type-safe forms with comprehensive validation and features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/docs/getting-started">
                  Get Started
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/builder">
                  Try Builder
                </Link>
              </Button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}