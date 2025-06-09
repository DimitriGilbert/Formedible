"use client";

import React from "react";
import { useFormedible } from "@/hooks/useFormedible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, Book, Star, Download, Code, Zap, Shield, Users, Sparkles } from "lucide-react";
import { z } from "zod";

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
  interests: z.array(z.string()).min(1, "Select at least one interest"),
});

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
    formOptions: {
      defaultValues: { 
        name: "",
        email: "",
        message: "",
        newsletter: false 
      },
      onSubmit: async ({ value }) => {
        console.log("Contact form submitted:", value);
        alert("Thank you for your message!");
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
    globalWrapper: AnimatedFieldWrapper,
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
        alert("Profile updated successfully!");
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
    formOptions: {
      defaultValues: { 
        satisfaction: 5,
        recommend: true,
        feedback: "",
        category: ""
      },
      onSubmit: async ({ value }) => {
        console.log("Survey submitted:", value);
        alert("Thank you for your feedback!");
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
    globalWrapper: AnimatedFieldWrapper,
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
        interests: [],
      },
      onSubmit: async ({ value }) => {
        console.log("Registration completed:", value);
        alert("Registration completed successfully!");
      },
    },
    onPageChange: (page, direction) => {
      console.log(`Navigated to page ${page} via ${direction}`);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Formedible
                </h1>
                <p className="text-sm text-muted-foreground">Schema-driven forms made simple</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/DimitriGilbert/Formedible" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/r/use-formedible.json" target="_blank">
                  <Download className="w-4 h-4 mr-2" />
                  Registry
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Enhanced with v4 Features
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Build Forms with
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ultimate Power
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Now with schema validation, component overrides, custom wrappers, multi-page support, 
            and customizable progress indicators. The most powerful form library for React.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="#quick-start">
                <Code className="w-5 h-5 mr-2" />
                Get Started
              </a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8" asChild>
              <a href="#demo">
                <Sparkles className="w-5 h-5 mr-2" />
                Try Enhanced Demo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Schema Validation</CardTitle>
              <CardDescription>
                Built-in Zod schema validation with real-time error handling
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle>Component Override</CardTitle>
              <CardDescription>
                Replace any field component with your custom implementations
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Sparkles className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle>Custom Wrappers</CardTitle>
              <CardDescription>
                Add animations, special styling, or extra functionality to fields
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle>Multi-Page Forms</CardTitle>
              <CardDescription>
                Built-in pagination with customizable progress indicators
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Enhanced Demo Forms */}
      <section id="demo" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Enhanced Interactive Demo</h3>
          <p className="text-muted-foreground text-lg">
            Experience the full power of Formedible with these feature-rich examples
          </p>
        </div>

        <Tabs defaultValue="contact" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="contact">Contact Form</TabsTrigger>
            <TabsTrigger value="profile">User Profile</TabsTrigger>
            <TabsTrigger value="survey">Survey Form</TabsTrigger>
            <TabsTrigger value="registration">Multi-Page</TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <DemoCard
              title="Contact Us"
              description="Simple form with Zod schema validation"
              preview={<contactForm.Form className="space-y-4" />}
              code={contactFormCode}
              codeTitle="Contact Form Implementation"
              codeDescription="Basic form setup with schema validation and form handling"
            />
          </TabsContent>

          <TabsContent value="profile">
            <DemoCard
              title="User Profile"
              description="Enhanced profile form with animated field wrappers"
              preview={<profileForm.Form className="space-y-4" />}
              code={profileFormCode}
              codeTitle="Profile Form with Animations"
              codeDescription="Form with custom animated wrappers and enhanced field types"
            />
          </TabsContent>

          <TabsContent value="survey">
            <DemoCard
              title="Feedback Survey"
              description="Advanced form with slider and enhanced field types"
              preview={<surveyForm.Form className="space-y-4" />}
              code={surveyFormCode}
              codeTitle="Survey Form Implementation"
              codeDescription="Advanced form with slider, switch, and validation components"
            />
          </TabsContent>

          <TabsContent value="registration">
            <DemoCard
              title="Multi-Page Registration"
              description="Complete registration flow with custom progress indicator and page transitions"
              preview={<registrationForm.Form className="space-y-4" />}
              code={registrationFormCode}
              codeTitle="Multi-Page Registration Flow"
              codeDescription="Complete implementation with custom progress indicator and page transitions"
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Installation */}
      <section id="quick-start" className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">🚀 Quick Start - Enhanced Features</CardTitle>
            <CardDescription>
              Get started with the enhanced Formedible featuring schema validation, component overrides, and multi-page support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">1. Install from the registry</h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                npx shadcn@latest add {window.location.origin}/r/use-formedible
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Use with schema validation and enhanced features</h4>
              <CodeBlock code={`import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
});

const { Form } = useFormedible({
  schema,
  fields: [
    { name: "email", type: "email", label: "Email", page: 1 },
    { name: "password", type: "password", label: "Password", page: 2 },
  ],
  pages: [
    { page: 1, title: "Login Details" },
    { page: 2, title: "Security" },
  ],
  progress: { showSteps: true },
  globalWrapper: AnimatedWrapper,
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});

return <Form />;`}/>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">✨ New Features</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• <strong>Schema Validation:</strong> Built-in Zod support for type-safe validation</li>
                <li>• <strong>Component Override:</strong> Replace any field with custom components</li>
                <li>• <strong>Custom Wrappers:</strong> Add animations and special styling</li>
                <li>• <strong>Multi-Page Support:</strong> Built-in pagination with progress tracking</li>
                <li>• <strong>Conditional Fields:</strong> Show/hide fields based on form state</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Formedible</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Enhanced with ❤️ using shadcn/ui, TanStack Form, Zod, and Motion
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 