import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Field Types - Formedible",
  description: "Complete guide to all available field types and their configurations in Formedible.",
};

export default function FieldsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
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
            
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <Layers className="w-3 h-3 mr-1" />
                Field Types
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-purple-800 dark:from-slate-100 dark:to-purple-200 bg-clip-text text-transparent">
                15+ Beautiful Field Components
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explore our comprehensive collection of pre-built field components. 
                Each field comes with built-in validation, accessibility features, and beautiful styling.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  🎨 Fully Customizable
                </h3>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  Every field supports custom styling, validation rules, and behavior modifications
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Basic Input Fields</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Text Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Standard text input for single-line text entry.
                  </p>
                  <CodeBlock 
                    code={`{ name: 'firstName', type: 'text', label: 'First Name' }`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Email Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Email input with built-in validation and appropriate keyboard on mobile.
                  </p>
                  <CodeBlock 
                    code={`{ name: 'email', type: 'email', label: 'Email Address' }`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Number Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Numeric input with step controls and validation.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'age',
  type: 'number',
  label: 'Age',
  numberConfig: {
    min: 0,
    max: 120,
    step: 1
  }
}`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Textarea Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Multi-line text input with configurable rows and resize options.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'message',
  type: 'textarea',
  label: 'Message',
  textareaConfig: {
    rows: 4,
    resize: 'vertical'
  }
}`}
                    language="tsx"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Selection Fields</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Select Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Dropdown select with single selection.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'country',
  type: 'select',
  label: 'Country',
  selectConfig: {
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' }
    ],
    placeholder: 'Select a country'
  }
}`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Radio Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Radio button group for single selection.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'plan',
  type: 'radio',
  label: 'Subscription Plan',
  radioConfig: {
    options: [
      { value: 'basic', label: 'Basic - $9/month' },
      { value: 'pro', label: 'Pro - $19/month' },
      { value: 'enterprise', label: 'Enterprise - $49/month' }
    ],
    orientation: 'vertical'
  }
}`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Checkbox Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Single checkbox for boolean values.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'terms',
  type: 'checkbox',
  label: 'I agree to the terms and conditions',
  checkboxConfig: {
    required: true
  }
}`}
                    language="tsx"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Advanced Fields</h2>
              
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Date Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Date picker with calendar interface.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'birthDate',
  type: 'date',
  label: 'Birth Date',
  dateConfig: {
    format: 'yyyy-MM-dd',
    placeholder: 'Select your birth date'
  }
}`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">File Upload Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    File upload with drag-and-drop support and preview.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'avatar',
  type: 'file',
  label: 'Profile Picture',
  fileConfig: {
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    showPreview: true
  }
}`}
                    language="tsx"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Slider Field</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Range slider for numeric values with visual feedback.
                  </p>
                  <CodeBlock 
                    code={`{
  name: 'budget',
  type: 'slider',
  label: 'Budget Range',
  sliderConfig: {
    min: 0,
    max: 10000,
    step: 100,
    formatValue: (value) => \`$\${value}\`
  }
}`}
                    language="tsx"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Best Practices</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">Field Selection</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the most appropriate field type for your data to improve user experience and validation.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold">Labels & Placeholders</h3>
                  <p className="text-sm text-muted-foreground">
                    Use clear, descriptive labels and helpful placeholder text to guide users.
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-semibold">Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Combine field-level validation with form-level validation for comprehensive error handling.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold">Accessibility</h3>
                  <p className="text-sm text-muted-foreground">
                    All fields include proper ARIA attributes and keyboard navigation support.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}