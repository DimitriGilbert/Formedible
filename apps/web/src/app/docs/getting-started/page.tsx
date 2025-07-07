"use client";

import { ArrowLeft, CheckCircle, ExternalLink, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
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
                <Rocket className="w-3 h-3 mr-1" />
                Getting Started
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-blue-800 dark:from-slate-100 dark:to-blue-200 bg-clip-text text-transparent">
                Build Your First Form
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get up and running with Formedible in under 5 minutes. 
                This guide will walk you through creating a beautiful, type-safe form.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800 dark:text-green-200">Quick Start</span>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Already familiar with React and Zod? Jump straight to step 1 and have your form running in 2 minutes.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="text-base">{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Code */}
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Code</h4>
                      <CodeBlock 
                        code={step.code}
                        language={index === 0 ? "bash" : "tsx"}
                        showPackageManagerTabs={index === 0}
                      />
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">What This Does</h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Next Steps */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-blue-800 dark:text-blue-200">
                  🎉 Congratulations!
                </CardTitle>
                <CardDescription className="text-base text-blue-700 dark:text-blue-300">
                  You've created your first Formedible form. Here's what to explore next:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/docs/fields">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                      <h4 className="font-semibold mb-2">Field Types</h4>
                      <p className="text-sm text-muted-foreground">Explore 15+ field components</p>
                    </div>
                  </Link>
                  <Link href="/docs/examples">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                      <h4 className="font-semibold mb-2">Examples</h4>
                      <p className="text-sm text-muted-foreground">See real-world implementations</p>
                    </div>
                  </Link>
                  <Link href="/docs/api">
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                      <h4 className="font-semibold mb-2">API Reference</h4>
                      <p className="text-sm text-muted-foreground">Complete documentation</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
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