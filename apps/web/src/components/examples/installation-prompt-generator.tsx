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
import { Badge } from "@/components/ui/badge";
import { Terminal, Package, Code, Copy, Check, FileText } from "lucide-react";

const installationSchema = z.object({
  // Framework
  framework: z.enum(["nextjs", "react_vite", "react_cra", "remix", "astro"]),

  // Package Manager
  packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]),

  // TypeScript
  useTypeScript: z.boolean(),

  // Special Requirements
  hasSpecialRequirements: z.boolean(),
  specialRequirements: z.string().optional(),
});

type InstallationFormValues = z.infer<typeof installationSchema>;

export function InstallationPromptGenerator() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const generateInstallationPrompt = (
    values: InstallationFormValues
  ): string => {
    const {
      framework,
      packageManager,
      useTypeScript,
      hasSpecialRequirements,
      specialRequirements,
    } = values;

    const frameworkLabels = {
      nextjs: "Next.js",
      react_vite: "React with Vite",
      react_cra: "Create React App",
      remix: "Remix",
      astro: "Astro",
    };

    let prompt = `# 🚀 Formedible Installation Guide\n\n`;
    prompt += `## Framework: ${frameworkLabels[framework]}${
      useTypeScript ? " with TypeScript" : ""
    }\n\n`;

    // Prerequisites
    prompt += `## 📋 Prerequisites\n\n`;
    prompt += `- ${frameworkLabels[framework]} project${
      useTypeScript ? " with TypeScript" : ""
    }\n`;
    prompt += `- ${packageManager} package manager\n`;
    prompt += `- Tailwind CSS configured\n`;
    prompt += `- shadcn/ui components\n\n`;

    // Installation
    prompt += `## ⚡ Installation\n\n`;
    prompt += `### Using shadcn CLI (Recommended)\n\n`;
    prompt += `The fastest way to get started with Formedible:\n\n`;
    prompt += `\`\`\`bash\n`;
    prompt += `npx shadcn@latest add formedible.dev/r/use-formedible.json\n`;
    prompt += `\`\`\`\n\n`;
    prompt += `This will automatically install:\n`;
    prompt += `- The \`useFormedible\` hook\n`;
    prompt += `- All field components\n`;
    prompt += `- Required dependencies (@tanstack/react-form, zod)\n`;
    prompt += `- TypeScript definitions${useTypeScript ? " ✅" : ""}\n\n`;

    // Basic Usage
    prompt += `## 🎯 Quick Start Example\n\n`;
    prompt += `\`\`\`${useTypeScript ? "tsx" : "jsx"}\n`;
    prompt += `import { useFormedible } from "@/hooks/use-formedible";\n`;
    prompt += `import { z } from "zod";\n\n`;

    prompt += `const contactSchema = z.object({\n`;
    prompt += `  name: z.string().min(2, "Name must be at least 2 characters"),\n`;
    prompt += `  email: z.string().email("Please enter a valid email"),\n`;
    prompt += `  message: z.string().min(10, "Message must be at least 10 characters"),\n`;
    prompt += `});\n\n`;

    if (useTypeScript) {
      prompt += `type ContactFormValues = z.infer<typeof contactSchema>;\n\n`;
    }

    prompt += `export function ContactForm() {\n`;
    prompt += `  const { Form } = useFormedible${
      useTypeScript ? "<ContactFormValues>" : ""
    }({\n`;
    prompt += `    schema: contactSchema,\n`;
    prompt += `    fields: [\n`;
    prompt += `      { name: "name", type: "text", label: "Full Name", placeholder: "John Doe" },\n`;
    prompt += `      { name: "email", type: "email", label: "Email", placeholder: "john@example.com" },\n`;
    prompt += `      { name: "message", type: "textarea", label: "Message", placeholder: "Your message..." },\n`;
    prompt += `    ],\n`;
    prompt += `    formOptions: {\n`;
    prompt += `      defaultValues: { name: "", email: "", message: "" },\n`;
    prompt += `      onSubmit: async ({ value }) => {\n`;
    prompt += `        console.log("Form submitted:", value);\n`;
    prompt += `        // Handle submission\n`;
    prompt += `      },\n`;
    prompt += `    },\n`;
    prompt += `  });\n\n`;
    prompt += `  return <Form />;\n`;
    prompt += `}\n`;
    prompt += `\`\`\`\n\n`;

    // Special Requirements
    if (hasSpecialRequirements && specialRequirements) {
      prompt += `## 📝 Special Requirements\n\n`;
      prompt += `${specialRequirements}\n\n`;
    }

    // Next Steps
    prompt += `## 🚀 Next Steps\n\n`;
    prompt += `1. Create your first form using the example above\n`;
    prompt += `2. Explore different field types (slider, rating, phone, etc.)\n`;
    prompt += `3. Add validation with Zod schemas\n`;
    prompt += `4. Check out multi-page forms and conditional fields\n\n`;

    prompt += `## 📚 Resources\n\n`;
    prompt += `- [Documentation](https://formedible.dev/docs)\n`;
    prompt += `- [Examples](https://formedible.dev/examples)\n`;
    prompt += `- [GitHub Repository](https://github.com/DimitriGilbert/Formedible)\n\n`;

    prompt += `---\n`;
    prompt += `*Generated by Formedible Installation Generator*`;

    return prompt;
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

  const { Form } = useFormedible<InstallationFormValues>({
    schema: installationSchema,

    fields: [
      // Page 1: Project Setup
      {
        name: "framework",
        type: "select",
        label: "React Framework",
        description: "Choose your React framework",
        page: 1,
        options: [
          { value: "nextjs", label: "Next.js" },
          { value: "react_vite", label: "React + Vite" },
          { value: "react_cra", label: "Create React App" },
          { value: "remix", label: "Remix" },
          { value: "astro", label: "Astro" },
        ],
      },
      {
        name: "packageManager",
        type: "select",
        label: "Package Manager",
        description: "Used in installation commands",
        page: 1,
        options: [
          { value: "npm", label: "npm" },
          { value: "yarn", label: "Yarn" },
          { value: "pnpm", label: "pnpm" },
          { value: "bun", label: "Bun" },
        ],
      },
      {
        name: "useTypeScript",
        type: "switch",
        label: "TypeScript",
        description: "Does your project use TypeScript?",
        page: 1,
      },

      // Page 2: Special Requirements
      {
        name: "hasSpecialRequirements",
        type: "switch",
        label: "Special Requirements",
        description: "Any specific setup needs?",
        page: 2,
      },
      {
        name: "specialRequirements",
        type: "textarea",
        label: "Requirements Details",
        description: "Describe your specific requirements",
        page: 2,
        conditional: (values) => values.hasSpecialRequirements === true,
        textareaConfig: {
          rows: 4,
          maxLength: 500,
        },
      },
    ],

    pages: [
      {
        page: 1,
        title: "Project Setup",
        description: "Configure your project settings",
      },
      {
        page: 2,
        title: "Additional Requirements",
        description: "Any special setup needs?",
      },
    ],

    progress: {
      showSteps: true,
      showPercentage: true,
      className: "mb-8",
    },

    formOptions: {
      defaultValues: {
        framework: "nextjs",
        packageManager: "npm",
        useTypeScript: true,
        hasSpecialRequirements: false,
        specialRequirements: "",
      },

      onSubmit: async ({ value }) => {
        const prompt = generateInstallationPrompt(value);
        setGeneratedPrompt(prompt);
        setIsSubmitted(true);
      },
    },

    nextLabel: "Continue →",
    previousLabel: "← Back",
    submitLabel: "Generate Installation Guide",
    formClassName: "max-w-2xl mx-auto",
  });

  if (isSubmitted) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Installation Guide Ready! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Your Formedible setup instructions are ready
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
                  Copy Installation Guide
                </>
              )}
            </Button>
            <Button onClick={() => setIsSubmitted(false)} variant="outline">
              Generate Another Guide
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
          <Terminal className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Installation Guide Generator</h1>
        </div>
      </div>
      <Form />
    </div>
  );
}

