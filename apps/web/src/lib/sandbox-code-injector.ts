import { SandpackFiles } from "@codesandbox/sandpack-react";

// Type definitions for sandbox injection
export interface SandboxFiles {
  [path: string]: {
    code: string;
    hidden?: boolean;
  };
}

export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedComponent?: string;
  hasImports?: boolean;
  hasExports?: boolean;
}

export interface FormCodeMeta {
  componentName?: string;
  hasTypeScript: boolean;
  hasJSX: boolean;
  hasFormedibleImports: boolean;
  imports: string[];
  exports: string[];
}

export interface InjectionOptions {
  /** Whether to wrap the code in error boundaries */
  useErrorBoundary?: boolean;
  /** Additional dependencies to inject */
  additionalDependencies?: Record<string, string>;
  /** Custom CSS to include */
  customStyles?: string;
  /** Whether to enable TypeScript strict mode */
  strictTypeScript?: boolean;
  /** Target file for the form component */
  targetFile?: string;
}

/**
 * Default Formedible dependencies for sandbox environment
 */
const FORMEDIBLE_DEPENDENCIES = {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "typescript": "^5.0.0",
  "lucide-react": "^0.263.1",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "zod": "^3.22.0"
};

/**
 * Default sandbox file templates
 */
const DEFAULT_SANDBOX_TEMPLATES = {
  APP_TSX: `import React from 'react';
import { createRoot } from 'react-dom/client';
import FormComponent from './FormComponent';
import './styles.css';

interface FormData {
  [key: string]: unknown;
}

function App() {
  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    
    // Notify parent component if available
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'FORM_SUBMIT',
        data: data
      }, '*');
    }
  };

  const handleFormError = (error: Error) => {
    console.error('Form error:', error);
    
    // Notify parent component of error
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'FORM_ERROR',
        error: error.message
      }, '*');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <FormComponent 
            onSubmit={handleFormSubmit} 
            onError={handleFormError}
          />
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}`,

  FALLBACK_FORM: `import React from 'react';

interface FormComponentProps {
  onSubmit?: (data: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export default function FormComponent({ onSubmit, onError }: FormComponentProps) {
  return (
    <div className="p-6 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Form Preview
      </h2>
      <div className="space-y-4">
        <p className="text-gray-600">
          Your generated form will appear here once the code is processed.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> The form is being prepared for preview. 
            If you see this message for more than a few seconds, there may be an issue with the generated code.
          </p>
        </div>
      </div>
    </div>
  );
}`,

  ERROR_BOUNDARY: `import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

class FormErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Form error boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Form Rendering Error
          </h3>
          <p className="text-red-600 mb-4">
            There was an error rendering the form component. Please check the generated code for syntax errors.
          </p>
          {this.state.error && (
            <details className="text-sm">
              <summary className="cursor-pointer text-red-700 font-medium">
                Error Details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 text-xs overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;`,

  BASE_STYLES: `/* Formedible Form Preview Styles */
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
  background-color: #f8f9fa;
  line-height: 1.6;
}

/* Form Container Styles */
.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

/* Field Group Styles */
.field-group {
  margin-bottom: 1.5rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input:invalid {
  border-color: #ef4444;
}

.field-input:invalid:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Button Styles */
.submit-button, .primary-button {
  background-color: #3b82f6;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.submit-button:hover, .primary-button:hover {
  background-color: #2563eb;
}

.submit-button:active, .primary-button:active {
  transform: translateY(1px);
}

.secondary-button {
  background-color: #f3f4f6;
  color: #374151;
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.secondary-button:hover {
  background-color: #e5e7eb;
}

/* Error and Success Messages */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.success-message {
  color: #10b981;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Loading States */
.loading {
  opacity: 0.7;
  pointer-events: none;
}

.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }
  
  .field-input,
  .submit-button,
  .primary-button,
  .secondary-button {
    font-size: 0.875rem;
    padding: 0.625rem 1rem;
  }
}`
};

/**
 * Validates the generated form code for syntax and structure
 */
