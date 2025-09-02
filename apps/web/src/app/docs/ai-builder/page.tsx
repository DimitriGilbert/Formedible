"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Book,
  Code,
  Zap,
  Bot,
  Sparkles,
  MessageSquare,
  Wand2,
  Settings,
  Eye,
  Download,
  Play,
  Cpu,
  Users,
  Globe,
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

export default function AIBuilderDocsPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const darkMode = currentTheme === "dark";

  const installationCode = `npx shadcn@latest add https://formedible.dev/r/ai-builder.json`;

  const basicUsageCode = `import { AIBuilder } from '@/components/ai-builder';

export default function App() {
  return (
    <div className="container mx-auto p-4">
      <AIBuilder 
        mode="direct"
        onFormGenerated={(formCode) => {
          console.log('Generated form code:', formCode);
        }}
        onFormSubmit={(formData) => {
          console.log('Form submitted:', formData);
        }}
      />
    </div>
  );
}`;

  const backendModeCode = `import { AIBuilder } from '@/components/ai-builder';

// Backend mode - no API keys in frontend
export default function ServerAIBuilder() {
  return (
    <AIBuilder 
      mode="backend"
      backendConfig={{
        endpoint: "/api/ai/generate-form",
        headers: {
          "Authorization": "Bearer your-server-token"
        }
      }}
      onFormGenerated={(formCode) => {
        // Handle generated form
        console.log('Form generated:', formCode);
      }}
    />
  );
}`;

  const customEndpointCode = `import { AIBuilder } from '@/components/ai-builder';

// Using OpenAI-compatible endpoint (like Ollama, LM Studio, etc.)
export default function LocalAIBuilder() {
  return (
    <AIBuilder 
      mode="direct"
      // Provider will be configured in the UI
      // Supports: OpenAI, Anthropic, Google, Mistral, OpenRouter, OpenAI-Compatible
      onFormGenerated={(formCode) => {
        // Extract and use the generated form
        console.log('Generated Formedible form:', formCode);
      }}
    />
  );
}`;

  const advancedUsageCode = `import { AIBuilder } from '@/components/ai-builder';

export default function AdvancedAIBuilder() {
  return (
    <AIBuilder 
      className="h-screen"
      mode="direct"
      onFormGenerated={(formCode) => {
        // Save or use the generated form
        localStorage.setItem('lastGeneratedForm', formCode);
      }}
      onFormSubmit={(formData) => {
        // Handle form submissions from preview
        submitToAPI(formData);
      }}
    />
  );
  
  async function submitToAPI(data: Record<string, unknown>) {
    await fetch('/api/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
}`;

  const features = [
    {
      icon: Bot,
      title: "Hybrid Architecture",
      description: "Local-first with direct API access or secure backend mode",
    },
    {
      icon: MessageSquare,
      title: "Conversational Interface",
      description: "Chat naturally to describe your forms and iterate on designs",
    },
    {
      icon: Eye,
      title: "Live Preview & Testing",
      description: "Real-time form preview with working submission handling",
    },
    {
      icon: Settings,
      title: "Multiple AI Providers",
      description: "OpenAI, Anthropic, Google, Mistral, OpenRouter, and custom endpoints",
    },
    {
      icon: Code,
      title: "Ready-to-Use Code",
      description: "Generated forms export as complete React components with Formedible",
    },
    {
      icon: Wand2,
      title: "Persistent Conversations",
      description: "Save, load, and export conversation history with generated forms",
    },
  ];

  const providers = [
    { name: "OpenAI", models: ["GPT-5", "GPT-5 Mini", "GPT-4o", "GPT-4o Mini"] },
    { name: "Anthropic", models: ["Claude Sonnet 4", "Claude 3.5 Sonnet", "Claude 3 Haiku"] },
    { name: "Google", models: ["Gemini 2.5 Pro", "Gemini 1.5 Pro", "Gemini 1.5 Flash"] },
    { name: "Mistral", models: ["Mistral Large 2407", "Mistral Medium", "Mistral Small"] },
    { name: "OpenRouter", models: ["200+ Models Available", "Dynamic Model Loading"] },
    { name: "OpenAI-Compatible", models: ["Ollama", "LM Studio", "Custom Endpoints"] },
  ];

  const modes = [
    {
      name: "Direct Mode",
      description: "Local-first with API keys stored in browser for privacy",
      icon: Globe,
    },
    {
      name: "Backend Mode", 
      description: "Server-side AI processing with secure API endpoint",
      icon: Cpu,
    },
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
                formedible-ai-builder
              </Badge>
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-muted-foreground bg-clip-text text-transparent">
                AI Form Builder
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Generate production-ready Formedible forms through natural conversation. Hybrid architecture 
                supports local-first privacy or secure server processing. Works with OpenAI, Anthropic, Google, 
                local models, and custom endpoints.
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
                    <CardTitle>Direct Mode (Local-First)</CardTitle>
                  </div>
                  <CardDescription>
                    API keys stored in browser for maximum privacy and control
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

              {/* Backend Mode */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <CardTitle>Backend Mode (Server-Side)</CardTitle>
                  </div>
                  <CardDescription>
                    Secure server processing with no API keys in the frontend
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={backendModeCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>

              {/* Custom Endpoints */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <CardTitle>Custom & Local Models</CardTitle>
                  </div>
                  <CardDescription>
                    Support for Ollama, LM Studio, and OpenAI-compatible endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    code={customEndpointCode}
                    language="typescript"
                    darkMode={darkMode}
                  />
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Architecture Modes */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8">Hybrid Architecture</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modes.map((mode, index) => (
                <motion.div
                  key={mode.name}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300">
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-muted-foreground/10 border">
                          <mode.icon className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-xl">{mode.name}</CardTitle>
                      <CardDescription className="text-center">
                        {mode.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Advanced Usage */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  <CardTitle>Advanced Usage</CardTitle>
                </div>
                <CardDescription>
                  Handle form generation events and integrate with your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={advancedUsageCode}
                  language="typescript"
                  darkMode={darkMode}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Providers */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Supported AI Providers</CardTitle>
                <CardDescription className="text-center">
                  Choose from multiple AI providers for form generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((provider) => (
                    <div key={provider.name} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-primary" />
                        {provider.name}
                      </h4>
                      <div className="space-y-1">
                        {provider.models.map((model) => (
                          <Badge key={model} variant="secondary" className="text-xs mr-1">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Key Features */}
          <motion.div
            className="mb-16"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">What Makes It Special</CardTitle>
                <CardDescription className="text-center">
                  Built for production use with privacy and flexibility in mind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Privacy-First</h4>
                        <p className="text-sm text-muted-foreground">API keys stored locally, never sent to Formedible servers</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Persistent Conversations</h4>
                        <p className="text-sm text-muted-foreground">Save, load, and export your chat history with generated forms</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Live Form Testing</h4>
                        <p className="text-sm text-muted-foreground">Test generated forms with real data and validation</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Production Ready</h4>
                        <p className="text-sm text-muted-foreground">Generated forms use Formedible components with proper validation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Local Model Support</h4>
                        <p className="text-sm text-muted-foreground">Works with Ollama, LM Studio, and custom OpenAI-compatible endpoints</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium">Intelligent Parsing</h4>
                        <p className="text-sm text-muted-foreground">Advanced parsing with error recovery and form optimization</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            className="text-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="bg-gradient-to-r from-primary/5 to-muted-foreground/5 p-8 rounded-xl border">
              <h3 className="text-2xl font-bold mb-4">Ready to Build Forms with AI?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                The AI Builder makes form creation as simple as having a conversation. 
                Describe what you need and watch as intelligent forms are generated in real-time.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/docs/getting-started">
                  <Button className="inline-flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    View Main Docs
                  </Button>
                </Link>
                <Link href="/docs/examples">
                  <Button variant="outline" className="inline-flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Try Examples
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