export const installationPromptCode = `
const installationSchema = z.object({
  // Personal Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  
  // Project Details
  projectName: z.string().min(1, "Project name is required"),
  projectType: z.enum([
    "new_project",
    "existing_project", 
    "prototype",
    "learning",
    "production"
  ]),
  
  // Framework & Setup
  framework: z.enum([
    "nextjs",
    "react_vite",
    "react_cra", 
    "remix",
    "astro",
    "other_react"
  ]),
  
  // Package Manager
  packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]),
  
  // TypeScript
  useTypeScript: z.boolean(),
  
  // Styling
  styling: z.enum([
    "tailwind",
    "styled_components",
    "emotion",
    "css_modules", 
    "plain_css",
    "other"
  ]),
  
  // UI Library
  uiLibrary: z.enum([
    "shadcn_ui",
    "mui",
    "chakra",
    "mantine",
    "ant_design",
    "none",
    "other"
  ]),
  
  // Installation Method
  installMethod: z.enum(["shadcn_cli", "manual_npm"]),
  
  // Additional Features
  wantsPersistence: z.boolean(),
  wantsValidation: z.boolean(),
  wantsAnalytics: z.boolean(),
  
  // Experience Level
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  
  // Special Requirements
  hasSpecialRequirements: z.boolean(),
  specialRequirements: z.string().optional(),
});

export function InstallationPromptGenerator() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const generateInstallationPrompt = (values) => {
    // Generate personalized installation instructions
    // Based on user's framework, package manager, etc.
    return customizedInstructions;
  };

  const { Form } = useFormedible({
    schema: installationSchema,
    
    fields: [
      // 15 pages of questions about:
      // - Personal info (name)
      // - Project details (name, type)
      // - Tech stack (framework, package manager, TypeScript)
      // - Styling approach and UI library
      // - Installation preferences
      // - Advanced features needed
      // - Experience level
      // - Special requirements
    ],
    
    pages: [
      // 15 personalized pages with dynamic text
      // Using {{name}} and {{projectName}} throughout
    ],
    
    formOptions: {
      onSubmit: async ({ value }) => {
        const prompt = generateInstallationPrompt(value);
        setGeneratedPrompt(prompt);
        setIsSubmitted(true);
      },
    },
    
    // Progress tracking and navigation
    progress: { showSteps: true, showPercentage: true },
    nextLabel: "Continue →",
    previousLabel: "← Back", 
    submitLabel: "Generate My Installation Guide!"
  });

  // Success state with copy-to-clipboard functionality
  if (isSubmitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Installation Guide Ready! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Installation Guide
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <Form />;
}
`;
