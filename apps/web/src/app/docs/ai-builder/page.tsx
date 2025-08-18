"use client";

import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Eye,
  Code,
  Sparkles,
  Zap,
  Shield,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DocCard } from "@/components/doc-card";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function AiBuilderPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const darkMode = currentTheme === 'dark';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
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
                <Bot className="w-3 h-3 mr-1" />
                AI Builder
              </Badge>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                AI-Powered Form Builder
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Generate forms from natural language descriptions using AI.
                Simply describe what you need, and watch as AI creates a fully functional form.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Chat Interface</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/8 to-muted-foreground/8 rounded-full border">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Multiple Providers</span>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="mt-16">
              <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to try AI Builder?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Start creating forms with AI. Just bring your own API key and describe what you need.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/ai-builder">Open AI Builder</Link>
                  </Button>
                </div>
              </div>
            </div>

            <DocCard
              title="Getting Started"
              description="Learn how to use the AI Builder to create forms from natural language."
              icon={Sparkles}
            >
              <p className="text-muted-foreground mb-6">
                The AI Builder allows you to create forms by simply describing what you need.
                Configure your AI provider, start a conversation, and watch as your form comes to life.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Usage</h3>
                <CodeBlock
                  code={`import { AiBuilder } from '@/components/formedible/ai/ai-builder';

export default function MyAiBuilderPage() {
  return (
    <div className="min-h-screen">
      <AiBuilder />
    </div>
  );
}`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Example Prompts</h3>
                <div className="space-y-2">
                  <div className="border-l-4 border-primary/20 pl-4">
                    <p className="font-medium">Simple Contact Form</p>
                    <p className="text-sm text-muted-foreground">
                      "Create a contact form with name, email, subject, and message fields"
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <p className="font-medium">Job Application</p>
                    <p className="text-sm text-muted-foreground">
                      "Build a job application form with personal info, work experience, and file upload for resume"
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <p className="font-medium">Survey Form</p>
                    <p className="text-sm text-muted-foreground">
                      "Design a customer satisfaction survey with rating scales and multiple choice questions"
                    </p>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="AI Provider Configuration"
              description="Configure your AI provider to start generating forms."
              icon={Settings}
            >
              <p className="text-muted-foreground mb-6">
                The AI Builder supports multiple AI providers. Choose your preferred provider and configure your API key to get started.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Supported Providers</h3>
                <div className="space-y-2">
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>OpenAI</strong>
                    <p className="text-sm text-muted-foreground">
                      GPT-4, GPT-3.5 Turbo - Requires API key from OpenAI
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>Anthropic</strong>
                    <p className="text-sm text-muted-foreground">
                      Claude 3.5 Sonnet, Claude 3 - Requires API key from Anthropic
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>Google</strong>
                    <p className="text-sm text-muted-foreground">
                      Gemini Pro, Gemini Flash - Requires API key from Google AI
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>Mistral</strong>
                    <p className="text-sm text-muted-foreground">
                      Mistral Large, Mistral Small - Requires API key from Mistral
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>OpenRouter</strong>
                    <p className="text-sm text-muted-foreground">
                      Access to multiple models via OpenRouter - Requires API key from OpenRouter
                    </p>
                  </div>
                  <div className="border-l-4 border-primary/20 pl-4">
                    <strong>OpenAI Compatible</strong>
                    <p className="text-sm text-muted-foreground">
                      Custom endpoints supporting OpenAI API format (Ollama, LocalAI, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Chat Interface"
              description="Use natural language to describe and refine your forms."
              icon={MessageSquare}
            >
              <p className="text-muted-foreground mb-6">
                The chat interface allows you to have a conversation with AI about your form requirements.
                You can ask for modifications, add new fields, or completely redesign the form.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Conversation Flow</h3>
                <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">👤</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">Create a registration form for a fitness app</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">I'll create a fitness app registration form with essential fields...</p>
                      <div className="mt-2 p-2 bg-background rounded border text-xs">
                        Form generated with fields: Full Name, Email, Password, Age, Fitness Level, Goals
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">👤</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">Add a phone number field and make the goals field multi-select</p>
                    </div>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Form Preview & Code Export"
              description="See your form in real-time and export the generated code."
              icon={Eye}
            >
              <p className="text-muted-foreground mb-6">
                As AI generates your form, you can see it in real-time in the preview panel.
                The generated code is also available for copy-paste into your projects.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Generated Output</h3>
                <CodeBlock
                  code={`// Example of generated form code
import { useFormedible } from 'formedible';
import { z } from 'zod';

const formSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().min(13, 'Must be at least 13 years old'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  goals: z.array(z.string()).min(1, 'Select at least one goal'),
  phone: z.string().optional(),
});

const fields = [
  { name: 'fullName', type: 'text', label: 'Full Name', required: true },
  { name: 'email', type: 'email', label: 'Email Address', required: true },
  { name: 'password', type: 'password', label: 'Password', required: true },
  { name: 'age', type: 'number', label: 'Age', min: 13, required: true },
  { name: 'fitnessLevel', type: 'select', label: 'Fitness Level', 
    options: ['beginner', 'intermediate', 'advanced'], required: true },
  { name: 'goals', type: 'multiSelect', label: 'Fitness Goals',
    options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility'], required: true },
  { name: 'phone', type: 'phone', label: 'Phone Number' },
];

export default function FitnessRegistrationForm() {
  const { Form } = useFormedible({
    schema: formSchema,
    fields,
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
    },
  });

  return <Form />;
}`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>
            </DocCard>

            <DocCard
              title="Security & Privacy"
              description="Your API keys and data stay secure with client-side processing."
              icon={Shield}
            >
              <p className="text-muted-foreground mb-6">
                The AI Builder is designed with security and privacy in mind. All processing happens
                client-side, and your API keys are stored locally in your browser.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Security Features</h3>
                <div className="space-y-2">
                  <div className="border-l-4 border-green-500/20 pl-4">
                    <strong>Client-Side Only</strong>
                    <p className="text-sm text-muted-foreground">
                      All AI processing happens directly in your browser - no server-side storage
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500/20 pl-4">
                    <strong>Local Storage</strong>
                    <p className="text-sm text-muted-foreground">
                      API keys are stored securely in your browser's local storage
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500/20 pl-4">
                    <strong>Bring Your Own Key</strong>
                    <p className="text-sm text-muted-foreground">
                      Use your own API keys - we never see or store them
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500/20 pl-4">
                    <strong>No Data Collection</strong>
                    <p className="text-sm text-muted-foreground">
                      Your form data and conversations are not collected or analyzed
                    </p>
                  </div>
                </div>
              </div>
            </DocCard>

            <DocCard
              title="Advanced Usage"
              description="Customize the AI Builder for your specific use cases."
              icon={Code}
            >
              <p className="text-muted-foreground mb-6">
                The AI Builder can be customized and integrated into your applications.
                You can also use the parsing utilities independently.
              </p>

              <div>
                <h3 className="font-semibold text-lg mb-3">Custom Configuration</h3>
                <CodeBlock
                  code={`import { AiBuilder } from '@/components/formedible/ai/ai-builder';

// Custom configuration
<AiBuilder 
  initialProvider="anthropic"
  showCodeView={true}
  onFormGenerated={(formData) => {
    console.log('Form generated:', formData);
  }}
/>`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Using Parser Independently</h3>
                <CodeBlock
                  code={`import { parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';

// Parse AI-generated form definition
const aiResponse = \`{
  fields: [
    { name: 'email', type: 'email', label: 'Email Address', required: true },
    { name: 'message', type: 'textarea', label: 'Message', required: true }
  ]
}\`;

try {
  const { formDefinition, zodSchema } = parseAiToFormedible(aiResponse);
  console.log('Parsed form:', formDefinition);
  console.log('Zod schema:', zodSchema);
} catch (error) {
  console.error('Failed to parse form:', error);
}`}
                  language="tsx"
                  darkMode={darkMode}
                />
              </div>
            </DocCard>
          </div>

          <div className="mt-16">
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Build Forms with AI?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Experience the future of form building. Describe what you need,
                and let AI handle the rest.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/ai-builder">Open AI Builder</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/docs/getting-started">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}