"use client";

import { ArrowLeft, CheckSquare, Code2, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import Link from "next/link";

export default function AdvancedFeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                <Zap className="w-3 h-3 mr-1" />
                Advanced Features
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Powerful Features for Complex Forms
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Formedible provides a comprehensive set of advanced features to handle complex form scenarios, 
                from validation and persistence to analytics and testing.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <CheckSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Production Ready</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Code2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Type Safe</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Rocket className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Developer Experience</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/docs/validation" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-200">
                        <CheckSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                          Advanced Validation
                        </CardTitle>
                        <CardDescription className="text-base">
                          Cross-field validation, async validation with loading states
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Cross-field</Badge>
                      <Badge variant="secondary">Async</Badge>
                      <Badge variant="secondary">Debouncing</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/persistence" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-200">
                        <Code2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-green-600 transition-colors">
                          Form Persistence
                        </CardTitle>
                        <CardDescription className="text-base">
                          Auto-save form data to browser storage with configurable options
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Auto-save</Badge>
                      <Badge variant="secondary">localStorage</Badge>
                      <Badge variant="secondary">Restoration</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/analytics" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-200">
                        <Zap className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                          Form Analytics
                        </CardTitle>
                        <CardDescription className="text-base">
                          Track user interactions, completion rates, and performance metrics
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Tracking</Badge>
                      <Badge variant="secondary">Metrics</Badge>
                      <Badge variant="secondary">Events</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/testing" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-200">
                        <Rocket className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                          Testing Utilities
                        </CardTitle>
                        <CardDescription className="text-base">
                          Comprehensive testing framework with utilities for validation
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Jest</Badge>
                      <Badge variant="secondary">Vitest</Badge>
                      <Badge variant="secondary">Assertions</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/docs/advanced-fields" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-200">
                        <Code2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-indigo-600 transition-colors">
                          Advanced Field Types
                        </CardTitle>
                        <CardDescription className="text-base">
                          Specialized field types including location picker and duration input
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Location</Badge>
                      <Badge variant="secondary">Duration</Badge>
                      <Badge variant="secondary">Autocomplete</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Card className="h-full bg-muted/30 border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-200">
                      <CheckSquare className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-muted-foreground">
                        Layout Components
                      </CardTitle>
                      <CardDescription className="text-base">
                        Grid layouts, tabs, accordions, and stepper components
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Grid</Badge>
                    <Badge variant="outline">Tabs</Badge>
                    <Badge variant="outline">Stepper</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Overview */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <CheckSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Feature Overview</CardTitle>
                    <CardDescription className="text-base">
                      Comprehensive list of completed and upcoming features.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-300 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Completed Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">Validation & Logic</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Cross-field validation</li>
                        <li>• Async validation with debouncing</li>
                        <li>• Conditional field rendering</li>
                        <li>• Zod schema integration</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Data & Analytics</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Form persistence & auto-save</li>
                        <li>• User interaction tracking</li>
                        <li>• Performance metrics</li>
                        <li>• Completion analytics</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Field Types</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Location picker with maps</li>
                        <li>• Duration input (multiple formats)</li>
                        <li>• Autocomplete with async options</li>
                        <li>• Masked input fields</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Developer Experience</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Comprehensive testing utilities</li>
                        <li>• TypeScript support</li>
                        <li>• Layout components</li>
                        <li>• Multi-page forms</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-lg font-semibold mb-3 text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Coming Soon
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2 text-yellow-800">Additional Field Types</h4>
                      <ul className="space-y-1 text-yellow-700">
                        <li>• Rich text editor</li>
                        <li>• Code editor with syntax highlighting</li>
                        <li>• Digital signature pad</li>
                        <li>• Time & DateTime pickers</li>
                        <li>• Tags input field</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-yellow-800">Enhanced Features</h4>
                      <ul className="space-y-1 text-yellow-700">
                        <li>• Visual form builder</li>
                        <li>• Accessibility enhancements</li>
                        <li>• Internationalization support</li>
                        <li>• Performance optimizations</li>
                        <li>• Framework integrations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Code2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Quick Start</CardTitle>
                    <CardDescription className="text-base">
                      Get started with advanced features by adding them to your form configuration.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CodeBlock
                  code={`import { useFormedible } from 'formedible';

const { Form } = useFormedible({
  fields: [
    { name: 'email', type: 'email', label: 'Email' },
    { name: 'location', type: 'location', label: 'Location' },
  ],
  
  // Cross-field validation
  crossFieldValidation: [{
    fields: ['email'],
    validator: (values) => values.email ? null : 'Email is required',
    message: 'Please provide an email'
  }],
  
  // Form persistence
  persistence: {
    key: 'my-form',
    storage: 'localStorage',
    restoreOnMount: true
  },
  
  // Analytics tracking
  analytics: {
    onFormStart: (timestamp) => console.log('Form started'),
    onFormComplete: (timeSpent, data) => console.log('Completed', { timeSpent, data })
  }
});`}
                  language="tsx"
                />
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-muted-foreground/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/8 to-muted-foreground/8 border">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Best Practices</CardTitle>
                    <CardDescription className="text-base">
                      Guidelines for building robust and user-friendly forms.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold">Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Use debouncing for async operations and be mindful of validation frequency.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold">Privacy</h3>
                    <p className="text-sm text-muted-foreground">
                      Exclude sensitive fields from persistence and be careful with analytics data.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-secondary pl-4">
                    <h3 className="font-semibold">Testing</h3>
                    <p className="text-sm text-muted-foreground">
                      Test both success and error scenarios, especially for async operations.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-muted pl-4">
                    <h3 className="font-semibold">User Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      Provide clear feedback for loading states and validation errors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}