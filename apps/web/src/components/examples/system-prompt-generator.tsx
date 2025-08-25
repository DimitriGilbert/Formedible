"use client";

import { useFormedible } from "@/hooks/use-formedible";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, Copy, Check, Bot } from "lucide-react";

// Create schema for AI system prompt configuration
const systemPromptSchema = z.object({
  // Core Library Features
  includeInstallation: z.boolean(),
  includeBasicUsage: z.boolean(),
  includeFieldTypes: z.boolean(),
  includeValidation: z.boolean(),
  includeMultiPage: z.boolean(),
  includeConditionalLogic: z.boolean(),
  includeTabs: z.boolean(),
  includeAdvancedFeatures: z.boolean(),

  // Field Types Selection
  selectFieldTypes: z.boolean(),
  selectedFieldTypes: z.array(z.string()),

  // Use Cases & Examples
  includeBasicExamples: z.boolean(),
  includeAdvancedExamples: z.boolean(),
  includeRealWorldExamples: z.boolean(),

  // AI Assistant Guidance
  includeTypeScript: z.boolean(),
  includePerformance: z.boolean(),
  includeBestPractices: z.boolean(),
  includeCommonMistakes: z.boolean(),
  includeMigrationGuide: z.boolean(),

  // Custom Instructions
  customInstructions: z.string().optional(),
  targetAudience: z.enum(["beginner", "intermediate", "advanced", "all"]),
  focusArea: z.enum([
    "general",
    "enterprise",
    "rapid-prototyping",
    "complex-forms",
    "mobile-first",
  ]),
});

type SystemPromptFormValues = z.infer<typeof systemPromptSchema>;

// Available field types from Formedible (based on README.md)
const availableFieldTypes = [
  "text",
  "email",
  "url",
  "textarea",
  "number",
  "date",
  "select",
  "multiSelect",
  "checkbox",
  "switch",
  "radio",
  "slider",
  "rating",
  "phone",
  "colorPicker",
  "file",
  "array",
  "autocomplete",
  "location",
  "duration",
  "masked",
  "object",
  "password",
];

