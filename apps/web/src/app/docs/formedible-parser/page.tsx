"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Book,
  Code,
  Zap,
  Shield,
  CheckCircle,
  FileJson,
  Braces,
  AlertTriangle,
  Download,
  Play,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function FormedibleParserDocsPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const darkMode = currentTheme === "dark";

  const installationCode = `npx shadcn@latest add https://formedible.dev/r/formedible-parser.json`;

  const basicUsageCode = `import { FormedibleParser } from '@/components/formedible-parser';

// Main parsing method - supports JSON, JS objects, and Zod expressions
const formDefinition = \`{
  title: "Advanced Contact Form",
  fields: [
    {
      name: "email",
      type: "email", 
      label: "Email Address",
      required: true
    },
    {
      name: "rating",
      type: "rating",
      label: "Service Rating",
      ratingConfig: { max: 5, allowHalf: true, icon: "star" }
    },
    {
      name: "feedback",
      type: "textarea",
      label: "Detailed Feedback",
      textareaConfig: { rows: 4, maxLength: 500, showWordCount: true }
    }
  ],
  schema: "z.object({ email: z.string().email(), rating: z.number().optional(), feedback: z.string().optional() })"
}\`;

try {
  // Parse with default options
  const parsedConfig = FormedibleParser.parse(formDefinition);
  console.log('Parsed successfully:', parsedConfig);
} catch (error) {
  console.error('Enhanced error info:', error.message);
  // Shows detailed AI-friendly error messages with fixes
}`;

  const jsObjectCode = `// Complex field configurations with nested objects
const complexFormConfig = \`{
  title: "Team Registration Form", 
  fields: [
    {
      name: "teamLead",
      type: "object",
      label: "Team Lead Information",
      objectConfig: {
        title: "Team Lead Details",
        collapsible: true,
        layout: "vertical",
        fields: [
          { name: "name", type: "text", label: "Full Name", required: true },
          { name: "email", type: "email", label: "Email", required: true },
          { name: "phone", type: "phone", label: "Phone Number", phoneConfig: { defaultCountry: "US" } }
        ]
      }
    },
    {
      name: "teamMembers", 
      type: "array",
      label: "Team Members",
      arrayConfig: {
        itemType: "object",
        itemLabel: "Team Member",
        minItems: 1,
        maxItems: 10,
        sortable: true,
        objectConfig: {
          fields: [
            { name: "name", type: "text", label: "Name", required: true },
            { name: "role", type: "select", label: "Role", options: ["Developer", "Designer", "Manager"] },
            { name: "skills", type: "multiSelect", label: "Skills", options: ["React", "TypeScript", "Node.js", "Python"] }
          ]
        }
      }
    }
  ]
}\`;

const parsedConfig = FormedibleParser.parse(complexFormConfig);`;

  const zodSchemaCode = `// Advanced Zod parsing with nested expressions and chained methods
const zodFormConfig = \`{
  title: "User Registration with Complex Validation",
  fields: [
    {
      name: "email",
      type: "email", 
      label: "Email Address",
      required: true
    },
    {
      name: "password",
      type: "password",
      label: "Password",
      passwordConfig: { showToggle: true, strengthMeter: true }
    },
    {
      name: "confirmPassword", 
      type: "password",
      label: "Confirm Password"
    }
  ],
  // Complex chained Zod expressions are parsed correctly
  schema: "z.object({ 
    email: z.string().email().min(1, 'Required'), 
    password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string() 
  }).refine(data => data.password === data.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] })",
  crossFieldValidation: [
    {
      fields: ["password", "confirmPassword"],
      validator: "passwords-match",
      message: "Passwords must match exactly"
    }
  ]
}\`;

const parsedConfig = FormedibleParser.parse(zodFormConfig);`;

  const errorHandlingCode = `// Enhanced error handling with AI-friendly suggestions
const invalidConfig = \`{
  fields: [
    { name: "email", type: "invalid-type" },  // Invalid field type
    { name: "", type: "text" }                // Missing name
  ]
}\`;

try {
  const result = FormedibleParser.parse(invalidConfig);
} catch (error) {
  if (error.name === 'ParserError') {
    console.log('❌ Error Code:', error.code);
    console.log('📝 Enhanced message with examples:', error.message);
    // Shows detailed fix suggestions like:
    // ✅ Supported field types: text, email, password, url, tel, textarea...
    // 📝 Example: { name: "email", type: "email", label: "Email Address" }
    
    if (error.fieldIndex !== undefined) {
      console.log('🎯 Error in field #:', error.fieldIndex);
    }
  }
}

// Validation with suggestions - perfect for AI integrations
const validationResult = FormedibleParser.validateWithSuggestions(invalidConfig);
console.log('Is valid:', validationResult.isValid);
console.log('Errors:', validationResult.errors);
console.log('AI suggestions:', validationResult.suggestions);`;

  const advancedOptionsCode = `// Schema inference and merging capabilities
const formDefinition = \`{
  fields: [
    { name: "email", type: "email", label: "Email" },
    { name: "age", type: "number", label: "Age", min: 18, max: 120 }
  ]
}\`;

// Parse with automatic schema inference
const inferenceResult = FormedibleParser.parseWithSchemaInference(formDefinition, {
  enabled: true,
  defaultValidation: true,
  inferFromValues: true
});

console.log('Parsed config:', inferenceResult.config);
console.log('Inferred schema:', inferenceResult.inferredSchema);
console.log('Confidence score:', inferenceResult.confidence);

// Merge with existing schemas
import { z } from 'zod';
const baseSchema = z.object({
  firstName: z.string(),
  lastName: z.string()
});

const mergedConfig = FormedibleParser.mergeSchemas(
  inferenceResult.config,
  baseSchema,
  'extend'  // 'extend' | 'override' | 'intersect'
);

// Field type validation
console.log('Is valid type:', FormedibleParser.isValidFieldType('email')); // true
console.log('Supported types:', FormedibleParser.getSupportedFieldTypes()); // All 24 types`;

  const features = [
    {
      icon: Shield,
      title: "Advanced Security Sanitization", 
      description: "Removes eval, Function, setTimeout, dangerous patterns and protects against code injection",
    },
    {
      icon: Braces,
      title: "Complex Zod Expression Parsing",
      description: "Handles nested parentheses, chained methods like z.string().min(1).max(50), and complex validations",
    },
    {
      icon: AlertTriangle,
      title: "AI-Friendly Error Reporting",
      description: "Detailed error messages with fixes, examples, and suggestions specifically designed for AI integrations",
    },
    {
      icon: Zap,
      title: "Automatic Schema Inference",
      description: "Infers Zod schemas from field configurations with confidence scoring and validation",
    },
    {
      icon: CheckCircle,
      title: "24+ Field Type Support",
      description: "Complete support for all Formedible field types with complex configurations (array, object, phone, rating, etc.)",
    },
    {
      icon: FileJson,
      title: "Multiple Input Formats",
      description: "Parses JSON, JavaScript object literals, and Zod expressions with intelligent format detection",
    },
  ];

  const supportedTypes = [
    "text", "email", "password", "url", "tel", "textarea", "select", "checkbox",
    "switch", "number", "date", "slider", "file", "rating", "phone",
    "colorPicker", "location", "duration", "multiSelect", "autocomplete",
    "masked", "object", "array", "radio"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          className="max-w-6xl mx-auto"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6"
            >
              <Badge variant="secondary" className="mb-4">
                formedible-parser
              </Badge>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                Advanced Form Parser
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                A sophisticated 1700+ line parser for Formedible form definitions with advanced security sanitization, 
                complex Zod expression parsing, AI-friendly error reporting, automatic schema inference, and support for 
                all 24+ field types with location-aware debugging.
              </p>
            </motion.div>
          </div>

          {/* Quick Install */}
          <motion.div
            className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-6 rounded-xl border mb-16"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Download className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">
                Installation
              </h3>
            </div>
            <div className="bg-muted rounded-lg p-4 max-w-2xl mx-auto">
              <CodeBlock
                code={installationCode}
                language="bash"
                showPackageManagerTabs={true}
                darkMode={darkMode}
              />
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-muted-foreground/10 border">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </div>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Getting Started */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">Getting Started</h2>
            
            <div className="space-y-8">
              {/* Basic Usage */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    <CardTitle>Main Parsing API</CardTitle>
                  </div>
                  <CardDescription>
                    Parse form definitions with automatic security sanitization and enhanced error reporting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={basicUsageCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>

              {/* JavaScript Objects */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Braces className="w-5 h-5 text-primary" />
                    <CardTitle>Complex Field Configurations</CardTitle>
                  </div>
                  <CardDescription>
                    Handle nested object and array fields with comprehensive validation and type checking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={jsObjectCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>

              {/* Zod Schema */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <CardTitle>Advanced Zod Expression Parsing</CardTitle>
                  </div>
                  <CardDescription>
                    Parse complex chained Zod expressions, nested parentheses, and cross-field validation rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={zodSchemaCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Advanced Usage */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">Advanced Features</h2>
            
            <div className="space-y-8">
              {/* Error Handling */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    <CardTitle>AI-Friendly Error Reporting</CardTitle>
                  </div>
                  <CardDescription>
                    Enhanced error messages with detailed fixes, examples, and suggestions designed for AI integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={errorHandlingCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>

              {/* Schema Inference */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    <CardTitle>Schema Inference & Merging</CardTitle>
                  </div>
                  <CardDescription>
                    Automatic Zod schema inference, confidence scoring, and advanced schema merging strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={advancedOptionsCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>
              {/* Security Features */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <CardTitle>Security & Sanitization</CardTitle>
                  </div>
                  <CardDescription>
                    Advanced security measures protect against code injection and dangerous patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={`// The parser automatically sanitizes dangerous code patterns
const dangerousCode = \`{
  fields: [
    { 
      name: "email", 
      type: "email",
      validation: "eval('malicious code')",  // ❌ Automatically removed
      onSubmit: "setTimeout(() => { /* dangerous */ }, 1000)"  // ❌ Sanitized
    }
  ],
  onSubmit: "fetch('/api/steal-data')"  // ❌ Functions not supported in parser mode
}\`;

// Security patterns automatically removed:
// - eval, Function, setTimeout, setInterval
// - document, window, global, process  
// - __proto__, constructor, prototype
// - Arrow functions and function expressions
// - new keyword usage

const safeConfig = FormedibleParser.parse(dangerousCode);
// Result: Clean configuration object with dangerous patterns removed

// Location-aware error reporting for debugging
try {
  FormedibleParser.parse('{ invalid: syntax }');
} catch (error) {
  console.log('Error at line:', error.location?.line);
  console.log('Error at column:', error.location?.column);
  console.log('Field context:', error.location?.field);
}`}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* API Methods */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">Complete API Reference</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Available Methods</CardTitle>
                <CardDescription className="text-center">
                  All static methods available in the FormedibleParser class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`// ✅ Main API Methods (all static)
FormedibleParser.parse(code, options?)              // Main parsing method
FormedibleParser.parseWithSchemaInference(code, options?)  // With schema inference  
FormedibleParser.validateWithSuggestions(code)      // AI-friendly validation
FormedibleParser.mergeSchemas(config, baseSchema, strategy) // Schema merging
FormedibleParser.isValidFieldType(type)             // Field type validation
FormedibleParser.getSupportedFieldTypes()           // Get all supported types
FormedibleParser.validateConfig(config)             // Validate config object

// ✅ Supported merge strategies
'extend'    // Add missing fields from base schema
'override'  // Replace schema completely  
'intersect' // Keep only fields that exist in both

// ✅ All 24 supported field types
const fieldTypes = FormedibleParser.getSupportedFieldTypes();
console.log(fieldTypes);
// ['text', 'email', 'password', 'url', 'tel', 'textarea', 'select', 
//  'checkbox', 'switch', 'number', 'date', 'slider', 'file', 'rating',
//  'phone', 'colorPicker', 'location', 'duration', 'multiSelect',
//  'autocomplete', 'masked', 'object', 'array', 'radio']`}
                  language="typescript"
                  darkMode={darkMode}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Supported Field Types */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Supported Field Types</CardTitle>
                <CardDescription className="text-center">
                  All {supportedTypes.length} field types supported by Formedible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {supportedTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="justify-center">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            className="text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border">
              <h3 className="text-2xl font-bold mb-4">Ready to Parse Forms?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                The formedible-parser is a sophisticated 1700+ line implementation with advanced security sanitization, 
                complex Zod expression parsing, schema inference, AI-friendly error reporting, and comprehensive validation 
                for all 24+ field types. Perfect for AI integrations and enterprise applications.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/docs/getting-started">
                  <Button className="inline-flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    View Main Docs
                  </Button>
                </Link>
                <Link href="/docs/api">
                  <Button variant="outline" className="inline-flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    API Reference
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}