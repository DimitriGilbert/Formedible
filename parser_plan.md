# Formedible Parser Package Plan

## 1. Overview

Creating a dedicated shadcn "component" package for the FormedibleParser to allow others to use it in their AI projects. This package will be self-contained, distributable, and only depend on the core formedible package.

## 2. Current State Analysis

### 2.1 Existing FormedibleParser (packages/builder/src/components/formedible/builder/formedible-parser.tsx)

**Current Features:**
- Safe parsing of formedible form definitions
- Handles JSON, JavaScript object literals, and Zod expressions
- Sanitizes dangerous code patterns
- Validates field types and structure
- Removes unknown/dangerous keys
- Handles balanced parentheses in Zod expressions

**Current Limitations:**
- Located in builder package (not standalone)
- No schema merging capability
- No configurable system prompt generation
- No automatic Zod schema inference
- Limited error messaging for AI feedback

**Supported Field Types (from FIELD_TYPE_COMPONENTS + special types):**
```typescript
// From FIELD_TYPE_COMPONENTS in shared-field-renderer.tsx
[
  'text', 'email', 'password', 'url', 'tel',     // Text inputs
  'textarea',                                     // Textarea
  'select', 'radio', 'multiSelect',              // Selection
  'checkbox', 'switch',                          // Boolean inputs
  'number', 'slider',                            // Number inputs
  'date',                                        // Date input
  'file',                                        // File upload
  'colorPicker', 'rating', 'phone',             // Specialized inputs
  'location', 'duration',                        // Complex inputs
  'autocomplete', 'masked',                      // Enhanced text inputs
  'array', 'object'                              // Nested structures (special handling)
]

// CRITICAL: ALLOWED_FIELD_TYPES MUST SUPPORT ALL THESE FIELD TYPES
```

### 2.2 Project Structure Dependencies

**Build System:**
- Turbo for monorepo orchestration
- Individual package.json scripts for building each package
- shadcn build process integrated
- Registry files for component distribution

**Package Dependencies:**
- formedible: Core package with types and components
- builder: Visual form builder with current parser
- ai-builder: AI-powered form builder

**Sync System:**
- scripts/quick-sync.js copies components from packages to web app
- Registry files are SOURCE FILES (registry.json), NOT the built files in public/r/
- shadcn CLI builds public/r/*.json from registry.json during build process
- Build process: package build (includes shadcn build) → quick-sync → web build → sync-components

**Registry Files (SOURCE):**
- packages/formedible/registry.json → use-formedible component
- packages/builder/registry.json → form-builder component  
- packages/ai-builder/registry.json → ai-builder component
- Built files in public/r/ are generated automatically

## 3. New Package Architecture

### 3.1 Package Structure

```
packages/formedible-parser/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── components.json
├── tailwind.config.js
├── src/
│   ├── index.ts
│   ├── components/
│   │   └── formedible/
│   │       └── parser/
│   │           ├── formedible-parser.tsx          # Enhanced parser
│   │           ├── schema-inferrer.tsx            # Zod schema inference
│   │           ├── prompt-generator.tsx           # System prompt generation
│   │           ├── example-generator.tsx          # Configurable examples
│   │           └── types.ts                       # Parser-specific types
│   ├── lib/
│   │   ├── formedible/
│   │   │   ├── parser-types.ts                    # Enhanced types
│   │   │   ├── prompt-templates.ts                # Typesafe prompt parts
│   │   │   └── example-schemas.ts                 # Example configurations
│   │   └── utils.ts
│   └── hooks/
│       └── use-parser-config.ts                   # Configuration hook
├── public/
│   └── r/
│       └── formedible-parser.json                 # Built registry (auto-generated)
└── registry.json                                  # SOURCE registry file
```

### 3.2 Enhanced Parser Features

#### 3.2.1 Schema Merging Capability
```typescript
interface ParserOptions {
  strictValidation?: boolean;
  baseSchema?: z.ZodSchema;           // Schema to merge with parsed schema
  mergeStrategy?: 'extend' | 'override' | 'intersect';
  predefinedHandlers?: {              // Predefined functionality
    onSubmit?: (data: any) => void;
    specificFields?: Record<string, FieldConfig>;
    [key: string]: unknown;
  };
}
```

#### 3.2.2 Enhanced Error Messaging for AI
```typescript
interface ParserError {
  type: 'syntax' | 'validation' | 'field_type' | 'schema';
  message: string;
  suggestion?: string;               // AI-friendly suggestion
  location?: {                       // Error location context
    line?: number;
    column?: number;
    field?: string;
  };
  examples?: string[];               // Valid examples for fixing
}
```

#### 3.2.3 Zod Schema Inference
```typescript
interface SchemaInferenceOptions {
  enabled?: boolean;
  fieldTypeMapping?: Record<string, z.ZodType>;
  defaultValidation?: boolean;
  inferFromValues?: boolean;
}
```

### 3.3 Configurable System Prompt Generation

#### 3.3.1 Configuration Schema
Create a formedible schema for the prompt configuration UI:

```typescript
interface PromptConfiguration {
  includeAllFieldTypes?: boolean;
  selectedFieldTypes?: string[];
  includeValidation?: boolean;
  includeConditionalLogic?: boolean;
  includeMultiPage?: boolean;
  includeAccessibility?: boolean;
  includeAdvancedFeatures?: boolean;
  customInstructions?: string;
  exampleComplexity?: 'simple' | 'medium' | 'complex';
  outputFormat?: 'json' | 'typescript' | 'both';
}

// Formedible schema for UI generation
const promptConfigSchema = z.object({
  includeAllFieldTypes: z.boolean().default(true),
  selectedFieldTypes: z.array(z.enum(ALLOWED_FIELD_TYPES)).optional(),
  includeValidation: z.boolean().default(true),
  includeConditionalLogic: z.boolean().default(false),
  includeMultiPage: z.boolean().default(false),
  includeAccessibility: z.boolean().default(false),
  includeAdvancedFeatures: z.boolean().default(false),
  customInstructions: z.string().optional(),
  exampleComplexity: z.enum(['simple', 'medium', 'complex']).default('medium'),
  outputFormat: z.enum(['json', 'typescript', 'both']).default('json')
});
```

#### 3.3.2 Typesafe Prompt Templates
```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  dependencies?: string[];           // Other templates this depends on
  fieldTypes?: string[];            // Which field types this covers
  complexity: 'simple' | 'medium' | 'complex';
}

// Maintainable prompt parts
const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  baseInstructions: { /* ... */ },
  basicFields: { /* ... */ },
  validationRules: { /* ... */ },
  conditionalLogic: { /* ... */ },
  multiPageForms: { /* ... */ },
  accessibilityGuidelines: { /* ... */ },
  advancedFeatures: { /* ... */ }
};
```

#### 3.3.3 Example Generator
```typescript
interface ExampleConfiguration {
  fieldTypes: string[];
  includeValidation: boolean;
  includeConditionalLogic: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  theme?: 'registration' | 'contact' | 'survey' | 'ecommerce' | 'custom';
}

