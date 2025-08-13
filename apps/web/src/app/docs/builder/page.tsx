import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wrench,
  Settings,
  Code,
  Eye,
  Palette,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Form Builder - Formedible",
  description:
    "Visual form builder with modular tab system for creating forms interactively.",
};

export default function BuilderPage() {
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
                <Wrench className="w-3 h-3 mr-1" />
                Form Builder
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Visual Form Builder
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Create forms visually with our interactive form builder.
                Features a modular tab system that can be extended with custom
                tabs for specialized workflows.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Code className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Code Export</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Extensible</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="mt-16">
              <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
                <h3 className="text-2xl font-bold mb-4">Want to try it ?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Start using the form builder to create forms with a visual
                  interface. Extend it with custom tabs to match your specific
                  workflow needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/builder">Open Builder</Link>
                  </Button>
                </div>
              </div>
            </div>

            <DocCard
              title="Basic Usage"
              description="Get started with the form builder using the default configuration with builder, preview, and code tabs."
              icon={Wrench}
            >
              <p className="text-muted-foreground mb-6">
                The form builder provides an intuitive interface for creating
                forms visually. It includes three main tabs by default: Builder
                for form design, Preview for testing, and Code for export.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Default Builder</h3>
                <CodeBlock
                  code={`import { FormBuilder } from '@/components/formedible/builder/form-builder';

export default function MyBuilderPage() {
  return (
    <div className="min-h-screen">
      <FormBuilder />
    </div>
  );
}`}
                  language="tsx"
                />
              </div>
            </DocCard>

            <DocCard
              title="Tab Configuration"
              description="Control which tabs are available and customize the builder's functionality."
              icon={Settings}
            >
              <p className="text-muted-foreground mb-6">
                You can configure which tabs are enabled and set the default tab
                that opens when the builder loads.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Enabled Tabs</h3>
                <CodeBlock
                  code={`// Builder and Preview only
<FormBuilder enabledTabs={["builder", "preview"]} />

// All tabs with custom default
<FormBuilder 
  enabledTabs={["builder", "preview", "code"]}
  defaultTab="preview" 
/>`}
                  language="tsx"
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Available Tab IDs
                </h3>
                <div className="space-y-2">
                  <div className="border-l-4 border-primary/20 pl-4">
                    <code className="text-primary font-mono">builder</code>
                    <p className="text-sm text-muted-foreground">
                      Visual form designer with drag-and-drop fields
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <code className="text-primary font-mono">preview</code>
                    <p className="text-sm text-muted-foreground">
                      Live preview of the form as users will see it
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <code className="text-primary font-mono">code</code>
                    <p className="text-sm text-muted-foreground">
                      Generated code that can be copied and used
                    </p>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Custom Tabs"
              description="Extend the builder with custom tabs for specialized functionality."
              icon={Code}
            >
              <p className="text-muted-foreground mb-6">
                Create custom tabs to add specialized functionality to the form
                builder. Custom tabs receive props to access and modify form
                data.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Creating a Custom Tab
                </h3>
                <CodeBlock
                  code={`import { TabContentProps, TabConfig } from '@/components/formedible/builder/types';

// 1. Create tab content component
const DocumentationTabContent: React.FC<TabContentProps> = ({ 
  getFormMetadata, 
  getAllFields 
}) => {
  const metadata = getFormMetadata();
  const fields = getAllFields();

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Form Documentation</h2>
      <div className="space-y-4">
        <p><strong>Title:</strong> {metadata.title}</p>
        <p><strong>Fields:</strong> {fields.length}</p>
        
        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.id} className="border rounded p-3">
              <span className="font-medium">{field.label}</span>
              <span className="ml-2 text-muted-foreground">({field.type})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 2. Define tab configuration
const documentationTab: TabConfig = {
  id: "documentation",
  label: "Docs",
  icon: FileText,
  component: DocumentationTabContent,
  enabled: true,
  order: 4,
};`}
                  language="tsx"
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">
                  Using Custom Tabs
                </h3>
                <CodeBlock
                  code={`import { FormBuilder } from '@/components/formedible/builder/form-builder';
import { builderTab, previewTab, codeTab } from '@/components/formedible/builder/default-tabs';

<FormBuilder 
  tabs={[builderTab, previewTab, codeTab, documentationTab]}
  defaultTab="builder"
/>`}
                  language="tsx"
                />
              </div>
            </DocCard>

            <DocCard
              title="Available Props"
              description="Props available to custom tab components for accessing and modifying form data."
              icon={Palette}
            >
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  TabContentProps Interface
                </h3>
                <CodeBlock
                  code={`interface TabContentProps {
  // Form data access
  getFormMetadata: () => FormMetadata;
  getAllFields: () => FieldConfig[];
  selectedFieldId?: string;
  
  // Form modification
  onFormMetadataChange: (metadata: Partial<FormMetadata>) => void;
  onAddField: (field: FieldConfig) => void;
  onUpdateField: (id: string, updates: Partial<FieldConfig>) => void;
  onDeleteField: (id: string) => void;
  onSelectField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  onReorderFields: (startIndex: number, endIndex: number) => void;
}`}
                  language="typescript"
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Common Use Cases</h3>
                <div className="space-y-2">
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>Documentation Tab</strong>
                    <p className="text-sm text-muted-foreground">
                      Auto-generate form documentation and field references
                    </p>
                  </div>
                  <div className="border-l-4 border-accent/20 pl-4">
                    <strong>Styling Tab</strong>
                    <p className="text-sm text-muted-foreground">
                      Customize form themes, colors, and appearance
                    </p>
                  </div>
                  <div className="border-l-4 border-secondary/20 pl-4">
                    <strong>Security Tab</strong>
                    <p className="text-sm text-muted-foreground">
                      Review sensitive fields and security settings
                    </p>
                  </div>
                  <div className="border-l-4 border-muted/20 pl-4">
                    <strong>Export Tab</strong>
                    <p className="text-sm text-muted-foreground">
                      Export form data in different formats (JSON, YAML, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Tab Ordering"
              description="Control the order of tabs and customize the builder workflow."
              icon={Shield}
            >
              <p className="text-muted-foreground mb-6">
                You can control the order in which tabs appear by setting the
                order property or by arranging them in the tabs array.
              </p>

              <CodeBlock
                code={`// Method 1: Using order property
const customTabs = [
  { ...stylingTab, order: 1 },      // First tab
  { ...builderTab, order: 2 },      // Second tab
  { ...previewTab, order: 3 },      // Third tab
  { ...codeTab, order: 4 },         // Fourth tab
];

<FormBuilder 
  tabs={customTabs}
  defaultTab="styling"  // Start with styling tab
/>

// Method 2: Array order (simpler)
<FormBuilder 
  tabs={[stylingTab, builderTab, previewTab, codeTab]}
  defaultTab="styling"
/>`}
                language="tsx"
              />
            </DocCard>
          </div>

          {/* Ready to Build */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Forms Visually?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Start using the form builder to create forms with a visual
                interface. Extend it with custom tabs to match your specific
                workflow needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/builder">Open Builder</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/docs/getting-started">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
