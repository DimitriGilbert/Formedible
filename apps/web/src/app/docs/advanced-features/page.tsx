"use client";

import { ArrowLeft, CheckSquare, Code2, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";

export default function AdvancedFeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
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
                Formedible provides a comprehensive set of advanced features to
                handle complex form scenarios, from validation and persistence
                to analytics.
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
                <span className="text-sm font-medium">
                  Developer Experience
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/docs/validation" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-info/10 to-info/10 border border-info/30">
                        <CheckSquare className="w-6 h-6 text-info" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-info transition-colors">
                          Advanced Validation
                        </CardTitle>
                        <CardDescription className="text-base">
                          Cross-field validation, async validation with loading
                          states
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
                      <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/10 border border-success/30">
                        <Code2 className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-success transition-colors">
                          Form Persistence
                        </CardTitle>
                        <CardDescription className="text-base">
                          Auto-save form data to browser storage with
                          configurable options
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
                      <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-accent/10 border border-accent/30">
                        <Zap className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-accent transition-colors">
                          Form Analytics
                        </CardTitle>
                        <CardDescription className="text-base">
                          Track user interactions, completion rates, and
                          performance metrics
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

              <Link href="/docs/advanced-fields" className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-info/10 to-info/10 border border-info/30">
                        <Code2 className="w-6 h-6 text-info" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-info transition-colors">
                          Advanced Field Types
                        </CardTitle>
                        <CardDescription className="text-base">
                          Specialized field types including location picker and
                          duration input
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
                    <div className="p-2 rounded-lg bg-gradient-to-br from-muted/10 to-muted/10 border border-muted">
                      <CheckSquare className="w-6 h-6 text-muted-foreground" />
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
            <DocCard
              title="Feature Overview"
              description="Comprehensive list of completed and upcoming features."
              icon={CheckSquare}
            >
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-success/10 to-success/20 p-6 rounded-lg border border-success/30">
                  <h3 className="text-lg font-semibold mb-3 text-success-foreground flex items-center gap-2">
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
                        <li>• TypeScript support</li>
                        <li>• Layout components</li>
                        <li>• Multi-page forms</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-warning/10 to-warning/20 p-6 rounded-lg border border-warning/30">
                  <h3 className="text-lg font-semibold mb-3 text-warning-foreground flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Coming Soon
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2 text-warning-foreground">
                        Additional Field Types
                      </h4>
                      <ul className="space-y-1 text-warning-foreground/80">
                        <li>• Rich text editor</li>
                        <li>• Code editor with syntax highlighting</li>
                        <li>• Digital signature pad</li>
                        <li>• Time & DateTime pickers</li>
                        <li>• Tags input field</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-warning-foreground">
                        Enhanced Features
                      </h4>
                      <ul className="space-y-1 text-warning-foreground/80">
                        <li>• Visual form builder</li>
                        <li>• Accessibility enhancements</li>
                        <li>• Internationalization support</li>
                        <li>• Performance optimizations</li>
                        <li>• Framework integrations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            {/* Quick Start */}
            <DocCard
              title="Quick Start"
              description="Get started with advanced features by adding them to your form configuration."
              icon={Code2}
            >
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
            </DocCard>

            {/* Best Practices */}
            <DocCard
              title="Best Practices"
              description="Guidelines for building robust and user-friendly forms."
              icon={Rocket}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Use debouncing for async operations and be mindful of
                    validation frequency.
                  </p>
                </div>

                <div className="border-l-4 border-accent pl-4">
                  <h3 className="font-semibold">Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    Exclude sensitive fields from persistence and be careful
                    with analytics data.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h3 className="font-semibold">Testing</h3>
                  <p className="text-sm text-muted-foreground">
                    Test both success and error scenarios, especially for async
                    operations.
                  </p>
                </div>

                <div className="border-l-4 border-muted pl-4">
                  <h3 className="font-semibold">User Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide clear feedback for loading states and validation
                    errors.
                  </p>
                </div>
              </div>
            </DocCard>
          </div>
        </div>
      </div>
    </div>
  );
}
