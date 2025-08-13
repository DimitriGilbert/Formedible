import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Layers, Palette, Shield, Sparkles } from "lucide-react";
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
                <Layers className="w-3 h-3 mr-1" />
                Field Types
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                20+ Beautiful Field Components
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Explore our comprehensive collection of pre-built field components. 
                Each field comes with built-in validation, accessibility features, and beautiful styling.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Fully Customizable</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Built-in Validation</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Accessible by Default</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <Layers className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Basic Input Fields</CardTitle>
                    <CardDescription className="text-base">
                      Standard input components for text, email, numbers, and multi-line content.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Text Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Standard text input for single-line text entry.
                    </p>
                    <CodeBlock 
                      code={`{ name: 'firstName', type: 'text', label: 'First Name' }`}
                      language="tsx"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Email Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Email input with built-in validation and appropriate keyboard on mobile.
                    </p>
                    <CodeBlock 
                      code={`{ name: 'email', type: 'email', label: 'Email Address' }`}
                      language="tsx"
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Number Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Textarea Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Selection Fields</CardTitle>
                    <CardDescription className="text-base">
                      Components for single and multiple selections with various UI patterns.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Select Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Radio Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Checkbox Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <Palette className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Advanced Fields</CardTitle>
                    <CardDescription className="text-base">
                      Specialized components for dates, files, sliders, and more complex interactions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Date Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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

                  <div>
                    <h4 className="font-semibold text-lg mb-2">File Upload Field</h4>
                    <p className="text-muted-foreground text-sm mb-4">
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

                  <div>
                    <h4 className="font-semibold text-lg mb-2">Slider Field <Badge variant="outline" className="ml-2">Enhanced</Badge></h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Interactive range slider with custom visualizations, click-to-select functionality, and advanced animations.
                    </p>
                    <CodeBlock 
                      code={`// Basic slider
{
  name: 'budget',
  type: 'slider',
  label: 'Budget Range',
  sliderConfig: {
    min: 0,
    max: 10000,
    step: 100,
    showValue: true,
    gradientColors: {
      start: '#ef4444', // Red
      end: '#22c55e'    // Green
    }
  }
}

// Advanced slider with custom visualizations
{
  name: 'energyRating',
  type: 'slider',
  label: 'Energy Efficiency',
  sliderConfig: {
    min: 1,
    max: 7,
    step: 1,
    valueMapping: [
      { sliderValue: 1, displayValue: 'A', label: 'Excellent' },
      { sliderValue: 2, displayValue: 'B', label: 'Very Good' },
      // ... more mappings
    ],
    // Custom visualization component can be imported and used here
    showValue: true
  }
}`}
                      language="tsx"
                    />
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>New Features:</strong> Click any visualization to select its value • Full keyboard accessibility • 
                        Smooth animations • Dynamic gradient colors • Floating value indicators
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl">Best Practices</CardTitle>
                    <CardDescription className="text-base">
                      Guidelines for effective form design and field selection.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
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
                </div>
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
              Start using these field components in your project today. Install Formedible 
              and create beautiful, type-safe forms with minimal effort.
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