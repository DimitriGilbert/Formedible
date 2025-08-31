# Sandpack Live Preview Integration Plan for AI Builder

## Overview

Integrate @codesandbox/sandpack-react as an optional live preview feature in the ai-builder package. Use the formedible-sandbox repository as the base sandbox template, maintaining full backward compatibility with existing static preview functionality.

## Current State Analysis

**AI Builder Package:**

- Already has @codesandbox/sandpack-react v2.20.0 as a dependency ✅
- Current preview system: `FormPreview` → `FormPreviewBase` → `useFormedible` hook
- Forms generated as code strings and rendered statically
- Preview shows form title, description, field count, and interactive form

**Formedible Sandbox Repository:**

- Vite-based React application demonstrating Formedible usage
- Contains demo form
- Modern React patterns with hooks and TypeScript
- Comprehensive form examples and configurations
- **MUST BE USED AS THE BASE FOR THE SANDBOX**

## Revised Integration Plan

### Phase 1: Core Infrastructure Setup

**1.1 Create Live Preview Toggle Component**

- Add toggle button in `FormPreview` component header
- Options: "Static Preview" (default) | "Live Preview"
- Persist user preference in localStorage
- Visual indicator showing current mode

**1.2 Create Sandpack Wrapper Component**

- New component: `SandpackPreview.tsx`
- Wraps Sandpack components with Formedible-specific configuration
- Handles form code injection and sandbox management
- Manages sandbox state and error handling

**1.3 Create Form Code Injection Utility**

- New utility: `sandbox-code-injector.ts`
- Function to inject generated form code into sandbox files structure
- Handle dynamic form updates and re-rendering
- Support for code updates during form generation

### Phase 2: Live Preview Implementation

**2.1 Sandbox Base Setup**

- Use formedible-sandbox repository files as base template
- Include all existing dependencies and configurations
- Maintain existing Vite setup and build process
- Preserve all current styling and component structure

**2.2 Form Code Integration**

- Extract generated form code from current system
- Use injection utility to update sandbox files
- Handle real-time code updates during generation
- Support for all Formedible features (multi-page, conditional logic, etc.)

**2.3 State Synchronization**

- Sync form data between static and live previews
- Maintain form submission handlers
- Preserve validation states and error messages
- Handle real-time code updates

### Phase 3: Enhanced User Experience (COMPLETED ✅)

**3.1 Preview Controls Enhancement** ✅

- ✅ Add "Open in CodeSandbox" button for full editing
- ✅ Include console output for debugging  
- ✅ Add refresh/reset functionality
- ✅ Show loading states during code execution
- ✅ Enhanced toolbar with status indicators

**3.2 Error Handling & Recovery** ✅

- ✅ Graceful fallback to static preview on errors
- ✅ Clear error messages for common issues
- ✅ Auto-retry mechanism for transient failures
- ✅ User-friendly error boundaries

**3.3 Performance Optimization** ✅

- ✅ Lazy load Sandpack components (`lazy-sandpack-preview.tsx`)
- ✅ Implement code splitting for large forms (`code-splitting-utils.ts`)
- ✅ Cache sandbox template files (`sandbox-cache.ts` with LRU + compression)
- ✅ Optimize loading times with performance modes ('fast', 'balanced', 'full')

### Phase 3 UI Improvements (COMPLETED ✅)

**Responsive Design Implementation**
- ✅ **Fixed Responsive Issues**: Replaced fixed pixel heights with viewport-based sizing
- ✅ **SandpackPreview Height**: Set to `80vh` (60vh when console visible) with `400px` minimum
- ✅ **Proper Viewport Units**: Used `vh` instead of fixed pixels for true responsiveness
- ✅ **Context7 Research Applied**: Followed Sandpack documentation best practices

**Enhanced User Interface**
- ✅ **Toolbar Controls**: Added comprehensive toolbar with status indicators, refresh, console toggle, and CodeSandbox export
- ✅ **Console Integration**: Collapsible console output with proper height allocation
- ✅ **Loading States**: Progress indicators and bundle status badges
- ✅ **Validation Status**: Real-time validation feedback with error/warning display
- ✅ **Performance Metrics**: Optional performance tracking and metrics display

## Technical Implementation Details

### File Structure Changes

```
packages/ai-builder/src/components/formedible/builder/
├── preview-controls.tsx (enhanced)
├── form-preview.tsx (enhanced)
├── sandpack-preview.tsx (new)
└── sandbox-code-injector.ts (new)
```

