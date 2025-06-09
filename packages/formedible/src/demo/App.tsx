"use client";

import React, { useState } from "react";
import { useFormedible } from "@/hooks/use-formedible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Download, Code, Terminal, Package, Blocks, Zap, Shield, Users, Sparkles, Copy, Check, CommandIcon } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "motion/react";

// Components
import { DemoCard } from "./components/DemoCard";
import { AnimatedFieldWrapper } from "./components/AnimatedFieldWrapper";
import { CustomProgress } from "./components/CustomProgress";

// Code examples
import { contactFormCode, profileFormCode, surveyFormCode, registrationFormCode } from "./data/codeExamples";
import { CodeBlock } from "./components/CodeBlock";

// Enhanced schemas with proper validation
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  newsletter: z.boolean().optional(),
});

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  age: z.number().min(13, "Must be at least 13 years old").max(120, "Invalid age"),
  country: z.string().min(1, "Please select a country"),
  bio: z.string().optional(),
  notifications: z.boolean().default(true),
  newsletter: z.boolean().default(false),
  birthday: z.date().optional(),
});

const surveySchema = z.object({
  satisfaction: z.number().min(1).max(10),
  recommend: z.boolean(),
  feedback: z.string().min(5, "Please provide at least 5 characters of feedback"),
  category: z.string().min(1, "Please select a category"),
});

const registrationSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  age: z.number().min(18, "Must be at least 18 years old").max(120, "Invalid age"),
  country: z.string().min(1, "Please select a country"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  notifications: z.boolean(),
  newsletter: z.boolean(),
});

// Enhanced Animated Field Wrapper with random intro animations that ALL end in the same normal state
const EnhancedAnimatedWrapper: React.FC<{ children: React.ReactNode; field: any }> = ({ 
  children 
}) => {
  const animations = [
    { opacity: 0, y: 15 },
    { opacity: 0, x: -15 },
    { opacity: 0, scale: 0.95 },
    { opacity: 0, y: -10 },
  ];
  
  const randomInitial = animations[Math.floor(Math.random() * animations.length)];
  
  return (
    <motion.div
      initial={randomInitial}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }} // ALL animations end here - normal state!
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className="space-y-2"
    >
      {children}
    </motion.div>
  );
};

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

