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
import { useTheme } from "next-themes";

// Components
import { HeroExamples } from "@/components/demo/hero-examples";

export default function Home() {
  const [origin, setOrigin] = React.useState("");
  const { theme, systemTheme } = useTheme();

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Determine the current theme - handle 'system' theme by falling back to systemTheme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = currentTheme === 'dark';

  const installCommand = `npx shadcn@latest add ${
    origin || "https://formedible.dev"
  }/r/use-formedible.json`;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 xl:gap-24 items-start max-w-7xl mx-auto">
            {/* Left Content */}
            <motion.div
              className="text-center xl:text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
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
                className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Schema-Driven Forms
                <br />
                <span className="bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                  Made Simple
                </span>
              </motion.h2>

              <motion.p
                className="text-xl text-muted-foreground mb-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                A powerful React hook that wraps TanStack Form with shadcn/ui
                components. Features schema validation, multi-page support,
                component overrides, and custom wrappers.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center xl:justify-start mb-8"
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
            </motion.div>

            {/* Right Examples */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <HeroExamples />
            </motion.div>
          </div>
        </section>

        {/* Installation & Features Combined Section */}
        <motion.section
          id="installation"
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Installation & Setup - Left Side */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-6"
            >
              <div className="text-center 2xl:text-left mb-8">
                <motion.h3
                  className="text-3xl font-bold mb-4 flex items-center justify-center 2xl:justify-start gap-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <Terminal className="w-8 h-8" />
                  Installation & Setup
                </motion.h3>
                <motion.p
                  className="text-muted-foreground text-lg"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Get the use-formedible hook installed in your project that
                  uses shadcn/ui
                </motion.p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Install via shadcn CLI
                  </CardTitle>
                  <CardDescription>
                    This installs the hook, all field components, and their
                    dependencies automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={installCommand}
                    language="bash"
                    showPackageManagerTabs={true}
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Basic Usage Example</CardTitle>
                  <CardDescription>
                    Quick example showing how to create a form with validation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    language="tsx"
                    darkMode={darkMode}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    📦 What Gets Installed
                  </CardTitle>
                  <CardDescription>
                    Complete package includes everything you need
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <code>hooks/use-formedible.tsx</code> - Main form hook
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <code>components/fields/*</code> - All field components
                        (text, select, date, etc.)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        All required shadcn/ui components and dependencies
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        TypeScript definitions and component interfaces
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Component Features - Right Side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-6"
            >
              <div className="text-center 2xl:text-left mb-8">
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
              <div className="space-y-6">
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
                    transition={{ delay: 1.0 + index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <feature.icon
                          className={`w-8 h-8 ${feature.color} mb-2`}
                        />
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Quick Links */}
        <motion.section
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <Link href="/builder">
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Blocks className="w-8 h-8 text-primary mb-2" />{" "}
                    <CardTitle>Interactive Builder</CardTitle>
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
                    <Code className="w-8 h-8 text-accent mb-2" />{" "}
                    <CardTitle>Documentation</CardTitle>
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
                <div className="w-6 h-6 bg-gradient-to-br from-primary to-muted-foreground rounded-md flex items-center justify-center">
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
