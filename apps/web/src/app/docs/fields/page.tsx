import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Field Types - Formedible",
  description: "Complete guide to all available field types and their configurations in Formedible.",
};

export default function FieldsPage() {
  return (
    <div className="min-h-screen bg-background">
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
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                15+ Beautiful Field Components
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explore our comprehensive collection of pre-built field components. 
                Each field comes with built-in validation, accessibility features, and beautiful styling.
              </p>
            </div>

            <Card className="bg-gradient-to-r from-secondary to-accent/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    🎨 Fully Customizable
                  </h3>
                  <p className="text-foreground text-sm">
                    Every field supports custom styling, validation rules, and behavior modifications
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Input Fields</CardTitle>
                <CardDescription>
                  Standard input components for text, email, numbers, and multi-line content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Text Field</CardTitle>
                    <CardDescription>
                      Standard text input for single-line text entry.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`{ name: 'firstName', type: 'text', label: 'First Name' }`}
                      language="tsx"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Email Field</CardTitle>
                    <CardDescription>
                      Email input with built-in validation and appropriate keyboard on mobile.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CodeBlock 
                      code={`{ name: 'email', type: 'email', label: 'Email Address' }`}
                      language="tsx"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Number Field</CardTitle>
                    <CardDescription>
                      Numeric input with step controls and validation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Textarea Field</CardTitle>
                    <CardDescription>
                      Multi-line text input with configurable rows and resize options.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selection Fields</CardTitle>
                <CardDescription>
                  Components for single and multiple selections with various UI patterns.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Field</CardTitle>
                    <CardDescription>
                      Dropdown select with single selection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Radio Field</CardTitle>
                    <CardDescription>
                      Radio button group for single selection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Checkbox Field</CardTitle>
                    <CardDescription>
                      Single checkbox for boolean values.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Fields</CardTitle>
                <CardDescription>
                  Specialized components for dates, files, sliders, and more complex interactions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Date Field</CardTitle>
                    <CardDescription>
                      Date picker with calendar interface.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">File Upload Field</CardTitle>
                    <CardDescription>
                      File upload with drag-and-drop support and preview.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Slider Field</CardTitle>
                    <CardDescription>
                      Range slider for numeric values with visual feedback.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
                <CardDescription>
                  Guidelines for effective form design and field selection.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Field Selection</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the most appropriate field type for your data to improve user experience and validation.
                  </p>
                </div>
                
                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">Labels & Placeholders</h3>
                  <p className="text-sm text-muted-foreground">
                    Use clear, descriptive labels and helpful placeholder text to guide users.
                  </p>
                </div>
                
                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Validation</h3>
                  <p className="text-sm text-muted-foreground">
                    Combine field-level validation with form-level validation for comprehensive error handling.
                  </p>
                </div>
                
                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">Accessibility</h3>
                  <p className="text-sm text-muted-foreground">
                    All fields include proper ARIA attributes and keyboard navigation support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}