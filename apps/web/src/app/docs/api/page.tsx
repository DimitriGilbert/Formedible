import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/code-block";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocCard } from "@/components/doc-card";
import {
  ArrowLeft,
  Code,
  Database,
  Settings,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

export const metadata: Metadata = {
  title: "API Reference - Formedible",
  description:
    "Complete API documentation for Formedible hooks, components, and utilities.",
};

export default function ApiPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = currentTheme === 'dark';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
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
                Everything you need to know about Formedible hooks, components,
                and utilities. Build powerful, type-safe forms with
                comprehensive configuration options.
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
            <DocCard
              title="useFormedible Hook"
              description="The main hook for creating forms with Formedible. Returns form components and utilities."
              icon={Settings}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Signature</h3>
                  <CodeBlock
                    code={`function useFormedible<TFormValues>(
  config: FormedibleConfig<TFormValues>
): FormedibleReturn<TFormValues>`}
                    language="typescript"
                    darkMode={darkMode}
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
                    darkMode={darkMode}
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
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Field Configuration"
              description="Each field in the fields array follows this configuration structure."
              icon={Layers}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Base Field Config
                  </h3>
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
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Field Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Basic Fields</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • <code>text</code> - Text input
                        </li>
                        <li>
                          • <code>email</code> - Email input
                        </li>
                        <li>
                          • <code>password</code> - Password input
                        </li>
                        <li>
                          • <code>number</code> - Number input
                        </li>
                        <li>
                          • <code>tel</code> - Phone input
                        </li>
                        <li>
                          • <code>url</code> - URL input
                        </li>
                        <li>
                          • <code>textarea</code> - Multi-line text
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Selection Fields</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • <code>select</code> - Dropdown select
                        </li>
                        <li>
                          • <code>multiSelect</code> - Multi-select
                        </li>
                        <li>
                          • <code>radio</code> - Radio buttons
                        </li>
                        <li>
                          • <code>checkbox</code> - Checkbox
                        </li>
                        <li>
                          • <code>switch</code> - Toggle switch
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Advanced Fields</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • <code>date</code> - Date picker
                        </li>
                        <li>
                          • <code>file</code> - File upload
                        </li>
                        <li>
                          • <code>slider</code> - Range slider
                        </li>
                        <li>
                          • <code>rating</code> - Star rating
                        </li>
                        <li>
                          • <code>color</code> - Color picker
                        </li>
                        <li>
                          • <code>array</code> - Dynamic arrays
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Specialized Fields</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>
                          • <code>location</code> - Location picker
                        </li>
                        <li>
                          • <code>duration</code> - Duration input
                        </li>
                        <li>
                          • <code>autocomplete</code> - Autocomplete
                        </li>
                        <li>
                          • <code>masked</code> - Masked input
                        </li>
                        <li>
                          • <code>phone</code> - Phone number
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Validation Configuration"
              description="Configure cross-field and async validation for complex form requirements."
              icon={Shield}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Cross-Field Validation
                  </h3>
                  <CodeBlock
                    code={`interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => string | null;
  message: string;
}`}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Async Validation
                  </h3>
                  <CodeBlock
                    code={`interface AsyncValidationConfig {
  validator: (value: any) => Promise<string | null>;
  debounceMs?: number;
  loadingMessage?: string;
}`}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Persistence Configuration"
              description="Configure form data persistence to localStorage or sessionStorage."
              icon={Database}
            >
              <CodeBlock
                code={`interface PersistenceConfig {
  key: string;
  storage: 'localStorage' | 'sessionStorage';
  debounceMs?: number;
  exclude?: string[];
  restoreOnMount?: boolean;
}`}
                language="typescript"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Analytics Configuration"
              description="Track form interactions and user behavior for insights."
              icon={Code}
            >
              <CodeBlock
                code={`interface AnalyticsConfig {
  // Form lifecycle events
  onFormStart?: (timestamp: number) => void;
  onFormComplete?: (timeSpent: number, formData: any) => void;
  onFormAbandon?: (completionPercentage: number, context?: any) => void;
  
  // Field interaction events
  onFieldFocus?: (fieldName: string, timestamp: number) => void;
  onFieldBlur?: (fieldName: string, timeSpent: number) => void;
  onFieldChange?: (fieldName: string, value: any, timestamp: number) => void;
  onFieldError?: (fieldName: string, errors: string[], timestamp: number) => void;
  onFieldComplete?: (fieldName: string, isValid: boolean, timeSpent: number) => void;
  
  // Multi-page/tab form events
  onPageChange?: (fromPage: number, toPage: number, timeSpent: number, context?: any) => void;
  onTabChange?: (fromTab: string, toTab: string, timeSpent: number, context?: any) => void;
  onTabFirstVisit?: (tabId: string, timestamp: number) => void;
  
  // Performance tracking
  onSubmissionPerformance?: (totalTime: number, validationTime: number, processingTime: number) => void;
}`}
                language="typescript"
                darkMode={darkMode}
              />
            </DocCard>

            <DocCard
              title="Type Definitions"
              description="All TypeScript types exported by Formedible for type-safe development."
              icon={Database}
            >
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
                darkMode={darkMode}
              />
            </DocCard>
          </div>

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Amazing Forms?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Now that you know the API, start building powerful forms with
                Formedible. Create beautiful, type-safe forms with comprehensive
                validation and features.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/docs/getting-started">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/builder">Try Builder</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
