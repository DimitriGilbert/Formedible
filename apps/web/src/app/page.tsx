"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Terminal,
  Package,
  Blocks,
  Zap,
  Shield,
  Users,
  Sparkles,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";

// Components
import { DemoCard } from "@/components/demo/demo-card";

// Import examples from docs/examples
import { ContactFormExample, contactFormCode } from "@/app/docs/examples/contact-form";
import { RegistrationFormExample, registrationFormCode } from "@/app/docs/examples/registration-form";
import { SurveyFormExample, surveyFormCode } from "@/app/docs/examples/survey-form";








export default function Home() {

  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const installCommand = `npx shadcn@latest add ${
    origin || "https://formedible.dev"
  }/r/use-formedible.json`;

  return (
    <>
      <Toaster position="top-right" richColors />
       <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="secondary" className="mb-4">
                <Package className="w-3 h-3 mr-1" />
                shadcn/ui Registry Component
              </Badge>
            </motion.div>

            <motion.h2
              className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Schema-Driven Forms
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              A powerful React hook that wraps TanStack Form with shadcn/ui
              components. Features schema validation, multi-page support,
              component overrides, and custom wrappers.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="text-lg px-8" asChild>
                  <a href="#installation">
                    <Terminal className="w-5 h-5 mr-2" />
                    Install Now
                  </a>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8"
                  asChild
                >
                  <Link href="/builder">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try Builder
                  </Link>
                </Button>
              </motion.div>
            </motion.div>

            {/* Installation Command */}
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="mb-2 text-center">
                <span className="text-muted-foreground text-sm">
                  Install via shadcn CLI
                </span>
              </div>
                <CodeBlock 
                  code={installCommand} 
                  language="bash"
                  showPackageManagerTabs={true} 
                />            </motion.div>
          </motion.div>
        </section>

        {/* Component Features */}
        <motion.section
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="text-center mb-12">
            <motion.h3
              className="text-3xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Component Features
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Everything you need for building powerful forms with shadcn/ui
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Shield,
                title: "Schema Validation",
                description:
                  "Built-in Zod schema validation with real-time error handling and type safety",
                color: "text-blue-500",
              },
              {
                icon: Zap,
                title: "Component Override",
                description:
                  "Replace any field component with your custom implementations seamlessly",
                color: "text-purple-500",
              },
              {
                icon: Sparkles,
                title: "Custom Wrappers",
                description:
                  "Add animations, special styling, or extra functionality to any field",
                color: "text-green-500",
              },
              {
                icon: Users,
                title: "Multi-Page Forms",
                description:
                  "Built-in pagination with customizable progress indicators and navigation",
                color: "text-orange-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className={`w-8 h-8 ${feature.color} mb-2`} />
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Installation Section */}
        <motion.section
          id="installation"
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Terminal className="w-6 h-6" />
                Installation & Setup
              </CardTitle>
              <CardDescription>
                Get the use-formedible hook installed in your project that uses shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">
                  Install the component via shadcn CLI
                </h4>
              <CodeBlock 
                code={installCommand} 
                language="bash"
                showPackageManagerTabs={true} 
              />                <p className="text-sm text-muted-foreground mt-2">
                  This installs the hook, all field components, and their
                  dependencies automatically.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Basic usage example</h4>
                <CodeBlock 
                  language="tsx"
                  title="Basic Usage Example"
                  code={`import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message too short"),
});

export function MyForm() {
  const { Form } = useFormedible({
    schema,
    fields: [
      { name: "email", type: "email", label: "Email" },
      { name: "message", type: "textarea", label: "Message" },
    ],
    formOptions: {
      defaultValues: { email: "", message: "" },
      onSubmit: async ({ value }) => console.log(value),
    },
  });

  return <Form />;
}`}
                />
              </div>

              <motion.div
                className="bg-gradient-to-r from-secondary to-accent/20 p-4 rounded-lg border"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-2 text-primary">
                  📦 What gets installed
                </h4>
                <ul className="text-sm text-foreground space-y-1">
                  <li>
                    • <code>hooks/use-formedible.tsx</code> - Main form hook
                  </li>
                  <li>
                    • <code>components/fields/*</code> - All field components
                    (text, select, date, etc.)
                  </li>
                  <li>• All required shadcn/ui components and dependencies</li>
                  <li>• TypeScript definitions and component interfaces</li>
                </ul>
              </motion.div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Quick Links */}
        <motion.section
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <motion.h3
              className="text-3xl font-bold mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Get Started
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Explore the interactive builder and comprehensive documentation
            </motion.p>
          </div>

          <Tabs defaultValue="contact" className="max-w-6xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="contact">Contact Form</TabsTrigger>
                <TabsTrigger value="registration">Multi-Page Form</TabsTrigger>
                <TabsTrigger value="survey">Conditional Logic</TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <TabsContent key="contact" value="contact">
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Contact Form"
                    description="Simple form with validation, select options, and checkbox"
                    preview={<ContactFormExample />}
                    code={contactFormCode}
                    codeTitle="Contact Form Implementation"
                    codeDescription="Clean contact form with subject selection and urgency checkbox"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="registration" value="registration">
                <motion.div
                  key="registration"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Multi-Page Registration"
                    description="3-step registration form with progress tracking and page validation"
                    preview={<RegistrationFormExample />}
                    code={registrationFormCode}
                    codeTitle="Multi-Page Form Implementation"
                    codeDescription="Registration form split across multiple pages with progress indicator"
                  />
                </motion.div>
              </TabsContent>


              <TabsContent key="survey" value="survey">
                <motion.div
                  key="survey"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Smart Survey Form"
                    description="Dynamic form with conditional fields and smart option filtering"
                    preview={<SurveyFormExample />}
                    code={surveyFormCode}
                    codeTitle="Conditional Logic Implementation"
                    codeDescription="Survey form showcasing conditional fields and dynamic options based on user input"
                  />
                </motion.div>
              </TabsContent>

            </AnimatePresence>
          </Tabs>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Link href="/builder">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                     <Blocks className="w-8 h-8 text-primary mb-2" />                    <CardTitle>Interactive Builder</CardTitle>
                    <CardDescription>
                      Build forms visually with our interface. Create,
                      customize, and export your forms with ease.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <Link href="/docs">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                     <Code className="w-8 h-8 text-accent mb-2" />                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>
                      Comprehensive guides, API reference, and examples to help
                      you master Formedible.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          className="border-t bg-background/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-md flex items-center justify-center">
                  <Blocks className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Formedible</span>
                <Badge variant="secondary" className="text-xs">
                  shadcn/ui Registry
                </Badge>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Built with TanStack Form, shadcn/ui, and Zod
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