export function validateFormCode(formCode: string): CodeValidationResult {
  const result: CodeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    hasImports: false,
    hasExports: false
  };

  if (!formCode || formCode.trim().length === 0) {
    result.isValid = false;
    result.errors.push("Form code is empty or undefined");
    return result;
  }

  try {
    // Check for basic React component structure
    const hasReactImport = /import\s+.*React.*from\s+['"]react['"]/.test(formCode);
    const hasJSXElements = /<[A-Za-z][^>]*>/.test(formCode);
    const hasExportDefault = /export\s+default/.test(formCode);
    const hasExportFunction = /export\s+(function|const)\s+/.test(formCode);
    
    result.hasImports = /import\s+.*from/.test(formCode);
    result.hasExports = hasExportDefault || hasExportFunction;

    if (!hasReactImport && hasJSXElements) {
      result.warnings.push("JSX detected but React import is missing");
    }

    if (!result.hasExports) {
      result.errors.push("Component must have a default export or named export");
      result.isValid = false;
    }

    // Check for common syntax errors
    const openBraces = (formCode.match(/{/g) || []).length;
    const closeBraces = (formCode.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      result.errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
      result.isValid = false;
    }

    const openParens = (formCode.match(/\(/g) || []).length;
    const closeParens = (formCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      result.errors.push(`Mismatched parentheses: ${openParens} opening, ${closeParens} closing`);
      result.isValid = false;
    }

    // Extract component name if possible
    const componentMatch = formCode.match(/(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/);
    if (componentMatch) {
      result.extractedComponent = componentMatch[1];
    }

    // Check for TypeScript syntax
    if (/:\s*[A-Z][a-zA-Z0-9<>[\]|&\s]*[=;]/.test(formCode) || /interface\s+/.test(formCode)) {
      result.warnings.push("TypeScript syntax detected - ensure proper type definitions");
    }

    // Check for potential security issues (basic check)
    const dangerousPatterns = [
      /dangerouslySetInnerHTML/,
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(formCode)) {
        result.warnings.push("Potentially unsafe code detected - please review");
      }
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Extracts form component from generated code
 */
export function extractFormComponent(formCode: string): string {
  if (!formCode || formCode.trim().length === 0) {
    return DEFAULT_SANDBOX_TEMPLATES.FALLBACK_FORM;
  }

  const validation = validateFormCode(formCode);
  
  if (!validation.isValid) {
    console.warn("Form code validation failed:", validation.errors);
    // Return fallback but with error info
    return `${DEFAULT_SANDBOX_TEMPLATES.FALLBACK_FORM}
    
// Validation errors found in generated code:
// ${validation.errors.map(error => `// - ${error}`).join('\n')}`;
  }

  // If the code is valid, return it with proper formatting
  return formCode.trim();
}

/**
 * Analyzes form code to extract metadata
 */
export function analyzeFormCode(formCode: string): FormCodeMeta {
  const meta: FormCodeMeta = {
    hasTypeScript: false,
    hasJSX: false,
    hasFormedibleImports: false,
    imports: [],
    exports: []
  };

  // Check for TypeScript
  meta.hasTypeScript = /:\s*[A-Z][a-zA-Z0-9<>[\]|&\s]*[=;]/.test(formCode) || 
                      /interface\s+/.test(formCode) || 
                      /type\s+/.test(formCode);

  // Check for JSX
  meta.hasJSX = /<[A-Za-z][^>]*>/.test(formCode);

  // Extract imports
  const importMatches = formCode.match(/import\s+.*from\s+['"][^'"]*['"]/g);
  if (importMatches) {
    meta.imports = importMatches;
    meta.hasFormedibleImports = importMatches.some(imp => 
      imp.includes('formedible') || 
      imp.includes('@/') ||
      imp.includes('lucide-react')
    );
  }

  // Extract exports
  const exportMatches = formCode.match(/export\s+(default\s+)?(function|const|class)\s+([A-Za-z][a-zA-Z0-9]*)/g);
  if (exportMatches) {
    meta.exports = exportMatches;
    
    // Try to extract component name
    const componentMatch = exportMatches[0]?.match(/(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/);
    if (componentMatch) {
      meta.componentName = componentMatch[1];
    }
  }

  return meta;
}

/**
 * Creates complete sandbox files with proper structure
 */
export function createSandboxFiles(
  formCode: string, 
  options: InjectionOptions = {}
): SandpackFiles {
  const {
    useErrorBoundary = true,
    additionalDependencies = {},
    customStyles = "",
    strictTypeScript = true,
    targetFile = "/FormComponent.tsx"
  } = options;

  // Validate and extract form component
  const extractedFormCode = extractFormComponent(formCode);
  const formMeta = analyzeFormCode(extractedFormCode);

  // Create base files
  const files: SandboxFiles = {
    "/App.tsx": {
      code: DEFAULT_SANDBOX_TEMPLATES.APP_TSX
    },
    [targetFile]: {
      code: extractedFormCode
    },
    "/styles.css": {
      code: DEFAULT_SANDBOX_TEMPLATES.BASE_STYLES + (customStyles ? `\n\n/* Custom Styles */\n${customStyles}` : "")
    },
    "/package.json": {
      code: JSON.stringify({
        name: "formedible-preview",
        version: "1.0.0",
        dependencies: {
          ...FORMEDIBLE_DEPENDENCIES,
          ...additionalDependencies
        },
        main: "/App.tsx",
        ...(strictTypeScript && {
          devDependencies: {
            "@typescript-eslint/eslint-plugin": "^6.0.0",
            "@typescript-eslint/parser": "^6.0.0"
          }
        })
      }, null, 2)
    }
  };

  // Add error boundary if requested
  if (useErrorBoundary) {
    files["/ErrorBoundary.tsx"] = {
      code: DEFAULT_SANDBOX_TEMPLATES.ERROR_BOUNDARY
    };

    // Update App.tsx to use error boundary
    files["/App.tsx"].code = files["/App.tsx"].code.replace(
      '<FormComponent',
      `<ErrorBoundary onError={handleFormError}>
          <FormComponent`
    ).replace(
      '/>',
      '/>\n        </ErrorBoundary>'
    ).replace(
      "import FormComponent from './FormComponent';",
      `import FormComponent from './FormComponent';
import ErrorBoundary from './ErrorBoundary';`
    );
  }

  // Add TypeScript config if needed
  if (formMeta.hasTypeScript && strictTypeScript) {
    files["/tsconfig.json"] = {
      code: JSON.stringify({
        compilerOptions: {
          target: "es2018",
          lib: ["dom", "dom.iterable", "es6"],
          allowJs: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: "node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx"
        },
        include: ["src"]
      }, null, 2),
      hidden: true
    };
  }

  return files;
}

/**
 * Main injection function - combines validation, extraction, and file creation
 */
export function injectFormCodeIntoSandbox(
  baseSandboxFiles: SandboxFiles,
  generatedFormCode: string,
  options: InjectionOptions = {}
): SandpackFiles {
  try {
    // Validate the form code first
    const validation = validateFormCode(generatedFormCode);
    
    if (!validation.isValid) {
      console.error("Form code validation failed:", validation.errors);
      
      // Create fallback sandbox with error information
      const fallbackFiles = createSandboxFiles(
        DEFAULT_SANDBOX_TEMPLATES.FALLBACK_FORM, 
        options
      );
      
      // Add error information to the fallback
      const fallbackFile = fallbackFiles["/FormComponent.tsx"];
      if (typeof fallbackFile === 'object' && fallbackFile.code) {
        fallbackFile.code = `${DEFAULT_SANDBOX_TEMPLATES.FALLBACK_FORM}

/* 
 * VALIDATION ERRORS:
 * ${validation.errors.map(error => ` * ${error}`).join('\n')}
 */`;
      }
      
      return fallbackFiles;
    }

    // Create new sandbox files with validated code
    const newFiles = createSandboxFiles(generatedFormCode, options);
    
    // Merge with base files if provided, giving priority to new files
    const mergedFiles = { ...baseSandboxFiles, ...newFiles };
    
    return mergedFiles;

  } catch (error) {
    console.error("Error injecting form code into sandbox:", error);
    
    // Return safe fallback
    return createSandboxFiles(DEFAULT_SANDBOX_TEMPLATES.FALLBACK_FORM, options);
  }
}

/**
 * Utility to update a single file in existing sandbox
 */
export function updateSandboxFile(
  sandboxFiles: SandpackFiles,
  filePath: string,
  newContent: string
): SandpackFiles {
  const existingFile = sandboxFiles[filePath];
  const newFile = typeof existingFile === 'object' 
    ? { ...existingFile, code: newContent }
    : { code: newContent };
    
  return {
    ...sandboxFiles,
    [filePath]: newFile
  };
}

/**
 * Utility to safely get file content from sandbox
 */
export function getSandboxFileContent(
  sandboxFiles: SandpackFiles,
  filePath: string
): string | null {
  const file = sandboxFiles[filePath];
  if (typeof file === 'string') {
    return file;
  }
  return file?.code || null;
}