# Formedible Parser

> **Advanced Form Definition Parser** - A sophisticated, security-first parser for converting form definitions from various formats into validated Formedible configurations.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Security](https://img.shields.io/badge/Security-Hardened-green)](https://github.com/DimitriGilbert/Formedible)

The **Formedible Parser** is a standalone, security-focused parser (1700+ lines) that safely converts form definitions from JSON, JavaScript object literals, and Zod schema expressions into validated Formedible configurations. It's specifically designed to handle AI-generated code and user-provided configurations safely.

## 🎯 Why Formedible Parser?

When working with AI-generated forms or user-provided configurations, you need:

- 🔒 **Security** - Protection against code injection and malicious patterns
- 🧠 **Intelligence** - Parse complex Zod expressions and nested configurations
- 🎯 **Accuracy** - Support for all 24+ Formedible field types
- 💬 **AI-Friendly** - Detailed error messages with actionable fixes
- ⚡ **Performance** - Fast parsing with location-aware debugging

## ⚡ Key Features

### 🔒 Advanced Security Sanitization
Automatically removes dangerous patterns:
- `eval`, `Function`, `setTimeout`, `setInterval`
- `document`, `window`, `global`, `process`
- `__proto__`, `constructor`, `prototype`
- Arrow functions and function expressions
- `new` keyword usage

### 🧠 Complex Zod Expression Parsing
Handles sophisticated Zod validations:
- Chained methods: `z.string().min(1).max(50).email()`
- Nested parentheses and complex expressions
- Object refinements: `.refine()`, `.superRefine()`
- Cross-field validation rules

### 💬 AI-Friendly Error Reporting
Provides detailed, actionable error messages:
- Field-level error location (line, column)
- Suggested fixes with code examples
- Supported field type lists
- Best practice recommendations

### 📊 Automatic Schema Inference
Infers Zod schemas from field configurations:
- Type-based inference (email → `z.string().email()`)
- Validation rules (min, max, required)
- Confidence scoring for inferred schemas
- Merging strategies (extend, override, intersect)

### ✅ Comprehensive Validation
Supports all 24+ Formedible field types:
text, email, password, url, tel, textarea, number, date, slider, select, radio, checkbox, switch, multiSelect, combobox, multicombobox, rating, phone, colorPicker, file, array, object, autocomplete, location, duration, masked

## 📦 Installation

### Via shadcn CLI (Recommended)

```bash
npx shadcn@latest add https://formedible.dev/r/formedible-parser.json
```

### Via npm

```bash
npm install formedible-parser zod
```

## 🏃‍♂️ Quick Start

### Basic Parsing

```tsx
import { FormedibleParser } from '@/lib/formedible-parser';

// Parse JSON or JavaScript object literals
const formDefinition = `{
  title: "Contact Form",
  fields: [
    {
      name: "email",
      type: "email",
      label: "Email Address",
      required: true
    },
    {
      name: "message",
      type: "textarea",
      label: "Your Message",
      textareaConfig: { rows: 4, maxLength: 500 }
    }
  ],
  schema: "z.object({ email: z.string().email(), message: z.string() })"
}`;

try {
  const parsedConfig = FormedibleParser.parse(formDefinition);
  console.log('Parsed successfully:', parsedConfig);
} catch (error) {
  console.error('Parse error:', error.message);
}
```

### Complex Field Configurations

```tsx
// Parse nested objects and arrays
const complexConfig = `{
  fields: [
    {
      name: "teamLead",
      type: "object",
      label: "Team Lead",
      objectConfig: {
        fields: [
          { name: "name", type: "text", label: "Name", required: true },
          { name: "email", type: "email", label: "Email" },
          {
            name: "phone",
            type: "phone",
            label: "Phone",
            phoneConfig: { defaultCountry: "US" }
          }
        ]
      }
    },
    {
      name: "teamMembers",
      type: "array",
      label: "Team Members",
      arrayConfig: {
        itemType: "object",
        minItems: 1,
        maxItems: 10,
        sortable: true,
        objectConfig: {
          fields: [
            { name: "name", type: "text", label: "Member Name" },
            {
              name: "role",
              type: "select",
              label: "Role",
              options: ["Developer", "Designer", "Manager"]
            }
          ]
        }
      }
    }
  ]
}`;

const parsed = FormedibleParser.parse(complexConfig);
```

### Advanced Zod Parsing

```tsx
// Parse complex Zod schemas with chained methods
const zodConfig = `{
  fields: [
    { name: "email", type: "email", label: "Email" },
    { name: "password", type: "password", label: "Password" },
    { name: "confirmPassword", type: "password", label: "Confirm" }
  ],
  schema: "z.object({
    email: z.string().email().min(1, 'Required'),
    password: z.string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain number'),
    confirmPassword: z.string()
  }).refine(
    data => data.password === data.confirmPassword,
    { message: 'Passwords must match', path: ['confirmPassword'] }
  )"
}`;

const parsed = FormedibleParser.parse(zodConfig);
```

