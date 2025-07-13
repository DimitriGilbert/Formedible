"use client";

import React from "react";
import { motion } from "motion/react";
import { Settings, Eye, Code, FileText, Palette, Shield, ArrowLeft } from "lucide-react";
import { FormBuilder } from "@/components/formedible/builder/form-builder";
import { builderTab, previewTab, codeTab } from "@/components/formedible/builder/default-tabs";
import type { TabConfig, TabContentProps } from "@/components/formedible/builder/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// Example 1: Custom Documentation Tab
const DocumentationTabContent: React.FC<TabContentProps> = ({ getFormMetadata, getAllFields }) => {
  const formMetadata = getFormMetadata();
  const fields = getAllFields();

  return (
    <div className="h-full m-0 p-8 overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Form Documentation</h2>
          <p className="text-muted-foreground">
            Auto-generated documentation for your form
          </p>
        </div>

        <div className="space-y-4">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Form Overview</h3>
            <p><strong>Title:</strong> {formMetadata.title}</p>
            <p><strong>Description:</strong> {formMetadata.description}</p>
            <p><strong>Layout:</strong> {formMetadata.layoutType}</p>
            <p><strong>Total Fields:</strong> {fields.length}</p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Field Reference</h3>
            <div className="space-y-2">
              {fields.map((field) => (
                <div key={field.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">({field.name})</span>
                  </div>
                  <div className="text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded">{field.type}</span>
                    {field.required && <span className="ml-2 text-red-600">Required</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const documentationTab: TabConfig = {
  id: "documentation",
  label: "Docs",
  icon: FileText,
  component: DocumentationTabContent,
  enabled: true,
  order: 4,
};

// Example 2: Custom Styling Tab
const StylingTabContent: React.FC<TabContentProps> = ({ getFormMetadata, onFormMetadataChange }) => {
  return (
    <div className="h-full m-0 p-8 overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Form Styling</h2>
          <p className="text-muted-foreground">
            Customize the appearance of your form
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Theme</h3>
            <div className="space-y-3">
              <button className="w-full p-3 border rounded-lg text-left hover:bg-gray-50">
                Default Theme
              </button>
              <button className="w-full p-3 border rounded-lg text-left hover:bg-gray-50">
                Modern Theme
              </button>
              <button className="w-full p-3 border rounded-lg text-left hover:bg-gray-50">
                Minimal Theme
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Colors</h3>
            <div className="grid grid-cols-4 gap-3">
              {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'].map((color) => (
                <button
                  key={color}
                  className="h-12 w-12 rounded-lg border-2 border-gray-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const stylingTab: TabConfig = {
  id: "styling",
  label: "Styling",
  icon: Palette,
  component: StylingTabContent,
  enabled: true,
  order: 5,
};

// Example 3: Custom Security Tab
const SecurityTabContent: React.FC<TabContentProps> = ({ getAllFields }) => {
  const fields = getAllFields();
  const sensitiveFields = fields.filter(field => 
    field.type === 'password' || field.type === 'email' || field.name.includes('ssn')
  );

  return (
    <div className="h-full m-0 p-8 overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Security & Privacy</h2>
          <p className="text-muted-foreground">
            Review security settings and sensitive fields
          </p>
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Sensitive Fields</h3>
          {sensitiveFields.length === 0 ? (
            <p className="text-muted-foreground">No sensitive fields detected</p>
          ) : (
            <div className="space-y-2">
              {sensitiveFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div>
                    <span className="font-medium">{field.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">({field.type})</span>
                  </div>
                  <span className="text-sm text-yellow-700">Sensitive</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Enable CSRF protection</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Require HTTPS</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Enable rate limiting</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const securityTab: TabConfig = {
  id: "security",
  label: "Security",
  icon: Shield,
  component: SecurityTabContent,
  enabled: true,
  order: 6,
};

// Main page component
export default function BuilderPage() {
  const [activeExample, setActiveExample] = React.useState("default");

  const examples = [
    {
      id: "default",
      title: "Default Builder",
      description: "Standard builder with all three tabs",
      component: <FormBuilder />,
      badge: "Basic",
    },
    {
      id: "builder-preview",
      title: "Builder + Preview Only",
      description: "Remove the code tab for simpler workflow",
      component: <FormBuilder enabledTabs={["builder", "preview"]} />,
      badge: "Simple",
    },
    {
      id: "with-docs",
      title: "With Documentation Tab",
      description: "Add auto-generated form documentation",
      component: (
        <FormBuilder 
          tabs={[builderTab, previewTab, codeTab, documentationTab]}
          defaultTab="builder"
        />
      ),
      badge: "Extended",
    },
    {
      id: "advanced",
      title: "Advanced Builder",
      description: "Full featured builder with all custom tabs",
      component: (
        <FormBuilder 
          tabs={[
            builderTab,
            previewTab,
            documentationTab,
            stylingTab,
            securityTab,
            codeTab,
          ]}
          defaultTab="builder"
          onTabChange={(tabId: string) => console.log('Switched to tab:', tabId)}
        />
      ),
      badge: "Pro",
    },
    {
      id: "custom-order",
      title: "Custom Tab Order",
      description: "Reorder tabs based on your workflow",
      component: (
        <FormBuilder 
          tabs={[
            { ...stylingTab, order: 1 },
            { ...builderTab, order: 2 },
            { ...securityTab, order: 3 },
            { ...previewTab, order: 4 },
            { ...codeTab, order: 5 },
          ]}
          defaultTab="styling"
        />
      ),
      badge: "Custom",
    },
    {
      id: "minimal",
      title: "Minimal Builder",
      description: "Builder tab only for focused editing",
      component: (
        <FormBuilder 
          tabs={[builderTab]}
          defaultTab="builder"
        />
      ),
      badge: "Minimal",
    },
  ];

  const currentExample = examples.find(ex => ex.id === activeExample);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/60 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/docs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Docs
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Form Builder
                </h1>
                <p className="text-muted-foreground">
                  Visual form builder with modular tab system
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              Interactive Demo
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Example Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Builder Examples
              </CardTitle>
              <CardDescription>
                Explore different configurations of the modular form builder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeExample} onValueChange={setActiveExample} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
                  {examples.map((example) => (
                    <TabsTrigger
                      key={example.id}
                      value={example.id}
                      className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{example.title}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {example.badge}
                        </Badge>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Example Info */}
                {currentExample && (
                  <motion.div
                    key={activeExample}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{currentExample.title}</h3>
                      <Badge variant="secondary">{currentExample.badge}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {currentExample.description}
                    </p>
                  </motion.div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Builder Demo */}
        <motion.div
          key={activeExample}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="min-h-[800px]">
                {currentExample?.component}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Add Custom Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                How to Add Custom Tabs
              </CardTitle>
              <CardDescription>
                Create your own tabs to extend the builder functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">1. Create Tab Content</h4>
                  <div className="text-sm font-mono bg-muted p-3 rounded-lg">
                    {`const MyTabContent: React.FC<TabContentProps> = ({ 
  getFormMetadata, 
  getAllFields 
}) => {
  const metadata = getFormMetadata();
  const fields = getAllFields();
  
  return (
    <div className="p-8">
      <h2>My Custom Tab</h2>
      <p>Form: {metadata.title}</p>
      <p>Fields: {fields.length}</p>
    </div>
  );
};`}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">2. Define Tab Config</h4>
                  <div className="text-sm font-mono bg-muted p-3 rounded-lg">
                    {`const myTab: TabConfig = {
  id: "my-tab",
  label: "My Tab",
  icon: MyIcon,
  component: MyTabContent,
  enabled: true,
  order: 4,
};`}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">3. Use in FormBuilder</h4>
                <div className="text-sm font-mono bg-muted p-3 rounded-lg">
                  {`<FormBuilder 
  tabs={[builderTab, previewTab, myTab, codeTab]}
  defaultTab="builder"
/>`}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Available Props</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><code className="bg-blue-100 px-1 rounded">getFormMetadata()</code> - Get current form metadata</li>
                  <li><code className="bg-blue-100 px-1 rounded">getAllFields()</code> - Get all form fields</li>
                  <li><code className="bg-blue-100 px-1 rounded">onFormMetadataChange()</code> - Update form metadata</li>
                  <li><code className="bg-blue-100 px-1 rounded">selectedFieldId</code> - Currently selected field</li>
                  <li><code className="bg-blue-100 px-1 rounded">onAddField()</code> - Add a new field</li>
                  <li>+ many more for complete form control</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}