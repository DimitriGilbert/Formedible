# Formedible AI Builder Sandbox Preview Fix Plan

## Current Flow Analysis

### How it SHOULD work:
1. **AI generates**: ````formedible\n{JSON config}\n`````` code blocks containing Formedible configuration
2. **Extraction**: `extractFormedibleCode()` extracts the JSON config from markdown code blocks  
3. **Form Generation**: JSON config gets passed to `useFormedible(config)` 
4. **Sandbox Preview**: Shows the actual working Formedible form

### What's currently broken:
- The `sandbox-code-injector.ts` has garbage logic trying to handle "JSON as React components" with base64 encoding
- The sandbox preview tries to parse JSON as React component code instead of passing it to `useFormedible`
- The `createSafeFormComponent` function is completely wrong - it should just use `useFormedible`

## The Fix

### What needs to be changed:

#### 1. Fix `sandbox-code-injector.ts`
**Current problem**: The `extractFormComponent()` function tries to detect JSON and create a "safe component" with base64 encoding.

**Fix**: 
- Remove all the `createSafeFormComponent` garbage
- The `extractFormComponent()` should simply return the JSON config as-is
- The sandbox should receive this JSON config and pass it to `useFormedible`

#### 2. Fix the sandbox template
**Current**: Has complex form generation logic trying to build React components from fields

**Fix**:
- FormComponent should be simple: takes config prop, calls `useFormedible(config)`, returns `<Form />`
- Remove all the field generation logic - `useFormedible` handles everything

#### 3. Fix `sandpack-preview.tsx`  
**Current**: Complex logic in `files` useMemo that tries to inject React component code

**Fix**:
- Parse `formCode` as JSON to get the config
- Pass config to simple FormComponent template  
- Let `useFormedible` handle all the form rendering

### Exact Changes Required:

#### File: `/packages/ai-builder/src/lib/sandbox-code-injector.ts`
**Lines to change**: `extractFormComponent()` function (lines 568-629)
**Current**: Complex JSON detection + base64 encoding + createSafeFormComponent
**Replace with**: Simple function that returns the JSON config string as-is

#### File: `/packages/ai-builder/src/lib/sandbox-templates.ts` 
**Lines to change**: `generateFormComponentFromFields()` function
**Current**: Generates React component code with field definitions
**Replace with**: Simple template that takes config prop and calls `useFormedible(config)`

#### File: `/packages/ai-builder/src/components/formedible/ai/sandpack-preview.tsx`
**Lines to change**: `files` useMemo (lines 264-369)
**Current**: Complex injection logic with code splitting and caching
**Replace with**: Simple logic that passes JSON config to FormComponent

### New FormComponent Template:
```tsx
import React from 'react';
import { useFormedible } from './use-formedible';

interface FormComponentProps {
  onSubmit?: (data: Record<string, any>) => void;
  onError?: (error: Error) => void;
  onChange?: (data: Record<string, any>) => void;
}

// The config will be injected here as a constant
const FORM_CONFIG = {CONFIG_JSON_HERE};

export default function FormComponent({ onSubmit, onError, onChange }: FormComponentProps) {
  const { Form } = useFormedible({
    ...FORM_CONFIG,
    formOptions: {
      ...FORM_CONFIG.formOptions,
      onSubmit: async ({ value }) => {
        onSubmit?.(value);
      }
    }
  });

  return <Form />;
}
```

## Safety Measures

1. **Keep all Sandpack infrastructure**: Dependencies, provider setup, toolbar, console, etc.
2. **Only change form rendering logic**: Don't touch Sandpack setup or UI components
3. **Test with simple config first**: Start with basic field config to verify it works
4. **Preserve error handling**: Maintain error boundaries and error messaging

## Files to modify:
1. `/packages/ai-builder/src/lib/sandbox-code-injector.ts` - Fix extractFormComponent
2. `/packages/ai-builder/src/lib/sandbox-templates.ts` - Simplify FormComponent template  
3. `/packages/ai-builder/src/components/formedible/ai/sandpack-preview.tsx` - Fix injection logic
4. Copy changes to `/apps/web/` equivalents using sync script

## Validation:
- AI generates JSON config → Sandpack shows working Formedible form
- All field types work correctly (text, select, checkbox, etc.)
- Multi-page forms work
- Conditional logic works  
- Validation works
- Form submission works