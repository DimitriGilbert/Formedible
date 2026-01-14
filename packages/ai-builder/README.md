# Formedible AI Builder

> **AI-Powered Form Generation** - Create sophisticated forms from natural language descriptions using cutting-edge AI providers.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![AI](https://img.shields.io/badge/AI-Powered-purple)](https://github.com/DimitriGilbert/Formedible)

The **Formedible AI Builder** is an AI-powered form generation tool that creates complete, production-ready Formedible forms from natural language descriptions. It features a chat interface, multi-provider AI support, real-time form generation, and safe code parsing.

## 🎯 Why AI Builder?

Building complex forms can be time-consuming. With AI Builder, you can:

- 🤖 **Describe Instead of Code** - Tell AI what you want in plain English
- ⚡ **Instant Generation** - Get working forms in seconds
- 🔄 **Iterate Quickly** - Refine forms through conversation
- 🎨 **Production Ready** - Generated code is clean and ready to use
- 🧠 **Multi-Provider** - Choose from OpenAI, Anthropic, Google, Mistral, or custom backends

## ⚡ Key Features

### 🤖 **AI-Powered Generation**
- Natural language form descriptions
- Intelligent field type selection
- Automatic validation rules
- Smart default values

### 💬 **Chat Interface**
- Conversational form building
- Real-time AI responses
- Context-aware suggestions
- Message history

### 🌐 **Multi-Provider Support**
- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus
- **Google** - Gemini Pro, Gemini 1.5
- **Mistral** - Mistral Large, Mistral Medium
- **OpenRouter** - Access to multiple models
- **Custom Backend** - Bring your own AI service

### 🔒 **Safe Code Parsing**
- Uses Formedible Parser for security
- Sanitizes AI-generated code
- Validates field configurations
- Prevents code injection

### 🎨 **Live Preview**
- Real-time form rendering
- Interactive form testing
- Multi-page navigation
- Responsive design preview

### 💾 **Conversation Management**
- Save conversation history
- Resume form building sessions
- Export conversations
- Share form designs

### ⚙️ **Configurable Settings**
- AI provider selection
- Model configuration
- Temperature and token settings
- Parser options

## 📦 Installation

### Via shadcn CLI (Recommended)

```bash
npx shadcn@latest add https://formedible.dev/r/ai-builder.json
```

This installs:
- AIBuilder component
- ChatInterface component
- AiFormRenderer component
- All required dependencies including parser

### Via npm

```bash
npm install formedible-ai-builder
# Also install peer dependencies
npm install formedible formedible-parser react react-dom zod @tanstack/react-form ai
```

## 🏃‍♂️ Quick Start

### Basic Usage with OpenAI

```tsx
import { AIBuilder } from '@/components/formedible/ai/ai-builder';

export default function AIBuilderPage() {
  return (
    <div className="container mx-auto p-4">
      <AIBuilder
        provider="openai"
        apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY}
      />
    </div>
  );
}
```

### With Custom Configuration

```tsx
import { AIBuilder } from '@/components/formedible/ai/ai-builder';

export default function AIBuilderPage() {
  const handleFormGenerated = (config: UseFormedibleOptions) => {
    console.log('Generated form:', config);
    // Save to database, export, etc.
  };

  return (
    <div className="container mx-auto p-4">
      <AIBuilder
        provider="anthropic"
        apiKey={process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY}
        model="claude-3-5-sonnet-20241022"
        onFormGenerated={handleFormGenerated}
        temperature={0.7}
        maxTokens={4000}
      />
    </div>
  );
}
```

### Backend Mode (Custom AI Service)

```tsx
import { AIBuilder } from '@/components/formedible/ai/ai-builder';

export default function AIBuilderPage() {
  return (
    <div className="container mx-auto p-4">
      <AIBuilder
        mode="backend"
        backendUrl="/api/ai/generate-form"
      />
    </div>
  );
}
```

## 🤖 AI Providers

### OpenAI

```tsx
<AIBuilder
  provider="openai"
  apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY}
  model="gpt-4-turbo-preview"
/>
```

**Available Models:**
- `gpt-4-turbo-preview` - Latest GPT-4 Turbo
- `gpt-4` - GPT-4
- `gpt-3.5-turbo` - GPT-3.5 Turbo

### Anthropic (Claude)

```tsx
<AIBuilder
  provider="anthropic"
  apiKey={process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY}
  model="claude-3-5-sonnet-20241022"
/>
```

**Available Models:**
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (Latest)
- `claude-3-opus-20240229` - Claude 3 Opus
- `claude-3-sonnet-20240229` - Claude 3 Sonnet

### Google (Gemini)

```tsx
<AIBuilder
  provider="google"
  apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY}
  model="gemini-1.5-pro-latest"
/>
```

**Available Models:**
- `gemini-1.5-pro-latest` - Gemini 1.5 Pro
- `gemini-pro` - Gemini Pro

### Mistral

```tsx
<AIBuilder
  provider="mistral"
  apiKey={process.env.NEXT_PUBLIC_MISTRAL_API_KEY}
  model="mistral-large-latest"
/>
```

**Available Models:**
- `mistral-large-latest` - Mistral Large
- `mistral-medium-latest` - Mistral Medium

### OpenRouter

```tsx
<AIBuilder
  provider="openrouter"
  apiKey={process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}
  model="anthropic/claude-3.5-sonnet"
/>
```

## 💬 Using the Chat Interface

### Example Prompts

**Simple Contact Form:**
```
Create a contact form with name, email, and message fields
```

**Complex Registration:**
```
I need a multi-step registration form:
Page 1: Personal info (first name, last name, email, phone)
Page 2: Company details (company name, job title, industry)
Page 3: Preferences (notifications toggle, newsletter checkbox)

Add appropriate validation for all fields.
```

**Advanced Features:**
```
Create a job application form with:
- Basic info section (name, email, phone)
- An array field for work experience (company, position, duration)
- A file upload for resume
- A rating field for self-assessment
- Conditional fields: if experience > 5 years, show "Senior" checkbox
```

### Refining Forms

```
User: Make the email field required
AI: [Updates form with required email validation]

User: Add a phone number field with international format
AI: [Adds phone field with phoneConfig]

User: Change the layout to a 2-column grid
AI: [Updates layout configuration]
```

## 🔧 Components

### AIBuilder

The main AI builder component.

```tsx
interface AIBuilderProps {
  // AI Provider Configuration
  provider?: 'openai' | 'anthropic' | 'google' | 'mistral' | 'openrouter';
  apiKey?: string;
  model?: string;

  // Backend Mode
  mode?: 'frontend' | 'backend';
  backendUrl?: string;

  // AI Settings
  temperature?: number;      // 0.0 - 1.0 (default: 0.7)
  maxTokens?: number;        // Max response tokens

  // Parser Configuration
  parserOptions?: ParserOptions;

  // Callbacks
  onFormGenerated?: (config: UseFormedibleOptions) => void;
  onError?: (error: Error) => void;

  // UI
  className?: string;
  showSettings?: boolean;    // Show settings panel
  showHistory?: boolean;     // Show conversation history
}
```

### ChatInterface

Standalone chat component for AI interactions.

```tsx
interface ChatInterfaceProps {
  provider: AIProvider;
  apiKey: string;
  model: string;
  onMessageGenerated?: (message: string) => void;
  className?: string;
}
```

### AiFormRenderer

Component that safely renders AI-generated forms.

```tsx
interface AiFormRendererProps {
  code: string;              // AI-generated form code
  parserOptions?: ParserOptions;
  onError?: (error: Error) => void;
  className?: string;
}
```

## 🎨 Example Generations

### Contact Form

**Prompt:** "Create a simple contact form"

**Generated:**
```tsx
{
  schema: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email required"),
    message: z.string().min(10, "Message must be at least 10 characters")
  }),
  fields: [
    { name: "name", type: "text", label: "Full Name" },
    { name: "email", type: "email", label: "Email Address" },
    { name: "message", type: "textarea", label: "Your Message" }
  ]
}
```

### Multi-Step Survey

**Prompt:** "Create a 3-page customer satisfaction survey"

**Generated:**
```tsx
{
  schema: z.object({
    satisfaction: z.number().min(1).max(5),
    recommend: z.boolean(),
    improvements: z.string(),
    contactMe: z.boolean(),
    email: z.string().email().optional()
  }),
  fields: [
    {
      name: "satisfaction",
      type: "rating",
      label: "How satisfied are you?",
      page: 1,
      ratingConfig: { max: 5, icon: "star" }
    },
    {
      name: "recommend",
      type: "switch",
      label: "Would you recommend us?",
      page: 2
    },
    {
      name: "improvements",
      type: "textarea",
      label: "Suggestions for improvement",
      page: 2
    },
    {
      name: "contactMe",
      type: "checkbox",
      label: "Contact me about my feedback",
      page: 3
    },
    {
      name: "email",
      type: "email",
      label: "Email Address",
      page: 3,
      conditional: (values) => values.contactMe === true
    }
  ],
  pages: [
    { page: 1, title: "Your Satisfaction" },
    { page: 2, title: "Your Feedback" },
    { page: 3, title: "Follow Up" }
  ]
}
```

## 🔒 Security

The AI Builder uses the Formedible Parser to ensure safe code execution:

- **Sanitization** - Removes dangerous code patterns
- **Validation** - Validates all field configurations
- **Type Safety** - Ensures type-safe form generation
- **Error Handling** - Graceful error recovery

## ⚙️ Configuration

### Parser Options

```tsx
<AIBuilder
  parserOptions={{
    strict: true,           // Strict validation
    allowFunctions: false,  // Disallow functions
    maxDepth: 10,          // Max nesting depth
    validateRefs: true     // Validate field references
  }}
/>
```

### AI Settings

```tsx
<AIBuilder
  temperature={0.7}      // Creativity (0.0 - 1.0)
  maxTokens={4000}       // Response length
  topP={0.9}            // Nucleus sampling
/>
```

## 📖 Documentation

For complete documentation:

- [AI Builder Guide](https://formedible.dev/docs/ai-builder)
- [Getting Started](https://formedible.dev/docs/getting-started)
- [Parser Documentation](https://formedible.dev/docs/formedible-parser)
- [Examples](https://formedible.dev/docs/examples)

## 🔗 Related Packages

- [@formedible/core](../formedible) - Core form library
- [@formedible/builder](../builder) - Visual form builder
- [@formedible/parser](../formedible-parser) - Form definition parser (required)

## 🤝 Contributing

This is part of a monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes in `packages/ai-builder/`
4. Run tests: `npm run test`
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

Built for the Formedible ecosystem:
- [Formedible](../formedible) - The core form library
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI provider integration
- [Formedible Parser](../formedible-parser) - Safe code parsing

---

**Formedible AI Builder** - Form generation powered by AI. 🤖