export function App() {
  const contactForm = useFormedible({
    schema: contactSchema,
    fields: [
      { name: "name", type: "text", label: "Full Name", placeholder: "Enter your full name" },
      { name: "email", type: "email", label: "Email Address", placeholder: "your@email.com" },
      { name: "message", type: "textarea", label: "Message", placeholder: "Tell us what you think..." },
      { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
    ],
    submitLabel: "Send Message",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: { 
        name: "",
        email: "",
        message: "",
        newsletter: false 
      },
      onSubmit: async ({ value }) => {
        console.log("Contact form submitted:", value);
        toast.success("Thank you for your message! We'll get back to you soon.", {
          description: "Your message has been sent successfully.",
        });
      },
    },
  });

  const profileForm = useFormedible({
    schema: userProfileSchema,
    fields: [
      { name: "firstName", type: "text", label: "First Name", placeholder: "John" },
      { name: "lastName", type: "text", label: "Last Name", placeholder: "Doe" },
      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },
      { name: "age", type: "number", label: "Age", placeholder: "25", min: 13, max: 120 },
      { 
        name: "country", 
        type: "select", 
        label: "Country", 
        options: ["United States", "Canada", "United Kingdom", "Germany", "France", "Other"] 
      },
      { name: "bio", type: "textarea", label: "Bio", placeholder: "Tell us about yourself..." },
      { name: "notifications", type: "switch", label: "Enable notifications" },
      { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
      { name: "birthday", type: "date", label: "Birthday" },
    ],
    submitLabel: "Update Profile",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        age: 25,
        country: "",
        bio: "",
        notifications: true,
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Profile updated:", value);
        toast.success("Profile updated successfully!", {
          description: "Your changes have been saved.",
        });
      },
    },
  });

  const surveyForm = useFormedible({
    schema: surveySchema,
    fields: [
      { name: "satisfaction", type: "slider", label: "Satisfaction (1-10)", min: 1, max: 10 },
      { name: "recommend", type: "switch", label: "Would you recommend us?" },
      { name: "feedback", type: "textarea", label: "Feedback", placeholder: "Your feedback helps us improve..." },
      { 
        name: "category", 
        type: "select", 
        label: "Category", 
        options: ["Product", "Support", "Documentation", "Other"] 
      },
    ],
    submitLabel: "Submit Survey",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: { 
        satisfaction: 5,
        recommend: true,
        feedback: "",
        category: ""
      },
      onSubmit: async ({ value }) => {
        console.log("Survey submitted:", value);
        toast.success("Thank you for your feedback!", {
          description: "Your response helps us improve our service.",
        });
      },
    },
  });

  const registrationForm = useFormedible({
    schema: registrationSchema,
    fields: [
      { name: "firstName", type: "text", label: "First Name", placeholder: "John", page: 1 },
      { name: "lastName", type: "text", label: "Last Name", placeholder: "Doe", page: 1 },
      { name: "email", type: "email", label: "Email Address", placeholder: "john@example.com", page: 1 },
      { name: "age", type: "number", label: "Age", placeholder: "25", min: 18, max: 120, page: 2 },
      { name: "country", type: "select", label: "Country", options: ["United States", "Canada", "United Kingdom", "Germany", "France", "Other"], page: 2 },
      { name: "bio", type: "textarea", label: "Tell us about yourself", placeholder: "Write a short bio...", page: 2 },
      { name: "notifications", type: "switch", label: "Enable email notifications", page: 3 },
      { name: "newsletter", type: "checkbox", label: "Subscribe to newsletter", page: 3 },
    ],
    pages: [
      { page: 1, title: "Basic Information", description: "Let's start with your basic details" },
      { page: 2, title: "Personal Details", description: "Tell us more about yourself" },
      { page: 3, title: "Preferences", description: "Customize your experience" },
    ],
    progress: {
      component: CustomProgress,
      className: "mb-6",
    },
    submitLabel: "Complete Registration",
    nextLabel: "Continue →",
    previousLabel: "← Back",
    globalWrapper: EnhancedAnimatedWrapper,
    formOptions: {
      defaultValues: {
        firstName: "",
        lastName: "",
        email: "",
        age: 18,
        country: "",
        bio: "",
        notifications: true,
        newsletter: false,
      },
      onSubmit: async ({ value }) => {
        console.log("Registration completed:", value);
        toast.success("Welcome aboard! 🎉", {
          description: "Your registration has been completed successfully.",
        });
      },
    },
    onPageChange: (page, direction) => {
      console.log(`Navigated to page ${page} via ${direction}`);
    },
  });

  const installCommand = `npx shadcn@latest add ${window.location.origin}/Formedible/r/use-formedible`;

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
                    <a href="https://github.com/DimitriGilbert/Formedible" target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      GitHub
                    </a>
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
                  <a href="#demo">
                    <Sparkles className="w-5 h-5 mr-2" />
                    View Examples
                  </a>
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
                npx shadcn@latest add {window.location.origin}/Formedible/r/use-formedible
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
                  <CodeBlock code={`import { useFormedible } from "@/hooks/use-formedible";
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
}`}/>
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

        {/* Component Examples */}
        <motion.section 
          id="demo" 
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
              Interactive Component Examples
            </motion.h3>
            <motion.p 
              className="text-muted-foreground text-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              See the useFormedible hook in action with different form configurations
            </motion.p>
          </div>

          <Tabs defaultValue="contact" className="max-w-6xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="contact">Simple Form</TabsTrigger>
                <TabsTrigger value="profile">Enhanced Fields</TabsTrigger>
                <TabsTrigger value="survey">Custom Components</TabsTrigger>
                <TabsTrigger value="registration">Multi-Page</TabsTrigger>
              </TabsList>
            </motion.div>

            <AnimatePresence mode="wait">
              <TabsContent value="contact">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Simple Contact Form"
                    description="Basic form with schema validation and standard field types"
                    preview={<contactForm.Form className="space-y-4" />}
                    code={contactFormCode}
                    codeTitle="Contact Form Implementation"
                    codeDescription="Simple form setup with Zod schema validation and basic field configuration"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="profile">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Enhanced Profile Form"
                    description="Profile form with animated wrappers and advanced field types"
                    preview={<profileForm.Form className="space-y-4" />}
                    code={profileFormCode}
                    codeTitle="Profile Form with Enhanced Features"
                    codeDescription="Form with custom animated wrappers, date picker, and various field types"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="survey">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Survey with Custom Components"
                    description="Advanced form featuring slider, switch components, and custom validation"
                    preview={<surveyForm.Form className="space-y-4" />}
                    code={surveyFormCode}
                    codeTitle="Survey Form with Custom Components"
                    codeDescription="Advanced form showcasing slider input, switch toggle, and enhanced validation"
                  />
                </motion.div>
              </TabsContent>

              <TabsContent value="registration">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DemoCard
                    title="Multi-Page Registration"
                    description="Complete registration flow with custom progress indicator and page navigation"
                    preview={<registrationForm.Form className="space-y-4" />}
                    code={registrationFormCode}
                    codeTitle="Multi-Page Registration Implementation"
                    codeDescription="Complete multi-step form with custom progress tracking and page transitions"
                  />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.section>

        {/* Component API */}
        <motion.section 
          className="container mx-auto px-4 py-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Code className="w-6 h-6" />
                Component API Reference
              </CardTitle>
              <CardDescription>
                Complete TypeScript interface for the useFormedible hook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Hook Return Value</h4>
                <div className="relative group">
                  <CodeBlock code={`const {
  form,           // TanStack Form instance
  Form,           // React component
  currentPage,    // Current page number
  totalPages,     // Total pages count
  goToNextPage,   // Navigate forward
  goToPreviousPage, // Navigate back
  setCurrentPage, // Jump to page
  isFirstPage,    // Boolean
  isLastPage,     // Boolean
  progressValue   // Progress 0-100
} = useFormedible(options);`}/>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyButton text={`const {
  form,           // TanStack Form instance
  Form,           // React component
  currentPage,    // Current page number
  totalPages,     // Total pages count
  goToNextPage,   // Navigate forward
  goToPreviousPage, // Navigate back
  setCurrentPage, // Jump to page
  isFirstPage,    // Boolean
  isLastPage,     // Boolean
  progressValue   // Progress 0-100
} = useFormedible(options);`} />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Supported Field Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {['text', 'email', 'password', 'textarea', 'select', 'checkbox', 'switch', 'number', 'date', 'slider', 'file', 'url'].map(type => (
                    <motion.code
                      key={type}
                      className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        navigator.clipboard.writeText(type);
                        toast.success(`"${type}" copied!`);
                      }}
                    >
                      {type}
                    </motion.code>
                  ))}
                </div>
              </div>
              <motion.div 
                className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg"
                whileHover={{ scale: 1.01 }}
              >
                <h4 className="font-semibold mb-2">Key Features</h4>
                <ul className="text-sm space-y-1">
                  <li>✅ Full TypeScript support with TanStack Form integration</li>
                  <li>✅ Zod schema validation with real-time error handling</li>
                  <li>✅ Component override system for custom field implementations</li>
                  <li>✅ Global and per-field wrapper components for animations</li>
                  <li>✅ Multi-page forms with progress tracking and navigation</li>
                  <li>✅ Conditional field rendering based on form state</li>
                  <li>✅ All shadcn/ui components included and configured</li>
                </ul>
              </motion.div>
            </CardContent>
          </Card>
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