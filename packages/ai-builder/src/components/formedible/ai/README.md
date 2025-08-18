# AI Form Renderer

A generic AI form renderer for the formedible ai-builder package that transforms AI-generated schema to formedible-compatible format.

## Features

- **Generic AI schema parsing**: Converts AI-generated form definitions to formedible format
- **Type-safe**: Full TypeScript support with strict typing
- **Extensible**: Easy to add new field types and configurations
- **Schema inference**: Automatically creates Zod schemas from field definitions
- **Error handling**: Comprehensive error reporting and validation
- **Security**: Sanitizes and validates AI-generated code

## Usage

### Basic Usage

```tsx
import { AiFormRenderer, parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';

// Basic form rendering
function MyAiForm() {
  const aiCode = `{
    fields: [
      { name: "email", type: "email", label: "Email Address" },
      { name: "name", type: "text", label: "Full Name" },
      { name: "age", type: "number", label: "Age", min: 18, max: 100 }
    ],
    submitLabel: "Submit Form"
  }`;

  return (
    <AiFormRenderer 
      code={aiCode}
      onSubmit={(data) => console.log('Form submitted:', data)}
      onParseComplete={(result) => {
        if (result.success) {
          console.log('Parse successful:', result.formOptions);
        } else {
          console.error('Parse failed:', result.error);
        }
      }}
    />
  );
}
```

### Advanced Usage with Custom Parser Configuration

```tsx
import { AiFormRenderer, AiParserConfig } from '@/components/formedible/ai/ai-form-renderer';

const customParserConfig: AiParserConfig = {
  allowedFieldTypes: ['text', 'email', 'number', 'select', 'checkbox'],
  allowedKeys: ['fields', 'submitLabel', 'formClassName'],
  // Add custom validation rules
};

function AdvancedAiForm() {
  return (
    <AiFormRenderer 
      code={aiGeneratedCode}
      parserConfig={customParserConfig}
      debug={true}
      className="my-custom-form"
      onSubmit={async (data) => {
        await submitToApi(data);
      }}
    />
  );
}
```

### Using the Parser Function Directly

```tsx
import { parseAiToFormedible } from '@/components/formedible/ai/ai-form-renderer';

function useAiFormParser(aiCode: string) {
  const result = parseAiToFormedible(aiCode);
  
  if (result.success) {
    // Use result.schema and result.formOptions with useFormedible
    return result;
  } else {
    console.error('Parse error:', result.error);
    return null;
  }
}
```

## Supported Field Types

The AI form renderer supports all standard formedible field types:

- **Text fields**: `text`, `email`, `password`, `url`, `tel`
- **Selection**: `select`, `radio`, `multiSelect`, `autocomplete`
- **Input controls**: `checkbox`, `switch`, `slider`, `rating`
- **Numeric**: `number` with min/max/step support
- **Date/Time**: `date` with configuration options
- **Files**: `file` with upload configuration
- **Advanced**: `phone`, `colorPicker`, `location`, `duration`, `masked`
- **Complex**: `object`, `array` with nested field support

## AI Code Format

The AI form renderer expects code in JavaScript object literal format:

```javascript
{
  fields: [
    {
      name: "fieldName",
      type: "fieldType",
      label: "Field Label",
      // Additional field-specific configuration
    }
  ],
  pages: [
    { page: 1, title: "Page 1", description: "First page" }
  ],
  progress: {
    showSteps: true,
    showPercentage: true
  },
  submitLabel: "Submit",
  formOptions: {
    canSubmitWhenInvalid: false
  }
}
```

## API Reference

### `AiFormRenderer` Props

```tsx
interface AiFormRendererProps {
  code: string;                                    // AI-generated form definition
  isStreaming?: boolean;                          // Whether AI is still generating
  onParseComplete?: (result: AiFormParseResult) => void;  // Parse completion callback
  onSubmit?: (formData: Record<string, unknown>) => void | Promise<void>;  // Form submission
  className?: string;                             // CSS class for container
  parserConfig?: AiParserConfig;                 // Custom parser configuration
  debug?: boolean;                               // Enable debug logging
}
```

### `parseAiToFormedible` Function

```tsx
function parseAiToFormedible(
  code: string, 
  config?: AiParserConfig
): AiFormParseResult;
```

### `AiFormParseResult` Type

```tsx
interface AiFormParseResult<TFormData = Record<string, unknown>> {
  schema: z.ZodSchema<TFormData>;              // Generated Zod schema
  formOptions: UseFormedibleOptions<TFormData>; // Formedible configuration
  success: boolean;                            // Whether parsing succeeded
  error?: string;                             // Error message if failed
}
```

## Security

The AI form renderer includes several security measures:

- **Code sanitization**: Removes dangerous JavaScript patterns
- **Field type validation**: Only allows whitelisted field types
- **Key filtering**: Filters out unknown configuration keys
- **Input validation**: Validates all field configurations
- **Safe evaluation**: Uses JSON parsing instead of `eval()`

## Extensibility

To add support for new field types:

1. Add the field type to `DEFAULT_FIELD_TYPES`
2. Add parsing logic in `createSchemaFromFields()`
3. Add default value logic in `createDefaultValues()`
4. Ensure the field component exists in formedible

## Error Handling

The parser provides detailed error messages for:

- Invalid JSON/JavaScript syntax
- Missing required field properties
- Invalid field types
- Configuration validation errors
- Schema generation failures

All errors are caught and returned in the `AiFormParseResult` with descriptive messages.