export function SystemPromptGenerator() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generateCustomSystemPrompt = (
    values: SystemPromptFormValues
  ): string => {
    const parts: string[] = [
      "# Formedible AI Assistant Guide\n\n",
      "You are an AI assistant specialized in helping developers use the Formedible React form library.\n\n",
      "## About Formedible\n\n",
      "Formedible is a powerful, declarative React hook that wraps TanStack Form and integrates with Zod for validation and shadcn/ui for components. It simplifies creating complex, type-safe, and beautiful forms with minimal boilerplate.\n\n",
    ];

    if (values.includeInstallation) {
      parts.push(
        "## Installation\n\n",
        "**Via shadcn CLI (Recommended):**\n",
        "```bash\n",
        "npx shadcn@latest add formedible.dev/r/use-formedible.json\n",
        "```\n\n",
        "This automatically installs the useFormedible hook, all field components, and required dependencies.\n\n"
      );
    }

    if (values.includeBasicUsage) {
      parts.push(
        "## Basic Usage Pattern\n\n",
        "Always follow this pattern when creating forms:\n\n",
        "1. Define a Zod schema for validation and type safety\n",
        "2. Use `z.infer<typeof schema>` to get TypeScript types\n",
        "3. Configure fields array with field definitions\n",
        "4. Pass schema, fields, and formOptions to useFormedible\n",
        "5. Render the returned `<Form />` component\n\n",
        "**Basic Example:**\n",
        "```tsx\n",
        "const schema = z.object({\n",
        '  name: z.string().min(2, "Name must be at least 2 characters"),\n',
        '  email: z.string().email("Please enter a valid email"),\n',
        "});\n\n",
        "type FormValues = z.infer<typeof schema>;\n\n",
        "const { Form } = useFormedible<FormValues>({\n",
        "  schema,\n",
        "  fields: [\n",
        '    { name: "name", type: "text", label: "Full Name" },\n',
        '    { name: "email", type: "email", label: "Email" },\n',
        "  ],\n",
        "  formOptions: {\n",
        '    defaultValues: { name: "", email: "" },\n',
        "    onSubmit: async ({ value }) => {\n",
        '      console.log("Form submitted:", value);\n',
        "      // Handle submission\n",
        "    },\n",
        "  },\n",
        "});\n\n",
        "return <Form />;\n",
        "```\n\n"
      );
    }

    if (values.includeFieldTypes) {
      const fieldTypesToInclude = values.selectFieldTypes
        ? values.selectedFieldTypes
        : availableFieldTypes;
      parts.push(
        "## Available Field Types\n\n",
        `Formedible supports ${
          fieldTypesToInclude.length > 20
            ? "over 20"
            : fieldTypesToInclude.length
        } field types:\n\n`
      );

      const fieldTypeDescriptions: Record<string, string> = {
        text: "- **text**: Standard text input with placeholder and validation support\n",
        email: "- **email**: Email input with built-in email validation\n",
        url: "- **url**: URL input with URL validation\n",
        textarea: "- **textarea**: Multi-line text with textareaConfig (rows, maxLength, showWordCount)\n",
        number: "- **number**: Number input with numberConfig (min, max, step, precision)\n",
        date: "- **date**: Date picker with calendar and dateConfig options\n",
        select: "- **select**: Dropdown selection with searchable options\n",
        multiSelect: "- **multiSelect**: Multiple selection dropdown with search and multiSelectConfig\n",
        checkbox: "- **checkbox**: Boolean checkbox input\n",
        switch: "- **switch**: Toggle switch with smooth animations\n",
        radio: "- **radio**: Radio button group with horizontal/vertical layout\n",
        slider: "- **slider**: Interactive range slider with custom visualizations and click-to-select\n",
        rating: "- **rating**: Star rating component with half stars and custom icons\n",
        phone: "- **phone**: International phone input with country selection and phoneConfig\n",
        colorPicker: "- **colorPicker**: Color picker with HEX/RGB/HSL formats and preset colors\n",
        file: "- **file**: File upload with drag & drop, multiple files, and size limits\n",
        array: "- **array**: Dynamic array of fields with add/remove and drag & drop sorting\n",
        autocomplete: "- **autocomplete**: Text input with suggestions and autocompleteConfig\n",
        location: "- **location**: Map-based location picker with geolocation support\n",
        duration: "- **duration**: Time duration input with multiple formats\n",
        masked: "- **masked**: Formatted text input with custom masks (phone, date, credit card)\n",
        object: "- **object**: Nested object fields with collapsible sections\n",
        password: "- **password**: Password input with toggle visibility and strength meter\n",
      };

      fieldTypesToInclude.forEach((fieldType) => {
        parts.push(
          fieldTypeDescriptions[fieldType] ||
            `- **${fieldType}**: ${fieldType} field type\n`
        );
      });
      parts.push("\n");
    }

    // Add validation section if requested
    if (values.includeValidation) {
      parts.push(
        "## Validation with Zod\n\n",
        "Formedible uses Zod schemas for both runtime validation and TypeScript type safety:\n\n",
        "```tsx\n",
        "const contactSchema = z.object({\n",
        '  name: z.string().min(2, "Name must be at least 2 characters"),\n',
        '  email: z.string().email("Please enter a valid email"),\n',
        '  subject: z.enum(["general", "support", "sales"]),\n',
        '  message: z.string().min(10, "Message must be at least 10 characters"),\n',
        "  urgent: z.boolean().default(false),\n",
        "});\n\n",
        "// Advanced validation patterns:\n",
        "const advancedSchema = z.object({\n",
        '  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/, "Must contain uppercase, lowercase, and number"),\n',
        "  confirmPassword: z.string(),\n",
        '  age: z.number().min(18, "Must be 18 or older"),\n',
        '  skills: z.array(z.string()).min(1, "Select at least one skill"),\n',
        "}).refine((data) => data.password === data.confirmPassword, {\n",
        '  message: "Passwords don\'t match",\n',
        '  path: ["confirmPassword"],\n',
        "});\n",
        "```\n\n"
      );
    }

    // Add multi-page forms if requested
    if (values.includeMultiPage) {
      parts.push(
        "## Multi-Page Forms\n\n",
        "Create step-by-step forms with built-in navigation and progress tracking:\n\n",
        "```tsx\n",
        "const { Form } = useFormedible({\n",
        "  schema: registrationSchema,\n",
        "  fields: [\n",
        '    { name: "firstName", type: "text", label: "First Name", page: 1 },\n',
        '    { name: "lastName", type: "text", label: "Last Name", page: 1 },\n',
        '    { name: "email", type: "email", label: "Email", page: 2 },\n',
        '    { name: "phone", type: "phone", label: "Phone", page: 2 },\n',
        "  ],\n",
        "  pages: [\n",
        '    { page: 1, title: "Personal Info", description: "Basic information" },\n',
        '    { page: 2, title: "Contact Details", description: "How to reach you" },\n',
        "  ],\n",
        "  progress: { showSteps: true, showPercentage: true },\n",
        "  nextLabel: 'Continue →',\n",
        "  previousLabel: '← Back',\n",
        "  // ... rest of config\n",
        "});\n",
        "```\n\n"
      );
    }

    // Add conditional logic if requested
    if (values.includeConditionalLogic) {
      parts.push(
        "## Conditional Logic\n\n",
        "Show/hide fields and entire sections based on form values:\n\n",
        "```tsx\n",
        "const { Form } = useFormedible({\n",
        "  fields: [\n",
        '    { name: "userType", type: "select", options: ["individual", "business"] },\n',
        "    {\n",
        '      name: "companyName",\n',
        '      type: "text",\n',
        '      label: "Company Name",\n',
        '      conditional: (values) => values.userType === "business"\n',
        "    },\n",
        "    {\n",
        '      name: "taxId",\n',
        '      type: "text",\n',
        '      label: "Tax ID",\n',
        '      conditional: (values) => values.userType === "business"\n',
        "    },\n",
        "  ],\n",
        "  // Dynamic options based on form state:\n",
        "  fields: [\n",
        '    { name: "country", type: "select", options: countries },\n',
        "    {\n",
        '      name: "state",\n',
        '      type: "select",\n',
        "      options: (values) => getStatesForCountry(values.country),\n",
        '      conditional: (values) => !!values.country\n',
        "    }\n",
        "  ]\n",
        "});\n",
        "```\n\n"
      );
    }

    // Add tabbed forms if requested
    if (values.includeTabs) {
      parts.push(
        "## Tabbed Forms\n\n",
        "Organize forms into logical tabs for better UX:\n\n",
        "```tsx\n",
        "const { Form } = useFormedible({\n",
        "  schema: userProfileSchema,\n",
        "  fields: [\n",
        '    { name: "firstName", type: "text", tab: "personal" },\n',
        '    { name: "lastName", type: "text", tab: "personal" },\n',
        '    { name: "email", type: "email", tab: "contact" },\n',
        '    { name: "phone", type: "phone", tab: "contact" },\n',
        '    { name: "role", type: "select", tab: "work", options: roles },\n',
        "  ],\n",
        "  tabs: [\n",
        '    { tab: "personal", title: "Personal Info", icon: User },\n',
        '    { tab: "contact", title: "Contact Details", icon: Mail },\n',
        '    { tab: "work", title: "Work Info", icon: Briefcase },\n',
        "  ]\n",
        "});\n",
        "```\n\n"
      );
    }

    // Add advanced features if requested
    if (values.includeAdvancedFeatures) {
      parts.push(
        "## Advanced Features\n\n",
        "**Analytics & Tracking:**\n",
        "```tsx\n",
        "const analytics = {\n",
        "  onFormStart: (timestamp) => console.log('Form started'),\n",
        "  onFieldFocus: (field, timestamp) => console.log(`Field ${field} focused`),\n",
        "  onPageChange: (from, to, timeSpent) => console.log('Page changed'),\n",
        "  onFormComplete: (timeSpent, data) => console.log('Form completed')\n",
        "};\n\n",
        "const { Form } = useFormedible({ analytics, ... });\n",
        "```\n\n",
        "**Form Persistence:**\n",
        "```tsx\n",
        "const persistence = {\n",
        '  key: "user-form",\n',
        "  storage: 'localStorage',\n",
        "  exclude: ['password', 'confirmPassword']\n",
        "};\n\n",
        "const { Form } = useFormedible({ persistence, ... });\n",
        "```\n\n",
        "**Cross-Field Validation:**\n",
        "```tsx\n",
        "const schema = z.object({\n",
        "  password: z.string().min(8),\n",
        "  confirmPassword: z.string()\n",
        "}).refine(data => data.password === data.confirmPassword, {\n",
        '  message: "Passwords must match",\n',
        '  path: ["confirmPassword"]\n',
        "});\n",
        "```\n\n"
      );
    }

    // Add basic examples if requested
    if (values.includeBasicExamples) {
      parts.push(
        "## Basic Examples\n\n",
        "**Contact Form:**\n",
        "```tsx\n",
        "const contactSchema = z.object({\n",
        '  name: z.string().min(2, "Name required"),\n',
        '  email: z.string().email("Valid email required"),\n',
        '  subject: z.enum(["general", "support", "sales"]),\n',
        '  message: z.string().min(10, "Message too short")\n',
        "});\n\n",
        "const { Form } = useFormedible({\n",
        "  schema: contactSchema,\n",
        "  fields: [\n",
        '    { name: "name", type: "text", label: "Full Name" },\n',
        '    { name: "email", type: "email", label: "Email" },\n',
        '    { name: "subject", type: "select", label: "Subject", options: [...] },\n',
        '    { name: "message", type: "textarea", label: "Message" }\n',
        "  ]\n",
        "});\n",
        "```\n\n"
      );
    }

    // Add advanced examples if requested
    if (values.includeAdvancedExamples) {
      parts.push(
        "## Advanced Examples\n\n",
        "**Multi-Step Registration with Analytics:**\n",
        "```tsx\n",
        "const { Form } = useFormedible({\n",
        "  schema: registrationSchema,\n",
        "  fields: [...personalInfo, ...contactDetails, ...preferences],\n",
        "  pages: [\n",
        '    { page: 1, title: "Personal", description: "Basic info" },\n',
        '    { page: 2, title: "Contact", description: "How to reach you" },\n',
        '    { page: 3, title: "Preferences", description: "Customize experience" }\n',
        "  ],\n",
        "  analytics: trackingConfig,\n",
        "  persistence: { key: 'registration', storage: 'localStorage' }\n",
        "});\n",
        "```\n\n",
        "**Dynamic Array Fields:**\n",
        "```tsx\n",
        "const projectSchema = z.object({\n",
        "  teamMembers: z.array(z.object({\n",
        "    name: z.string(),\n",
        "    email: z.string().email(),\n",
        "    role: z.string()\n",
        "  })).min(1)\n",
        "});\n\n",
        "// Field definition:\n",
        "{\n",
        '  name: "teamMembers",\n',
        '  type: "array",\n',
        '  label: "Team Members",\n',
        "  arrayConfig: {\n",
        "    fields: [\n",
        '      { name: "name", type: "text", label: "Name" },\n',
        '      { name: "email", type: "email", label: "Email" },\n',
        '      { name: "role", type: "select", options: roles }\n',
        "    ]\n",
        "  }\n",
        "}\n",
        "```\n\n"
      );
    }

    // Add real-world examples if requested
    if (values.includeRealWorldExamples) {
      parts.push(
        "## Real-World Examples\n\n",
        "**E-commerce Checkout:**\n",
        "- Multi-page checkout flow with shipping and payment\n",
        "- Conditional payment fields based on payment method\n",
        "- Address validation and auto-complete\n",
        "- Order summary with real-time calculations\n\n",
        "**Job Application Portal:**\n",
        "- Skills selection with search and categories\n",
        "- File upload for resume and portfolio\n",
        "- Conditional questions based on position type\n",
        "- Form persistence across browser sessions\n\n",
        "**Survey Platform:**\n",
        "- Rating scales and satisfaction metrics\n",
        "- Conditional branching based on responses\n",
        "- Progress tracking and completion analytics\n",
        "- Dynamic question ordering\n\n"
      );
    }

    // Add TypeScript guidance if requested
    if (values.includeTypeScript) {
      parts.push(
        "## TypeScript Best Practices\n\n",
        "**Always use type inference from Zod schemas:**\n",
        "```tsx\n",
        "const schema = z.object({ name: z.string(), age: z.number() });\n",
        "type FormValues = z.infer<typeof schema>; // ✅ Type-safe\n\n",
        "const { Form } = useFormedible<FormValues>({ schema, ... });\n",
        "```\n\n",
        "**Extend BaseFieldProps for custom components:**\n",
        "```tsx\n",
        "interface CustomFieldProps extends BaseFieldProps {\n",
        "  customProp: string;\n",
        "}\n",
        "```\n\n",
        "**Use strict typing for options:**\n",
        "```tsx\n",
        "const priorities = ['low', 'medium', 'high'] as const;\n",
        "type Priority = typeof priorities[number]; // \"low\" | \"medium\" | \"high\"\n",
        "```\n\n"
      );
    }

    // Add performance tips if requested
    if (values.includePerformance) {
      parts.push(
        "## Performance Optimization\n\n",
        "**Memoize expensive computations:**\n",
        "```tsx\n",
        "const expensiveOptions = useMemo(() => \n",
        "  computeOptions(data), [data]\n",
        ");\n",
        "```\n\n",
        "**Use callback memoization for analytics:**\n",
        "```tsx\n",
        "const analytics = useMemo(() => ({\n",
        "  onFormStart: useCallback((timestamp) => { ... }, []),\n",
        "  onFieldFocus: useCallback((field, timestamp) => { ... }, [])\n",
        "}), []);\n",
        "```\n\n",
        "**Lazy load large option sets:**\n",
        "```tsx\n",
        "const loadCountries = async () => {\n",
        "  const response = await fetch('/api/countries');\n",
        "  return response.json();\n",
        "};\n",
        "```\n\n"
      );
    }

    // Add best practices if requested
    if (values.includeBestPractices) {
      parts.push(
        "## Best Practices\n\n",
        "**Form Structure:**\n",
        "- Break complex forms into logical pages or sections\n",
        "- Use clear, descriptive labels and help text\n",
        "- Group related fields together\n",
        "- Provide immediate validation feedback\n\n",
        "**Validation Strategy:**\n",
        "- Use Zod for both runtime and compile-time validation\n",
        "- Provide clear, actionable error messages\n",
        "- Validate on blur for better UX\n",
        "- Use cross-field validation for related fields\n\n",
        "**Accessibility:**\n",
        "- Ensure proper ARIA labels and descriptions\n",
        "- Support keyboard navigation\n",
        "- Provide clear focus indicators\n",
        "- Test with screen readers\n\n",
        "**Performance:**\n",
        "- Memoize callbacks and computed values\n",
        "- Lazy load large datasets\n",
        "- Use persistence for long forms\n",
        "- Implement proper loading states\n\n"
      );
    }

    // Add common mistakes if requested
    if (values.includeCommonMistakes) {
      parts.push(
        "## Common Mistakes to Avoid\n\n",
        "❌ **Don't:** Define schemas inside component render\n",
        "✅ **Do:** Define schemas outside component or use useMemo\n\n",
        "❌ **Don't:** Use \"any\" type for form values\n",
        "✅ **Do:** Use proper TypeScript inference from Zod\n\n",
        "❌ **Don't:** Create new callback functions on every render\n",
        "✅ **Do:** Use useCallback or useMemo for stable references\n\n",
        "❌ **Don't:** Put all fields on one page for complex forms\n",
        "✅ **Do:** Use multi-page forms with logical grouping\n\n",
        "❌ **Don't:** Ignore accessibility requirements\n",
        "✅ **Do:** Test with keyboard navigation and screen readers\n\n",
        "❌ **Don't:** Use default browser validation messages\n",
        "✅ **Do:** Provide clear, contextual error messages\n\n"
      );
    }

    // Add audience-specific guidance
    if (values.targetAudience !== 'all') {
      parts.push(`\n## Guidance for ${values.targetAudience.charAt(0).toUpperCase() + values.targetAudience.slice(1)} Developers\n\n`);
      
      switch (values.targetAudience) {
        case 'beginner':
          parts.push(
            "**Getting Started Tips:**\n",
            "- Start with simple single-page forms\n",
            "- Focus on basic field types first\n",
            "- Use the shadcn CLI for easy installation\n",
            "- Follow the examples closely before customizing\n",
            "- Test forms thoroughly in different browsers\n\n"
          );
          break;
        case 'intermediate':
          parts.push(
            "**Intermediate Patterns:**\n",
            "- Implement conditional logic and dynamic options\n",
            "- Use multi-page forms for better UX\n",
            "- Add form persistence for longer forms\n",
            "- Implement proper error handling and loading states\n",
            "- Optimize performance with memoization\n\n"
          );
          break;
        case 'advanced':
          parts.push(
            "**Advanced Techniques:**\n",
            "- Create custom field components extending BaseFieldProps\n",
            "- Implement complex validation with cross-field dependencies\n",
            "- Build reusable form patterns and abstractions\n",
            "- Integrate with state management solutions\n",
            "- Implement advanced analytics and tracking\n\n"
          );
          break;
      }
    }

    // Add focus area specific guidance
    if (values.focusArea !== 'general') {
      parts.push(`\n## ${values.focusArea.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Focus\n\n`);
      
      switch (values.focusArea) {
        case 'enterprise':
          parts.push(
            "**Enterprise Considerations:**\n",
            "- Implement comprehensive validation and error handling\n",
            "- Use form persistence for workflow interruptions\n",
            "- Add analytics for user behavior insights\n",
            "- Ensure accessibility compliance (WCAG 2.1)\n",
            "- Design for multiple user roles and permissions\n",
            "- Implement audit trails and form versioning\n\n"
          );
          break;
        case 'rapid-prototyping':
          parts.push(
            "**Rapid Prototyping Tips:**\n",
            "- Use shadcn CLI for quick component installation\n",
            "- Start with basic field types and add complexity later\n",
            "- Leverage default styling and behaviors\n",
            "- Use mock data for testing different scenarios\n",
            "- Focus on core functionality before styling\n\n"
          );
          break;
        case 'complex-forms':
          parts.push(
            "**Complex Form Strategies:**\n",
            "- Break forms into logical pages or sections\n",
            "- Implement conditional logic to reduce cognitive load\n",
            "- Use array fields for dynamic data collection\n",
            "- Add progress indicators and save functionality\n",
            "- Implement comprehensive validation with clear feedback\n",
            "- Use analytics to identify completion bottlenecks\n\n"
          );
          break;
        case 'mobile-first':
          parts.push(
            "**Mobile-First Development:**\n",
            "- Use single-column layouts with clear spacing\n",
            "- Implement touch-friendly field components\n",
            "- Optimize for thumb navigation and input\n",
            "- Use appropriate input types for mobile keyboards\n",
            "- Test on various screen sizes and orientations\n",
            "- Consider offline functionality with persistence\n\n"
          );
          break;
      }
    }

    // Add custom instructions if provided
    if (values.customInstructions?.trim()) {
      parts.push(
        "## Custom Instructions\n\n",
        values.customInstructions.trim() + "\n\n"
      );
    }

    parts.push("---\n", "*Generated by Formedible AI System Prompt Generator*");

    return parts.join("");
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const { Form } = useFormedible<SystemPromptFormValues>({
    schema: systemPromptSchema,
    fields: [
      // Page 1: Core Features
      {
        name: "includeBasicUsage",
        type: "switch",
        label: "Basic Usage Pattern",
        description: "Include schema definition and basic form setup",
        page: 1,
      },
      {
        name: "includeValidation",
        type: "switch",
        label: "Validation Patterns",
        description: "Include Zod schema validation examples",
        page: 1,
      },
      {
        name: "includeFieldTypes",
        type: "switch",
        label: "Field Types Reference",
        description: "Include available field types documentation",
        page: 1,
      },
      {
        name: "includeInstallation",
        type: "switch",
        label: "Installation Instructions",
        description: "Include shadcn CLI installation guide",
        page: 1,
        defaultValue: false,
      },

      // Page 2: Advanced Features
      {
        name: "includeMultiPage",
        type: "switch",
        label: "Multi-Page Forms",
        description: "Include multi-step form examples",
        page: 2,
        section: {
          title: "Advanced Form Features",
          description: "Complex form patterns and layouts",
        },
      },
      {
        name: "includeConditionalLogic",
        type: "switch",
        label: "Conditional Logic",
        description: "Include conditional field visibility examples",
        page: 2,
      },
      {
        name: "includeTabs",
        type: "switch",
        label: "Tabbed Forms",
        description: "Include tab-based form organization",
        page: 2,
      },
      {
        name: "includeAdvancedFeatures",
        type: "switch",
        label: "Advanced Features",
        description:
          "Include analytics, persistence, and other advanced features",
        page: 2,
      },

      // Page 3: Field Types Selection
      {
        name: "selectFieldTypes",
        type: "switch",
        label: "Select Specific Field Types",
        description: "Choose which field types to include in documentation",
        page: 3,
        section: {
          title: "Field Types Configuration",
          description: "Customize which field types to include",
        },
      },
      {
        name: "selectedFieldTypes",
        type: "multiSelect",
        label: "Field Types to Include",
        description: "Select which field types to document",
        page: 3,
        conditional: (values: any) => values.selectFieldTypes === true,
        options: availableFieldTypes.map((type) => ({
          value: type,
          label: type.charAt(0).toUpperCase() + type.slice(1),
        })),
        multiSelectConfig: {
          searchable: true,
          maxSelections: availableFieldTypes.length,
        },
      },

      // Page 4: Examples & Guidance
      {
        name: "includeBasicExamples",
        type: "switch",
        label: "Basic Examples",
        description: "Include simple form examples",
        page: 4,
        section: {
          title: "Examples & Use Cases",
          description: "Code examples and implementation patterns",
        },
      },
      {
        name: "includeAdvancedExamples",
        type: "switch",
        label: "Advanced Examples",
        description: "Include complex form examples",
        page: 4,
      },
      {
        name: "includeRealWorldExamples",
        type: "switch",
        label: "Real-World Examples",
        description: "Include production-ready form examples",
        page: 4,
      },

      // Page 5: AI Guidance Configuration
      {
        name: "includeTypeScript",
        type: "switch",
        label: "TypeScript Best Practices",
        description: "Include TypeScript guidance and type safety tips",
        page: 5,
        section: {
          title: "AI Assistant Guidance",
          description: "Configure how the AI should help users",
        },
      },
      {
        name: "includePerformance",
        type: "switch",
        label: "Performance Tips",
        description: "Include performance optimization guidance",
        page: 5,
      },
      {
        name: "includeBestPractices",
        type: "switch",
        label: "Best Practices",
        description: "Include recommended patterns and practices",
        page: 5,
      },
      {
        name: "includeCommonMistakes",
        type: "switch",
        label: "Common Mistakes",
        description: "Include list of common mistakes to avoid",
        page: 5,
      },
      {
        name: "targetAudience",
        type: "select",
        label: "Target Audience",
        description: "Tailor content for specific skill level",
        page: 5,
        options: [
          { value: "all", label: "All Skill Levels" },
          { value: "beginner", label: "Beginner Developers" },
          { value: "intermediate", label: "Intermediate Developers" },
          { value: "advanced", label: "Advanced Developers" },
        ],
      },
      {
        name: "focusArea",
        type: "select",
        label: "Focus Area",
        description: "Emphasize specific use cases or patterns",
        page: 5,
        options: [
          { value: "general", label: "General Purpose" },
          { value: "enterprise", label: "Enterprise Applications" },
          { value: "rapid-prototyping", label: "Rapid Prototyping" },
          { value: "complex-forms", label: "Complex Forms" },
          { value: "mobile-first", label: "Mobile-First Development" },
        ],
      },

      // Page 6: Custom Instructions
      {
        name: "customInstructions",
        type: "textarea",
        label: "Custom Instructions",
        description: "Additional instructions or context for the AI assistant",
        placeholder: "Add any specific guidance, constraints, or context...",
        page: 6,
        section: {
          title: "Customization",
          description: "Add custom instructions and requirements",
        },
        textareaConfig: {
          rows: 6,
          maxLength: 2000,
          showWordCount: true,
        },
      },
    ],

    pages: [
      {
        page: 1,
        title: "Core Features",
        description: "Basic Formedible concepts and usage patterns",
      },
      {
        page: 2,
        title: "Advanced Features",
        description: "Complex form patterns and advanced functionality",
      },
      {
        page: 3,
        title: "Field Types",
        description: "Configure which field types to include in documentation",
      },
      {
        page: 4,
        title: "Examples",
        description: "Select types of examples and use cases to include",
      },
      {
        page: 5,
        title: "AI Guidance",
        description: "Configure how the AI assistant should help users",
      },
      {
        page: 6,
        title: "Custom Instructions",
        description: "Add specific guidance and requirements",
      },
    ],

    progress: {
      showSteps: true,
      showPercentage: true,
      className: "mb-8",
    },

    formOptions: {
      defaultValues: {
        // Core Features
        includeInstallation: false,
        includeBasicUsage: true,
        includeFieldTypes: true,
        includeValidation: true,

        // Advanced Features
        includeMultiPage: true,
        includeConditionalLogic: true,
        includeTabs: false,
        includeAdvancedFeatures: false,

        // Field Types
        selectFieldTypes: true,
        selectedFieldTypes: availableFieldTypes,

        // Examples
        includeBasicExamples: true,
        includeAdvancedExamples: false,
        includeRealWorldExamples: false,

        // AI Guidance
        includeTypeScript: true,
        includePerformance: false,
        includeBestPractices: true,
        includeCommonMistakes: true,
        includeMigrationGuide: false,
        targetAudience: "all",
        focusArea: "general",

        // Custom
        customInstructions: "",
      },
      onSubmit: async ({ value }) => {
        const prompt = generateCustomSystemPrompt(value);
        setGeneratedPrompt(prompt);
        setIsSubmitted(true);
      },
    },

    nextLabel: "Continue →",
    previousLabel: "← Back",
    submitLabel: "Generate AI Assistant Prompt",
    formClassName: "max-w-2xl mx-auto",
  });

  if (isSubmitted) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-purple-700">
            AI System Prompt Ready! 🤖
          </CardTitle>
          <CardDescription className="text-lg">
            Your customized Formedible AI assistant prompt is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy System Prompt
                </>
              )}
            </Button>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Generate Another Prompt
            </Button>
          </div>

          {/* Generated content with scrollbar */}
          <div className="mt-6 p-4 bg-muted rounded-lg max-h-96 overflow-auto">
            <pre className="text-sm whitespace-pre-wrap">{generatedPrompt}</pre>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">
            Formedible AI Assistant Prompt Generator
          </h1>
        </div>
      </div>

      <Form />
    </div>
  );
}