## 🔧 API Reference

### Main Methods

#### `FormedibleParser.parse(code, options?)`

Main parsing method that supports JSON, JS objects, and Zod expressions.

```tsx
const config = FormedibleParser.parse(formDefinition, {
  strict: true,           // Strict validation (default: true)
  allowFunctions: false,  // Allow function expressions (default: false)
  maxDepth: 10,          // Maximum nesting depth (default: 10)
});
```

**Returns:** `UseFormedibleOptions` - Valid Formedible configuration

**Throws:** `ParserError` - With detailed error information

#### `FormedibleParser.parseWithSchemaInference(code, options?)`

Parse with automatic Zod schema inference.

```tsx
const result = FormedibleParser.parseWithSchemaInference(formDefinition, {
  enabled: true,              // Enable inference
  defaultValidation: true,    // Add default validations
  inferFromValues: true,      // Infer from default values
});

console.log('Config:', result.config);
console.log('Inferred schema:', result.inferredSchema);
console.log('Confidence:', result.confidence); // 0-100
```

**Returns:**
```tsx
{
  config: UseFormedibleOptions,
  inferredSchema: z.ZodSchema | null,
  confidence: number,
  warnings: string[]
}
```

#### `FormedibleParser.validateWithSuggestions(code)`

Validate configuration with AI-friendly suggestions.

```tsx
const result = FormedibleParser.validateWithSuggestions(invalidConfig);

console.log('Valid:', result.isValid);
console.log('Errors:', result.errors);
console.log('Suggestions:', result.suggestions);
```

**Returns:**
```tsx
{
  isValid: boolean,
  errors: Array<{ field: string, message: string, location?: Location }>,
  suggestions: string[]
}
```

#### `FormedibleParser.mergeSchemas(config, baseSchema, strategy)`

Merge parsed configuration with existing Zod schema.

```tsx
import { z } from 'zod';

const baseSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

const merged = FormedibleParser.mergeSchemas(
  parsedConfig,
  baseSchema,
  'extend' // 'extend' | 'override' | 'intersect'
);
```

**Strategies:**
- `extend` - Add missing fields from base schema
- `override` - Replace schema completely
- `intersect` - Keep only fields that exist in both

#### `FormedibleParser.isValidFieldType(type)`

Check if a field type is supported.

```tsx
FormedibleParser.isValidFieldType('email'); // true
FormedibleParser.isValidFieldType('invalid'); // false
```

#### `FormedibleParser.getSupportedFieldTypes()`

Get all supported field types.

```tsx
const types = FormedibleParser.getSupportedFieldTypes();
// ['text', 'email', 'password', ...]
```

## 🛡️ Security Features

### Automatic Pattern Sanitization

The parser automatically removes dangerous patterns:

```tsx
const dangerousCode = `{
  fields: [{
    name: "email",
    type: "email",
    validation: "eval('malicious code')",        // ❌ Removed
    onSubmit: "setTimeout(() => hack(), 1000)"   // ❌ Removed
  }]
}`;

// Parser automatically sanitizes
const safeConfig = FormedibleParser.parse(dangerousCode);
// Result: Clean configuration with dangerous patterns removed
```

### Protected Patterns

