"use client";

import { ArrowLeft, CheckCircle, ExternalLink, Rocket, Zap, Download, Settings, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";

export default function GettingStartedPage() {
  const steps = [
    {
      title: "Install Formedible",
      description: "Add Formedible to your project with one command",
      code: "npx shadcn@latest add formedible.dev/r/use-formedible.json",
      details: [
        "Installs the useFormedible hook",
        "Adds all field components to your project", 
        "Installs required dependencies",
        "Sets up TypeScript definitions"
      ]
    },
    {
      title: "Define Your Schema",
      description: "Create a Zod schema for type-safe validation",
      code: `import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});`,
      details: [
        "Full TypeScript support",
        "Runtime validation",
        "Automatic error messages",
        "Composable and reusable"
      ]
    },
    {
      title: "Build Your Form",
      description: "Use the useFormedible hook to create your form",
      code: `import { useFormedible } from "@/hooks/use-formedible";

export function ContactForm() {
  const { Form } = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name" },
      { name: "email", type: "email", label: "Email Address" },
      { name: "message", type: "textarea", label: "Message" },
    ],
    formOptions: {
      defaultValues: { name: "", email: "", message: "" },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
      },
    },
  });

  return <Form />;
}`,
      details: [
        "Declarative field configuration",
        "Built-in form state management",
        "Automatic validation integration",
        "Customizable styling"
      ]
    }
  ];

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
                <Rocket className="w-3 h-3 mr-1" />
                Getting Started
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Build Your First Form
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get up and running with Formedible in under 5 minutes. 
                This guide will walk you through creating a beautiful, type-safe form.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-6 rounded-xl border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">Quick Start</span>
              </div>
              <p className="text-foreground text-sm">
                Already familiar with React and Zod? Jump straight to step 1 and have your form running in 2 minutes.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-12">
            <DocCard
              title="Install Formedible"
              description="Add Formedible to your project with one command"
              icon={Download}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Code</h4>
                  <CodeBlock 
                    code="npx shadcn@latest add formedible.dev/r/use-formedible.json"
                    language="bash"
                    showPackageManagerTabs={true}
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">What This Does</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Installs the useFormedible hook</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Adds all field components to your project</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Installs required dependencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Sets up TypeScript definitions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Define Your Schema"
              description="Create a Zod schema for type-safe validation"
              icon={Settings}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Code</h4>
                  <CodeBlock 
                    code={`import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});`}
                    language="tsx"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">What This Does</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Full TypeScript support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Runtime validation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Automatic error messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Composable and reusable</span>
                    </li>
                  </ul>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Build Your Form"
              description="Use the useFormedible hook to create your form"
              icon={Code}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Code</h4>
                  <CodeBlock 
                    code={`import { useFormedible } from "@/hooks/use-formedible";

export function ContactForm() {
  const { Form } = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name" },
      { name: "email", type: "email", label: "Email Address" },
      { name: "message", type: "textarea", label: "Message" },
    ],
    formOptions: {
      defaultValues: { name: "", email: "", message: "" },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
      },
    },
  });

  return <Form />;
}`}
                    language="tsx"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">What This Does</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Declarative field configuration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Built-in form state management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Automatic validation integration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Customizable styling</span>
                    </li>
                  </ul>
                </div>
              </div>
            </DocCard>
          </div>

          {/* Next Steps */}
          <div className="mt-16">
            <DocCard
              title="🎉 Congratulations!"
              description="You've created your first Formedible form. Here's what to explore next:"
              icon={CheckCircle}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/docs/fields">
                  <div className="p-4 bg-card rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-2">Field Types</h4>
                    <p className="text-sm text-muted-foreground">Explore 20+ field components</p>
                  </div>
                </Link>
                <Link href="/docs/examples">
                  <div className="p-4 bg-card rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-2">Examples</h4>
                    <p className="text-sm text-muted-foreground">See real-world implementations</p>
                  </div>
                </Link>
                <Link href="/docs/api">
                  <div className="p-4 bg-card rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold mb-2">API Reference</h4>
                    <p className="text-sm text-muted-foreground">Complete documentation</p>
                  </div>
                </Link>
              </div>
            </DocCard>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">Need Help?</h3>
            <p className="text-muted-foreground mb-6">
              If you run into any issues or have questions, we're here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/docs/examples">
                  View Examples
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://github.com/your-repo/formedible/issues" target="_blank" rel="noopener noreferrer">
                  Report Issue
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}