class ExampleGenerator {
  static generateExample(config: ExampleConfiguration): {
    formDefinition: string;
    zodSchema: string;
    description: string;
  };
}
```

## 4. Package Integration

### 4.1 Build System Integration

**package.json scripts:**
```json
{
  "name": "formedible-parser",
  "version": "0.1.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "build": "tsup src/index.ts --format esm,cjs --dts && rm -f public/r/formedible-parser.json && npx shadcn@latest build",
    "check-types": "npx tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest"
  },
  "peerDependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^4.0.5"
  },
  "dependencies": {
    "formedible": "workspace:*"
  }
}
```

**Root package.json additions:**
```json
{
  "scripts": {
    "build:parser": "turbo -F formedible-parser build",
    "dev:parser": "turbo -F formedible-parser dev",
    "lint:parser": "turbo -F formedible-parser lint",
    "check-types:parser": "turbo -F formedible-parser check-types",
    "test:parser": "turbo -F formedible-parser test"
  }
}
```

### 4.2 Quick-Sync Integration

**scripts/quick-sync.js additions:**
```javascript
// Process parser registry -> web app
const parserRegistry = 'packages/formedible-parser/public/r/formedible-parser.json';
const parserSourceBase = 'packages/formedible-parser/src';
totalCopied += processRegistry(parserRegistry, parserSourceBase, webDestBase);

// Process parser registry -> ai-builder
totalCopied += processRegistry(parserRegistry, parserSourceBase, aiBuilderDestBase);
```

### 4.3 Registry Configuration

**packages/formedible-parser/registry.json (SOURCE):**
```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "formedible-parser",
  "homepage": "https://github.com/DimitriGilbert/Formedible",
  "items": [
    {
      "name": "formedible-parser",
      "type": "registry:block",
      "title": "Formedible Parser",
      "description": "A safe parser for Formedible form definitions with AI-friendly features, schema merging, and configurable prompt generation.",
      "dependencies": [
        "react",
        "zod",
        "formedible"
      ],
      "files": [
        {
          "path": "src/components/formedible/parser/formedible-parser.tsx",
          "type": "registry:component"
        },
        {
          "path": "src/components/formedible/parser/schema-inferrer.tsx",
          "type": "registry:component"
        },
        {
          "path": "src/components/formedible/parser/prompt-generator.tsx",
          "type": "registry:component"
        },
        {
          "path": "src/lib/formedible/parser-types.ts",
          "type": "registry:lib"
        },
        {
          "path": "src/lib/formedible/prompt-templates.ts",
          "type": "registry:lib"
        },
        {
          "path": "src/hooks/use-parser-config.ts",
          "type": "registry:hook"
        }
      ]
    }
  ]
}
```

## 5. API Design

### 5.1 Enhanced FormedibleParser Class

```typescript
export class FormedibleParser {
  // CRITICAL: ALLOWED_FIELD_TYPES must include ALL field types from FIELD_TYPE_COMPONENTS
  private static readonly ALLOWED_FIELD_TYPES = [
    // Text inputs
    'text', 'email', 'password', 'url', 'tel', 'textarea',
    // Selection
    'select', 'radio', 'multiSelect',
    // Boolean inputs  
    'checkbox', 'switch',
    // Number inputs
    'number', 'slider',
    // Date input
    'date',
    // File upload
    'file',
    // Specialized inputs
    'colorPicker', 'rating', 'phone',
    // Complex inputs
    'location', 'duration',
    // Enhanced text inputs
    'autocomplete', 'masked',
    // Nested structures
    'array', 'object'
  ];