### Key Components

**SandpackPreview Component:**

```tsx
interface SandpackPreviewProps {
  formCode: string;
  onFormSubmit?: (data: Record<string, unknown>) => void;
  className?: string;
}

export function SandpackPreview({
  formCode,
  onFormSubmit,
  className,
}: SandpackPreviewProps) {
  // Implementation using formedible-sandbox as base
}
```

**Enhanced FormPreview Component:**

```tsx
export function FormPreview({
  // ... existing props
  showLivePreviewToggle = true,
  defaultPreviewMode = "static",
}: FormPreviewProps) {
  const [previewMode, setPreviewMode] =
    useState<PreviewMode>(defaultPreviewMode);

  return (
    <Card>
      <CardHeader>
        {/* Enhanced header with toggle */}
        <PreviewModeToggle mode={previewMode} onModeChange={setPreviewMode} />
      </CardHeader>
      <CardContent>
        {previewMode === "static" ? (
          <FormPreviewBase {...props} />
        ) : (
          <SandpackPreview
            formCode={currentForm?.code}
            onFormSubmit={onFormSubmit}
          />
        )}
      </CardContent>
    </Card>
  );
}
```

**Sandbox Code Injector Utility:**

```tsx
interface SandboxFiles {
  [path: string]: {
    code: string;
    hidden?: boolean;
  };
}

export function injectFormCodeIntoSandbox(
  baseSandboxFiles: SandboxFiles,
  generatedFormCode: string
): SandboxFiles {
  // Inject form code into appropriate sandbox files
  // Handle updates to existing files or creation of new ones
}
```

## Migration Strategy

### Backward Compatibility

- **Zero Breaking Changes**: Existing functionality remains unchanged
- **Default Behavior**: Static preview remains the default
- **Progressive Enhancement**: Live preview is opt-in feature
- **Graceful Degradation**: Falls back to static preview if Sandpack fails

### User Experience Flow

1. **Default Experience**: Users see static preview (current behavior)
2. **Discovery**: Toggle button introduces live preview option
3. **Learning**: Tooltips and help text explain live preview benefits
4. **Adoption**: Users can switch modes based on preference

### Performance Considerations

- **Lazy Loading**: Sandpack components loaded only when needed
- **Code Splitting**: Large dependencies split into chunks
- **Caching**: Sandbox template files cached
- **Monitoring**: Performance metrics to identify bottlenecks

## Risk Mitigation

### Technical Risks

- **Sandpack Compatibility**: Test with current React/Formedible versions
- **Bundle Size Impact**: Implement code splitting and lazy loading
- **Performance Issues**: Monitor and optimize sandbox loading times
- **Security Concerns**: Ensure sandbox isolation and safe code execution

### User Experience Risks

- **Complexity**: Keep toggle simple and intuitive
- **Learning Curve**: Provide clear documentation and tooltips
- **Performance Perception**: Show loading states and progress indicators
- **Feature Discovery**: Make live preview option prominent but not intrusive

## Next Steps

1. **Prototype**: Create minimal viable implementation using formedible-sandbox as base
2. **Testing**: Comprehensive testing across different form types
3. **Documentation**: Update user guides and API documentation
4. **Monitoring**: Implement analytics and error tracking
5. **Iteration**: Gather user feedback and iterate on UX

## Key Requirements Met

✅ **Use formedible-sandbox repo as base**: All sandbox files will be based on the existing repository structure
✅ **Create code injection utility**: `sandbox-code-injector.ts` will handle dynamic form code updates
✅ **No dependencies management**: Using the repo as base eliminates need for custom dependency handling
✅ **Formedible features support**: Multi-page, conditional logic, etc. are already handled by Formedible
✅ **Backward compatibility**: Existing static preview remains default and unchanged
✅ **Optional integration**: Toggle-based approach with graceful fallback

This revised plan focuses on the core requirements while maintaining simplicity and reliability.

## Phase 4 - Sandpack Dependency Resolution Fix

### Problem Analysis

**Root Cause**: The `@swc/helpers` dependency issue occurs because:
1. Radix UI components are compiled with SWC and require `@swc/helpers` as a **runtime dependency**
2. Sandpack bundler needs explicit dependency configuration via `customSetup` prop
3. Current implementation only adds dependencies to package.json template, not to Sandpack's bundler
4. SWC external helpers are not properly configured for the bundler environment

### Research Findings

