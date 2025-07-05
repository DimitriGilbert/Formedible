"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Code, Terminal, Package, Blocks, Zap, Shield, Users, Sparkles, Copy, Check, CommandIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";

// Copy Button Component
const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className = "" }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <motion.button
      onClick={copyToClipboard}
      className={`relative inline-flex items-center justify-center p-2 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white backdrop-blur-sm transition-colors ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Check className="w-4 h-4 text-green-400" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Copy className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Enhanced Code Block with Copy Button
const CodeBlockWithCopy: React.FC<{ code: string; language?: string }> = ({ code, language = "bash" }) => (
  <div className="relative group">
    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
      <code className={`language-${language}`}>{code}</code>
    </pre>
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton text={code} />
    </div>
  </div>
);

export default function Home() {
  const installCommand = `npx shadcn@latest add formedible.com/r/use-formedible.json`;

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Blocks className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Formedible
                  </h1>
                  <p className="text-sm text-muted-foreground">shadcn/ui Registry Component</p>
                </div>
              </motion.div>
              <div className="flex items-center gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/builder">
                      <Blocks className="w-4 h-4 mr-2" />
                      Builder
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/docs">
                      <Code className="w-4 h-4 mr-2" />
                      Docs
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(installCommand);
                      toast.success("Install command copied!", {
                        description: "Run this in your project terminal",
                      });
                    }}
                  >
                    <CommandIcon className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.header>

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
              A powerful React hook that wraps TanStack Form with shadcn/ui components. 
              Features schema validation, multi-page support, component overrides, and custom wrappers.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="text-lg px-8" asChild>
                  <a href="#installation">
                    <Terminal className="w-5 h-5 mr-2" />
                    Install Now
                  </a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                  <Link href="/builder">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try Builder
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            
            {/* Installation Command */}
            <motion.div 
              className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4 max-w-2xl mx-auto relative group"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Install via shadcn CLI</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <CopyButton text={installCommand} />
                </div>
              </div>
              <code className="text-green-400 font-mono text-sm block">
                npx shadcn@latest add formedible.com/r/use-formedible.json
              </code>
            </motion.div>
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
              { icon: Shield, title: "Schema Validation", description: "Built-in Zod schema validation with real-time error handling and type safety", color: "text-blue-500" },
              { icon: Zap, title: "Component Override", description: "Replace any field component with your custom implementations seamlessly", color: "text-purple-500" },
              { icon: Sparkles, title: "Custom Wrappers", description: "Add animations, special styling, or extra functionality to any field", color: "text-green-500" },
              { icon: Users, title: "Multi-Page Forms", description: "Built-in pagination with customizable progress indicators and navigation", color: "text-orange-500" },
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
                    <CardDescription>
                      {feature.description}
                    </CardDescription>
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
                Get the use-formedible hook installed in your shadcn/ui project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Install the component via shadcn CLI</h4>
                <CodeBlockWithCopy code={installCommand} />
                <p className="text-sm text-muted-foreground mt-2">
                  This installs the hook, all field components, and their dependencies automatically.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Basic usage example</h4>
                <div className="relative group">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <code>{`import { useFormedible } from "@/hooks/use-formedible";
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
}`}</code>
                  </pre>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={`import { useFormedible } from "@/hooks/use-formedible";
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
}`} />
                  </div>
                </div>
              </div>
              
              <motion.div 
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">📦 What gets installed</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <code>hooks/use-formedible.tsx</code> - Main form hook</li>
                  <li>• <code>components/fields/*</code> - All field components (text, select, date, etc.)</li>
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
                    <Blocks className="w-8 h-8 text-blue-500 mb-2" />
                    <CardTitle>Interactive Builder</CardTitle>
                    <CardDescription>
                      Build forms visually with our drag-and-drop interface. Create, customize, and export your forms with ease.
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
                    <Code className="w-8 h-8 text-purple-500 mb-2" />
                    <CardTitle>Documentation</CardTitle>
                    <CardDescription>
                      Comprehensive guides, API reference, and examples to help you master Formedible.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer 
          className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm"
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
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                  <Blocks className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold">Formedible</span>
                <Badge variant="secondary" className="text-xs">
                  shadcn/ui Registry
                </Badge>
              </motion.div>
              <p className="text-sm text-muted-foreground">
                Built with shadcn/ui, TanStack Form, Zod, and Radix UI
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