  // Existing methods (enhanced)
  static parse(code: string, options?: EnhancedParserOptions): ParsedFormConfig;
  static isValidFieldType(type: string): boolean;
  static getSupportedFieldTypes(): string[];
  
  // New methods
  static parseWithSchemaInference(code: string, options?: SchemaInferenceOptions): {
    config: ParsedFormConfig;
    inferredSchema: z.ZodSchema;
    confidence: number;
  };
  
  static mergeSchemas(
    parsedConfig: ParsedFormConfig, 
    baseSchema: z.ZodSchema,
    strategy?: 'extend' | 'override' | 'intersect'
  ): ParsedFormConfig;
  
  static validateWithSuggestions(code: string): {
    isValid: boolean;
    errors: ParserError[];
    suggestions: string[];
  };
  
  // Configuration methods
  static generateSystemPrompt(config: PromptConfiguration): string;
  static generateExample(config: ExampleConfiguration): {
    formDefinition: string;
    zodSchema: string;
    description: string;
  };
}
```

### 5.2 Hook for Configuration Management

```typescript
export function useParserConfig() {
  return {
    // Prompt configuration
    generatePrompt: (config: PromptConfiguration) => string;
    getAvailableFieldTypes: () => string[];
    getPromptTemplates: () => PromptTemplate[];
    
    // Example generation
    generateExample: (config: ExampleConfiguration) => ExampleResult;
    getExampleThemes: () => string[];
    
    // Parser configuration
    parseWithOptions: (code: string, options: EnhancedParserOptions) => ParsedFormConfig;
    validateCode: (code: string) => ValidationResult;
  };
}
```

## 6. Compatibility Considerations

### 6.1 Backward Compatibility

- Maintain existing FormedibleParser API
- All current functionality preserved
- New features are optional (behind configuration flags)
- Existing imports continue to work

### 6.2 Migration Path

1. **Phase 1:** Create new package with enhanced parser
2. **Phase 2:** Update builder package to use new parser (import change only)
3. **Phase 3:** Update ai-builder package to use new parser
4. **Phase 4:** Deprecate old parser in builder package

### 6.3 Integration Testing

- Ensure all existing tests continue to pass
- Add comprehensive tests for new features
- Test integration with existing packages
- Validate quick-sync process works correctly

## 7. Documentation and Examples

### 7.1 Package README

- Clear installation instructions
- Basic usage examples
- Advanced configuration options
- AI integration examples
- Migration guide from existing parser

### 7.2 TypeScript Documentation

- Comprehensive JSDoc comments
- Type definitions exported
- Usage examples in comments
- Configuration schema documentation

## 8. Future Extensibility

### 8.1 Plugin System

```typescript
interface ParserPlugin {
  name: string;
  version: string;
  enhance: (parser: FormedibleParser) => FormedibleParser;
  fieldTypes?: string[];
  promptTemplates?: PromptTemplate[];
}
```

### 8.2 Custom Field Type Support

- Allow registration of custom field types
- Validation for custom fields
- Prompt generation for custom fields

## 9. Implementation Status

### ✅ Phase 1: Core Package Setup - COMPLETED
1. ✅ Analyze existing implementation
2. ✅ Create package structure (packages/formedible-parser/)
3. ✅ Extract and enhance existing parser (FormedibleParser v2.0.0)
4. ✅ Set up build system integration (turbo + quick-sync)
5. ✅ Basic testing and validation (builds successfully)

**Completed Features:**
- ✅ Standalone formedible-parser package created
- ✅ Enhanced FormedibleParser with 100% backward compatibility
- ✅ Support for ALL 24 field types
- ✅ Self-contained with proper TypeScript definitions
- ✅ Integrated into turbo build system
- ✅ Added to quick-sync script for distribution
- ✅ Proper shadcn registry configuration
- ✅ Build order maintained: package build → quick-sync → web build
- ✅ Files sync correctly to web app and ai-builder
- ✅ No breaking changes to existing packages

### 🚧 Phase 2: Enhanced Features - IN PROGRESS
1. ⏳ Update ai-builder to use new parser
2. Implement schema merging
3. Add AI-friendly error messaging
4. Create basic schema inference

### Phase 3: Prompt Generation - PLANNED
1. Create configuration schema and UI
2. Implement typesafe prompt templates
3. Build example generator
4. Add comprehensive prompt generation

### Phase 4: Integration and Testing - PLANNED
1. Update builder package to use new parser
2. Comprehensive testing
3. Documentation and examples
4. Performance optimization

**Current Status:** Ready for ai-builder integration and enhanced features implementation.