- **Code Execution:** `eval`, `Function`, `setTimeout`, `setInterval`
- **Global Access:** `document`, `window`, `global`, `process`
- **Prototype Pollution:** `__proto__`, `constructor`, `prototype`
- **Dynamic Code:** Arrow functions, function expressions, `new` keyword

## 🎯 Error Handling

### Location-Aware Errors

```tsx
try {
  FormedibleParser.parse('{ invalid: syntax }');
} catch (error) {
  console.log('Error at line:', error.location?.line);
  console.log('Error at column:', error.location?.column);
  console.log('Field context:', error.location?.field);
  console.log('Enhanced message:', error.message);
}
```

### AI-Friendly Error Messages

Parser provides detailed, actionable error messages:

```tsx
// Invalid field type
// ❌ Error: Invalid field type "invalid-type"
// ✅ Supported types: text, email, password, url, tel, textarea...
// 📝 Example: { name: "email", type: "email", label: "Email Address" }

// Missing required field
// ❌ Error: Field "name" is required
// ✅ Add: name: "fieldName"
// 📝 Example: { name: "email", type: "email", label: "Email" }
```

## 📊 Schema Inference

### Automatic Type Inference

```tsx
const config = `{
  fields: [
    { name: "email", type: "email", label: "Email" },
    { name: "age", type: "number", label: "Age", min: 18, max: 120 },
    { name: "name", type: "text", label: "Name", required: true }
  ]
}`;

const result = FormedibleParser.parseWithSchemaInference(config, {
  enabled: true,
  defaultValidation: true,
});

// Inferred schema:
// z.object({
//   email: z.string().email(),
//   age: z.number().min(18).max(120),
//   name: z.string().min(1)
// })
```

### Confidence Scoring

The parser provides confidence scores for inferred schemas:

- **90-100:** High confidence - All fields have clear type mappings
- **70-89:** Medium confidence - Most fields inferred, some ambiguity
- **Below 70:** Low confidence - Many fields lack clear validation rules

## 🔧 Advanced Usage

### Custom Validation Options

```tsx
const config = FormedibleParser.parse(formDef, {
  strict: true,           // Strict validation mode
  allowFunctions: false,  // Disallow function expressions
  maxDepth: 10,          // Maximum nesting depth
  validateRefs: true,     // Validate field references
  requireLabels: false,   // Require labels for all fields
});
```

### Field Type Validation

```tsx
// Check if field types are valid
const fields = ['email', 'text', 'invalid'];
const valid = fields.filter(type =>
  FormedibleParser.isValidFieldType(type)
);
// Result: ['email', 'text']

// Get all supported types
const allTypes = FormedibleParser.getSupportedFieldTypes();
```

## 🏗️ Architecture

### Parser Pipeline

1. **Sanitization** - Remove dangerous patterns and code
2. **Parsing** - Convert string to object using safe eval
3. **Validation** - Validate against Formedible schema
4. **Transformation** - Transform to UseFormedibleOptions
5. **Schema Inference** - Optionally infer Zod schemas
6. **Error Reporting** - Generate detailed error messages

### Supported Input Formats

- **JSON:** `{"fields": [...]}`
- **JavaScript Objects:** `{fields: [...]}`
- **Zod Expressions:** `z.object({...})`
- **Mixed:** Combination of all formats

## 📖 Documentation

For complete documentation:

- [Main Documentation](https://formedible.dev/docs)
- [Parser Documentation](https://formedible.dev/docs/formedible-parser)
- [AI Builder Integration](https://formedible.dev/docs/ai-builder)
- [API Reference](https://formedible.dev/docs/api)

## 🔗 Related Packages

- [@formedible/core](../formedible) - Core form library
- [@formedible/builder](../builder) - Visual form builder
- [@formedible/ai-builder](../ai-builder) - AI-powered form generation (uses this parser)

## 🤝 Contributing

This is part of a monorepo. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes in `packages/formedible-parser/`
4. Run tests: `npm run test`
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

Built for the Formedible ecosystem:
- [Formedible](../formedible) - The core form library
- [Zod](https://zod.dev) - Schema validation
- [TanStack Form](https://tanstack.com/form) - Form state management

---

**Formedible Parser** - Safe, secure, and intelligent form parsing. 🔒
