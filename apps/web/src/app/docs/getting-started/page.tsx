"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Docs
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Getting Started</h1>
              <p className="text-sm text-muted-foreground">
                Learn how to install and use Formedible
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
          <h1>Getting Started</h1>
          
          <p>Welcome to Formedible! This guide will help you get up and running with schema-driven forms in your Next.js project.</p>

          <h2>Installation</h2>
          
          <p>Install Formedible using the shadcn CLI:</p>
          
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <code>npx shadcn@latest add formedible.com/r/use-formedible.json</code>
          </pre>

          <p>This command will:</p>
          <ul>
            <li>Install the <code>useFormedible</code> hook</li>
            <li>Add all field components to your project</li>
            <li>Install required dependencies</li>
            <li>Set up TypeScript definitions</li>
          </ul>

          <h2>Your First Form</h2>
          
          <p>Let&apos;s create a simple contact form to get you started:</p>

          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <code>{`import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function ContactForm() {
  const { Form } = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name" },
      { name: "email", type: "email", label: "Email Address" },
      { name: "message", type: "textarea", label: "Message" },
    ],
    formOptions: {
      defaultValues: {
        name: "",
        email: "",
        message: "",
      },
      onSubmit: async ({ value }) => {
        console.log("Form submitted:", value);
        // Handle form submission here
      },
    },
  });

  return <Form />;
}`}</code>
          </pre>

          <h2>Key Concepts</h2>

          <h3>Schema Validation</h3>
          <p>Formedible uses Zod schemas for validation. Define your schema once and get:</p>
          <ul>
            <li>Type safety</li>
            <li>Runtime validation</li>
            <li>Automatic error messages</li>
          </ul>

          <h3>Field Configuration</h3>
          <p>Each field is configured with:</p>
          <ul>
            <li><code>name</code>: The field name (must match schema)</li>
            <li><code>type</code>: The field type (text, email, select, etc.)</li>
            <li><code>label</code>: Display label for the field</li>
            <li>Additional type-specific options</li>
          </ul>

          <h3>Form Options</h3>
          <p>The <code>formOptions</code> object accepts all TanStack Form options:</p>
          <ul>
            <li><code>defaultValues</code>: Initial form values</li>
            <li><code>onSubmit</code>: Form submission handler</li>
            <li><code>validators</code>: Additional validation logic</li>
          </ul>

          <h2>Next Steps</h2>
          <ul>
            <li>Explore Field Types to see all available components</li>
            <li>Check out Examples for real-world use cases</li>
            <li>Read the API Reference for complete documentation</li>
          </ul>

          <h2>Need Help?</h2>
          <p>If you run into any issues, check out our examples or create an issue on GitHub.</p>
        </div>
      </div>
    </div>
  );
}