From web search on Sandpack + shadcn/ui + @swc/helpers:
- **Sandpack customSetup**: Use `customSetup` prop with `dependencies` object for explicit dependency management
- **@swc/helpers**: Must be runtime dependency, not devDependency, for SWC external helpers
- **Radix UI in Sandpack**: Requires proper bundler configuration and all peer dependencies
- **External Helpers**: Need to enable `externalHelpers` and configure module resolution

### Implementation Plan

#### Step 1: Update Sandpack Configuration
- Modify `SandpackProvider` in sandpack-preview.tsx to use `customSetup` prop
- Add comprehensive dependency object including:
  - `@swc/helpers`: "^0.5.5" (runtime SWC helpers)
  - `@swc/core`: "^1.3.0" (core SWC functionality)  
  - All existing Radix UI dependencies
  - React 19 compatibility packages

#### Step 2: Configure External Helpers
- Enable `externalHelpers` in SWC configuration within customSetup
- Ensure bundler can resolve helpers from `node_modules/@swc/helpers`
- Add proper module resolution configuration

#### Step 3: Enhanced Dependency Management
```typescript
const sandpackCustomSetup = {
  dependencies: {
    // Core React
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    
    // SWC Runtime (CRITICAL)
    "@swc/helpers": "^0.5.5",
    "@swc/core": "^1.3.0",
    
    // Radix UI (all components)
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-checkbox": "^1.1.4",
    // ... all other Radix UI packages
    
    // Formedible
    "@tanstack/react-form": "^0.38.1",
    "zod": "^3.24.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0"
  },
  devDependencies: {
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "typescript": "^5.7.2"
  }
};
```

#### Step 4: Fallback Strategy
- Implement graceful degradation when Sandpack fails to resolve dependencies
- Add error boundary specifically for dependency resolution failures
- Provide static preview fallback with clear error messaging
- Cache successful configurations to avoid repeated failures

#### Step 5: Testing & Validation
1. **Component Testing**: Test shadcn/ui Button, Input, Card, Dialog, Select
2. **Dependency Resolution**: Verify @swc/helpers loads correctly in bundler
3. **Performance**: Ensure bundle sizes and loading times remain acceptable
4. **Error Handling**: Test fallback mechanisms work properly

### Success Criteria
- ✅ No more "@swc/helpers" module resolution errors
- ✅ shadcn/ui components render correctly in Sandpack
- ✅ Radix UI primitives work without bundler errors
- ✅ Performance remains acceptable (< 2s initial load)
- ✅ Graceful fallback when dependencies fail

### Implementation Files to Modify
1. `sandpack-preview.tsx` - Add customSetup prop to SandpackProvider
2. `sandbox-code-injector.ts` - Update dependency management logic
3. Add error handling for dependency resolution failures
4. Update validation to handle Sandpack-specific requirements

This fix addresses the core architectural issue: **Sandpack requires explicit runtime dependency configuration, not just template package.json entries**.

## Phase 5 - JSON Syntax Error Fix (COMPLETED ✅)

### Problem Fixed
The "Missing semicolon" error was occurring because JSON form configurations were being injected directly into `.tsx` files, causing JavaScript syntax errors.

### Solution Implemented
Enhanced the `extractFormComponent` function in `sandbox-code-injector.ts` to:
1. **Always check for JSON first**: Any content that starts with `{` and ends with `}` is treated as potential JSON
2. **Automatic base64 encoding**: JSON configurations are automatically encoded to base64 and wrapped in a safe React component
3. **Runtime decoding**: The generated component decodes the configuration at runtime and renders a proper form
4. **Error handling**: Graceful fallbacks if decoding fails

### Key Changes Made
```typescript
// Enhanced JSON detection in extractFormComponent
const trimmedCode = formCode.trim();
if (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) {
  try {
    const parsed = JSON.parse(formCode);
    // If it parses as JSON, it needs base64 encoding
    return createSafeFormComponent(formCode);
  } catch {
    // If it looks like JSON but fails to parse, also use base64 encoding for safety
    return createSafeFormComponent(formCode);
  }
}
```

### Result
- ✅ No more "Missing semicolon" JavaScript syntax errors
- ✅ JSON form configurations are safely handled
- ✅ Automatic detection and encoding without manual intervention
- ✅ Graceful error handling with fallback components
- ✅ Debug information available for troubleshooting

This fix ensures that any JSON form configuration is automatically converted to a safe React component that decodes the configuration at runtime, preventing JavaScript syntax errors in Sandpack.