export const systemPromptCode = `
// System Prompt Generator for Formedible AI Assistant
const systemPromptSchema = z.object({
  // Core Library Features
  includeInstallation: z.boolean(),
  includeBasicUsage: z.boolean(),
  includeFieldTypes: z.boolean(),
  includeValidation: z.boolean(),
  includeMultiPage: z.boolean(),
  includeConditionalLogic: z.boolean(),
  includeTabs: z.boolean(),
  includeAdvancedFeatures: z.boolean(),
  
  // Field Types Selection
  selectFieldTypes: z.boolean(),
  selectedFieldTypes: z.array(z.string()),
  
  // Examples & Use Cases
  includeBasicExamples: z.boolean(),
  includeAdvancedExamples: z.boolean(),
  includeRealWorldExamples: z.boolean(),
  
  // AI Assistant Guidance
  includeTypeScript: z.boolean(),
  includePerformance: z.boolean(),
  includeBestPractices: z.boolean(),
  includeCommonMistakes: z.boolean(),
  targetAudience: z.enum(["beginner", "intermediate", "advanced", "all"]),
  focusArea: z.enum(["general", "enterprise", "rapid-prototyping", "complex-forms", "mobile-first"]),
  
  // Customization
  customInstructions: z.string().optional(),
});

export function SystemPromptGenerator() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const generateCustomSystemPrompt = (values) => {
    // Generate AI assistant prompt based on:
    // - Selected Formedible features to include
    // - Target audience and focus area
    // - Code examples and best practices
    // - Custom instructions and requirements
    // - Content from README.md and llm.txt
    return formedibleAIPrompt;
  };

  const { Form } = useFormedible({
    schema: systemPromptSchema,
    
    fields: [
      // 6 pages covering:
      // - Core Formedible features
      // - Advanced form capabilities
      // - Field type selection
      // - Examples and use cases
      // - AI guidance configuration
      // - Custom instructions
    ],
    
    pages: [
      { page: 1, title: "Core Features", description: "Basic concepts" },
      { page: 2, title: "Advanced Features", description: "Complex patterns" },
      { page: 3, title: "Field Types", description: "Available field types" },
      { page: 4, title: "Examples", description: "Code examples" },
      { page: 5, title: "AI Guidance", description: "Assistant configuration" },
      { page: 6, title: "Custom Instructions", description: "Additional requirements" }
    ],
    
    formOptions: {
      defaultValues: {
        includeBasicUsage: true,
        includeFieldTypes: true,
        includeBestPractices: true,
        targetAudience: "all",
        focusArea: "general"
      },
      onSubmit: async ({ value }) => {
        const prompt = generateCustomSystemPrompt(value);
        setGeneratedPrompt(prompt);
        setIsSubmitted(true);
      },
    },
    
    progress: { showSteps: true, showPercentage: true },
    nextLabel: "Continue →",
    previousLabel: "← Back", 
    submitLabel: "Generate Formedible AI Prompt!"
  });

  // Success state with copy-to-clipboard functionality
  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Formedible AI System Prompt Ready! 🤖</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copy AI Assistant Prompt
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <Form />;
}
`;
